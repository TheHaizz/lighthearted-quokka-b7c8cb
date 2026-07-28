"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { ChevronLeft, Lock, Send, UserRound } from "lucide-react";
import { api, cn, timeAgo } from "@/lib/client";
import {
  TICKET_STATUS_META,
  TICKET_TYPE_META,
  type TicketReply,
  type TicketRow,
  type TicketStatus,
} from "@/lib/types";
import { FieldLabel, LoadingBlock, Spinner, StatusChip } from "@/components/ui";
import { UserChip } from "@/components/UserChip";
import { ImageAttach } from "@/components/ImageAttach";
import { useSession } from "@/components/SessionProvider";

type DetailTicket = Omit<TicketRow, "replyCount">;

interface Detail {
  ticket: DetailTicket;
  replies: TicketReply[];
  canModerate: boolean;
}

const STATUS_FLOW: Array<{ key: TicketStatus; label: string }> = [
  { key: "open", label: "Открыть" },
  { key: "progress", label: "В работу" },
  { key: "accepted", label: "Принять" },
  { key: "rejected", label: "Отклонить" },
];

export default function TicketDetailPage() {
  const params = useParams();
  const id = Number(params.id);
  const { user } = useSession();

  const [data, setData] = useState<Detail | null>(null);
  const [denied, setDenied] = useState<string | null>(null);
  const [content, setContent] = useState("");
  const [image, setImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [statusBusy, setStatusBusy] = useState(false);

  const load = () => {
    api<Detail>(`/api/tickets/${id}`)
      .then(setData)
      .catch((e) => setDenied(e instanceof Error ? e.message : "Нет доступа"));
  };
  useEffect(load, [id]);

  const reply = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const d = await api<{ reply: TicketReply }>(`/api/tickets/${id}`, {
        body: { content, image },
      });
      setData((prev) =>
        prev ? { ...prev, replies: [...prev.replies, d.reply] } : prev,
      );
      setContent("");
      setImage(null);
      load(); // status may auto-move to "progress"
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не удалось отправить");
    } finally {
      setBusy(false);
    }
  };

  const setStatus = async (status: TicketStatus) => {
    setStatusBusy(true);
    try {
      await api(`/api/tickets/${id}`, { method: "PATCH", body: { status } });
      setData((prev) =>
        prev ? { ...prev, ticket: { ...prev.ticket, status } } : prev,
      );
    } catch {
      /* ignore */
    } finally {
      setStatusBusy(false);
    }
  };

  if (denied) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 px-4 text-center text-zinc-500">
        <Lock className="size-8 text-honey" />
        <p className="max-w-sm text-sm font-semibold">{denied}</p>
        <Link href="/tickets" className="btn btn-ghost mt-1 !text-xs">
          К обращениям
        </Link>
      </div>
    );
  }
  if (!data) return <LoadingBlock />;

  const { ticket, replies, canModerate } = data;
  const typeMeta = TICKET_TYPE_META[ticket.type];
  const statusMeta = TICKET_STATUS_META[ticket.status];

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 md:px-8 md:py-8">
      <Link
        href="/tickets"
        className="mb-4 inline-flex items-center gap-1.5 text-xs font-bold text-zinc-500 transition-colors hover:text-honey"
      >
        <ChevronLeft className="size-4" /> Все обращения
      </Link>

      {/* header */}
      <div className="card anim-fade-up relative overflow-hidden p-5 md:p-6">
        <div className="shimmer-line absolute inset-x-0 top-0 h-px" />
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-lg border border-line bg-panel2 px-2 py-1 font-mono text-[11px] text-zinc-400">
            #{ticket.id}
          </span>
          <span className="rounded-lg border border-honey/30 bg-honey/10 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-honey">
            {typeMeta.label}
          </span>
          <StatusChip label={statusMeta.label} color={statusMeta.color} />
          <span className="ml-auto text-[10px] text-zinc-600">
            {timeAgo(ticket.createdAt)}
          </span>
        </div>
        <h1 className="mt-3 font-display text-lg font-bold leading-snug md:text-xl">
          {ticket.title}
        </h1>
        {ticket.targetName && (
          <p className="mt-2 inline-flex items-center gap-1.5 rounded-lg border border-red-400/30 bg-red-400/10 px-2.5 py-1 text-xs font-bold text-red-300">
            <UserRound className="size-3.5" /> На игрока: {ticket.targetName}
          </p>
        )}
        <div className="mt-4 rounded-xl border border-line bg-panel2/70 p-4">
          <div className="mb-2 flex items-center gap-2">
            <UserChip user={ticket.author} size="sm" />
            <span className="text-[10px] text-zinc-600">автор обращения</span>
          </div>
          <p className="whitespace-pre-wrap font-mono text-[13px] leading-relaxed text-zinc-300">
            {ticket.content}
          </p>
          {ticket.imageUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={ticket.imageUrl}
              alt="Доказательство"
              className="mt-3 max-h-80 rounded-xl border border-line object-cover"
            />
          )}
        </div>
      </div>

      {/* staff controls */}
      {canModerate && (
        <div className="anim-fade-up mt-4 flex flex-wrap items-center gap-2 rounded-2xl border border-honey/25 bg-honey/5 p-3.5">
          <span className="mr-1 text-[10px] font-bold uppercase tracking-wider text-zinc-500">
            Управление статусом:
          </span>
          {STATUS_FLOW.map((s) => (
            <button
              key={s.key}
              disabled={statusBusy || ticket.status === s.key}
              onClick={() => void setStatus(s.key)}
              className={cn(
                "rounded-full border px-3 py-1 text-[11px] font-bold transition-all",
                ticket.status === s.key
                  ? "border-honey/60 bg-honey/20 text-honey"
                  : "border-line bg-panel text-zinc-400 hover:border-honey/40 hover:text-honey",
              )}
            >
              {s.label}
            </button>
          ))}
        </div>
      )}

      {/* conversation */}
      <div className="mt-6 space-y-3">
        <h2 className="font-display text-xs font-bold uppercase tracking-[0.25em] text-zinc-500">
          Переписка · {replies.length}
        </h2>
        {replies.map((r) => {
          const staffMsg = r.author.role !== "player";
          return (
            <div
              key={r.id}
              className={cn(
                "card anim-pop p-4",
                staffMsg && "border-honey/25 bg-honey/[0.04]",
              )}
            >
              <div className="flex flex-wrap items-center gap-2">
                <UserChip user={r.author} size="sm" />
                {staffMsg && (
                  <span className="rounded-md border border-honey/40 bg-honey/10 px-1.5 py-px text-[9px] font-bold uppercase tracking-wider text-honey">
                    Команда сервера
                  </span>
                )}
                <span className="ml-auto text-[10px] text-zinc-600">
                  {timeAgo(r.createdAt)}
                </span>
              </div>
              <p className="mt-2.5 whitespace-pre-wrap text-sm leading-relaxed text-zinc-300">
                {r.content}
              </p>
              {r.imageUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={r.imageUrl}
                  alt="Вложение"
                  className="mt-3 max-h-64 rounded-xl border border-line object-cover"
                />
              )}
            </div>
          );
        })}
      </div>

      {/* reply form */}
      {user ? (
        <form onSubmit={reply} className="card anim-fade-up mt-6 space-y-3 p-4 md:p-5">
          <FieldLabel>
            {canModerate && user.id !== ticket.author.id
              ? "Ответ игроку (виден только ему и команде)"
              : "Дополнить обращение"}
          </FieldLabel>
          <textarea
            className="input min-h-24 resize-y"
            placeholder="Напиши сообщение…"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            maxLength={3000}
          />
          <div className="flex flex-wrap items-center justify-between gap-3">
            <ImageAttach value={image} onChange={setImage} />
            <button disabled={busy} className="btn btn-primary">
              {busy ? <Spinner className="size-4 text-black" /> : <Send className="size-4" />}
              Отправить
            </button>
          </div>
          {error && <p className="text-xs font-semibold text-red-300">{error}</p>}
        </form>
      ) : (
        <p className="mt-6 text-center text-xs text-zinc-600">
          Войди, чтобы отвечать в обращении.
        </p>
      )}
    </div>
  );
}
