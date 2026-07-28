"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ChevronRight,
  Crown,
  Flag,
  Inbox,
  Plus,
  Reply,
  Scale,
  ShieldCheck,
} from "lucide-react";
import { api, cn, timeAgo } from "@/lib/client";
import {
  TICKET_STATUS_META,
  TICKET_TYPE_META,
  type TicketRow,
  type TicketType,
} from "@/lib/types";
import { Empty, LoadingBlock, PageHeader, StatusChip } from "@/components/ui";
import { UserChip } from "@/components/UserChip";
import { useSession } from "@/components/SessionProvider";

const TYPE_ICONS: Record<TicketType, typeof Flag> = {
  report: Flag,
  appeal: Scale,
  app_moderator: Crown,
  app_admin: ShieldCheck,
};

const FILTERS: Array<{ key: TicketType | "all"; label: string }> = [
  { key: "all", label: "Все" },
  { key: "report", label: "Репорты" },
  { key: "appeal", label: "Обжалования" },
  { key: "app_moderator", label: "Заявки · Модератор" },
  { key: "app_admin", label: "Заявки · Админ" },
];

export default function TicketsPage() {
  const { user, adminUnlocked, loading } = useSession();
  const [filter, setFilter] = useState<TicketType | "all">("all");
  const [data, setData] = useState<{ tickets: TicketRow[]; isStaff: boolean } | null>(null);
  const [denied, setDenied] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!user && !adminUnlocked) {
      setDenied(true);
      return;
    }
    const q = filter === "all" ? "" : `?type=${filter}`;
    api<{ tickets: TicketRow[]; isStaff: boolean }>(`/api/tickets${q}`)
      .then(setData)
      .catch(() => setDenied(true));
  }, [filter, user, adminUnlocked, loading]);

  if (denied) {
    return (
      <div className="flex h-full items-center justify-center px-4">
        <Empty
          icon={<Inbox className="size-6" />}
          title="Обращения — только для игроков"
          hint="Репорты, обжалования банов и заявки в команду доступны после входа. Репорты видят только их автор, модераторы и администраторы."
          action={
            <Link href="/login" className="btn btn-primary mt-2 !text-xs">
              Войти по никнейму
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 md:px-8 md:py-8">
      <PageHeader
        title={data?.isStaff ? "Входящие обращения" : "Мои обращения"}
        sub={
          data?.isStaff
            ? "Репорты, обжалования и заявки игроков — видны модераторам и администраторам"
            : "Репорты, обжалования бана и заявки в команду — ответит команда сервера"
        }
        right={
          <Link href="/tickets/new" className="btn btn-primary">
            <Plus className="size-4" /> Новое обращение
          </Link>
        }
      />

      <div className="mb-5 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={cn(
              "rounded-full border px-3 py-1.5 text-[11px] font-bold transition-all",
              filter === f.key
                ? "border-honey/50 bg-honey/15 text-honey shadow-[0_0_18px_-4px_rgba(255,210,61,0.5)]"
                : "border-line bg-panel text-zinc-500 hover:border-zinc-600 hover:text-zinc-200",
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {!data ? (
        <LoadingBlock />
      ) : data.tickets.length === 0 ? (
        <Empty
          icon={<Inbox className="size-6" />}
          title="Обращений нет"
          hint="Создай первое обращение — команда сервера ответит прямо здесь"
          action={
            <Link href="/tickets/new" className="btn btn-primary mt-2 !text-xs">
              Создать обращение
            </Link>
          }
        />
      ) : (
        <div className="stagger space-y-2.5">
          {data.tickets.map((t) => {
            const typeMeta = TICKET_TYPE_META[t.type];
            const statusMeta = TICKET_STATUS_META[t.status];
            const Icon = TYPE_ICONS[t.type];
            return (
              <Link
                key={t.id}
                href={`/tickets/${t.id}`}
                className="card card-hover group flex items-center gap-4 px-4 py-3.5"
              >
                <span className="grid size-10 shrink-0 place-items-center rounded-xl border border-line bg-panel2 text-honey">
                  <Icon className="size-4" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="truncate font-bold text-zinc-100">
                      #{t.id} · {t.title}
                    </span>
                    <StatusChip label={statusMeta.label} color={statusMeta.color} />
                  </span>
                  <span className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-zinc-500">
                    <span className="font-semibold text-zinc-400">{typeMeta.label}</span>
                    <span>·</span>
                    <UserChip user={t.author} size="sm" />
                    <span>· {timeAgo(t.createdAt)}</span>
                    {t.replyCount > 0 && (
                      <span className="inline-flex items-center gap-1 text-honey">
                        <Reply className="size-3" /> {t.replyCount}
                      </span>
                    )}
                  </span>
                </span>
                <ChevronRight className="size-4 shrink-0 text-zinc-600 transition-transform duration-300 group-hover:translate-x-1 group-hover:text-honey" />
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
