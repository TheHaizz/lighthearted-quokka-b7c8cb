"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import {
  ChevronLeft,
  Crown,
  FileText,
  Flag,
  Scale,
  Send,
  ShieldCheck,
} from "lucide-react";
import { api, cn } from "@/lib/client";
import { TICKET_TEMPLATES, TICKET_TYPE_META, type TicketType } from "@/lib/types";
import { FieldLabel, Spinner } from "@/components/ui";
import { ImageAttach } from "@/components/ImageAttach";
import { useSession } from "@/components/SessionProvider";

const TYPE_UI: Array<{
  type: TicketType;
  icon: typeof Flag;
  accent: string;
}> = [
  { type: "report", icon: Flag, accent: "#f87171" },
  { type: "appeal", icon: Scale, accent: "#38bdf8" },
  { type: "app_moderator", icon: Crown, accent: "#e4e4e7" },
  { type: "app_admin", icon: ShieldCheck, accent: "#ffd23d" },
];

export default function NewTicketPage() {
  const router = useRouter();
  const { user, loading } = useSession();
  const [type, setType] = useState<TicketType>("report");
  const [title, setTitle] = useState("");
  const [targetName, setTargetName] = useState("");
  const [content, setContent] = useState(TICKET_TEMPLATES.report);
  const [image, setImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [touched, setTouched] = useState(false);

  // preselect type from ?type= query (client-side, no suspense needed)
  useEffect(() => {
    const q = new URLSearchParams(window.location.search).get("type");
    if (q && (Object.keys(TICKET_TYPE_META) as TicketType[]).includes(q as TicketType)) {
      setType(q as TicketType);
      setContent(TICKET_TEMPLATES[q as TicketType]);
    }
  }, []);

  const pick = (t: TicketType) => {
    setType(t);
    if (!touched) setContent(TICKET_TEMPLATES[t]);
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!user) {
      router.push("/login");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const d = await api<{ ticketId: number }>("/api/tickets", {
        body: { type, title, content, targetName, image },
      });
      router.push(`/tickets/${d.ticketId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не удалось отправить");
      setBusy(false);
    }
  };

  if (!loading && !user) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 px-4 text-center">
        <p className="font-display text-lg font-bold">Нужна авторизация</p>
        <p className="max-w-sm text-xs text-zinc-500">
          Репорты, обжалования и заявки принимаются только от зарегистрированных игроков.
        </p>
        <Link href="/login" className="btn btn-primary mt-2 !text-xs">
          Войти по никнейму
        </Link>
      </div>
    );
  }

  const meta = TICKET_TYPE_META[type];

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 md:px-8 md:py-8">
      <Link
        href="/tickets"
        className="mb-4 inline-flex items-center gap-1.5 text-xs font-bold text-zinc-500 transition-colors hover:text-honey"
      >
        <ChevronLeft className="size-4" /> Все обращения
      </Link>

      <h1 className="anim-fade-up font-display text-xl font-bold tracking-wide md:text-2xl">
        Новое обращение
      </h1>
      <p className="anim-fade-up mt-1 text-xs text-zinc-500">
        Выбери тип и заполни шаблон — чем точнее, тем быстрее ответит команда.
      </p>

      {/* type picker */}
      <div className="stagger mt-5 grid grid-cols-2 gap-2.5 md:grid-cols-4">
        {TYPE_UI.map((t) => {
          const m = TICKET_TYPE_META[t.type];
          const Icon = t.icon;
          const active = type === t.type;
          return (
            <button
              key={t.type}
              onClick={() => pick(t.type)}
              className={cn(
                "card group flex flex-col items-start gap-2 p-3.5 text-left transition-all duration-200",
                active
                  ? "border-honey/50 shadow-[0_0_26px_-8px_rgba(255,210,61,0.5)]"
                  : "hover:border-zinc-600",
              )}
            >
              <span
                className="grid size-9 place-items-center rounded-xl border transition-colors"
                style={{
                  color: t.accent,
                  borderColor: active ? `${t.accent}66` : "#2a2a31",
                  background: `${t.accent}12`,
                }}
              >
                <Icon className="size-4" />
              </span>
              <span>
                <span className="block text-xs font-bold text-zinc-100">{m.label}</span>
                <span className="mt-1 block text-[10px] leading-snug text-zinc-500">
                  {m.hint}
                </span>
              </span>
            </button>
          );
        })}
      </div>

      <form onSubmit={submit} className="card anim-fade-up mt-5 space-y-4 p-5 md:p-6">
        <div className="flex items-center gap-2 text-sm font-bold text-honey">
          <FileText className="size-4" /> {meta.label} — шаблон заявки
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <FieldLabel>Тема обращения</FieldLabel>
            <input
              className="input"
              placeholder={
                type === "report"
                  ? "Например: читер на арене"
                  : type === "appeal"
                    ? "Например: бан без причины"
                    : "Например: хочу в команду LoloGrief"
              }
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={140}
            />
          </div>
          {type === "report" && (
            <div>
              <FieldLabel>Ник нарушителя</FieldLabel>
              <input
                className="input"
                placeholder="Кого репортим?"
                value={targetName}
                onChange={(e) => setTargetName(e.target.value)}
                maxLength={40}
              />
            </div>
          )}
        </div>

        <div>
          <FieldLabel>Шаблон — заполни все пункты</FieldLabel>
          <textarea
            className="input min-h-56 resize-y font-mono !text-[13px] leading-relaxed"
            value={content}
            onChange={(e) => {
              setContent(e.target.value);
              setTouched(true);
            }}
            maxLength={4000}
          />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <ImageAttach value={image} onChange={setImage} label="Скриншот / доказательство" />
          <button disabled={busy} className="btn btn-primary">
            {busy ? <Spinner className="size-4 text-black" /> : <Send className="size-4" />}
            Отправить обращение
          </button>
        </div>
        {error && <p className="text-xs font-semibold text-red-300">{error}</p>}

        <p className="rounded-xl border border-line bg-panel2 px-3 py-2 text-[11px] leading-relaxed text-zinc-500">
          {type === "report"
            ? "Репорт увидят только ты, модераторы и администраторы. Ложные репорты наказываются."
            : type === "appeal"
              ? "Обжалование рассматривает администрация. Ответ придёт в этот тикет."
              : "Заявки рассматривает администрация. Если всё подойдёт — получишь корону: белую (модератор) или жёлтую (администратор)."}
        </p>
      </form>
    </div>
  );
}
