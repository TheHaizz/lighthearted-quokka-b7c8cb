"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Check,
  ChevronRight,
  ClipboardList,
  Copy,
  Crown,
  Flag,
  Gift,
  MessageCircle,
  MessagesSquare,
  Newspaper,
  Scale,
  ScrollText,
  Terminal,
  Users,
} from "lucide-react";
import { api, cn, timeAgo } from "@/lib/client";
import { NEWS_KIND_META, type NewsRow } from "@/lib/types";
import { StatusChip } from "@/components/ui";
import { useSession } from "@/components/SessionProvider";

interface Stats {
  players: number;
  users: number;
  topics: number;
  openTickets: number;
  giveaways: number;
}

const TILES = [
  { href: "/forum", label: "Форум", desc: "Ветки и обсуждения", icon: MessagesSquare },
  { href: "/chat", label: "Общий чат", desc: "Общение игроков", icon: MessageCircle },
  { href: "/tickets/new?type=report", label: "Репорт", desc: "Жалоба на нарушителя", icon: Flag },
  { href: "/tickets/new?type=appeal", label: "Обжалование", desc: "Снять бан", icon: Scale },
  { href: "/tickets/new?type=app_moderator", label: "Заявка в команду", desc: "Модератор / админ", icon: Crown },
  { href: "/news?kind=giveaway", label: "Раздачи", desc: "Призы и конкурсы", icon: Gift },
  { href: "/rules", label: "Правила", desc: "Сводка правил", icon: ScrollText },
  { href: "/news", label: "Обновления", desc: "Что нового", icon: Newspaper },
];

const QUICK_RULES = [
  "Без читов, X-Ray и макросов — бан без предупреждения.",
  "Уважай игроков: оскорбления и токсичность наказываются мутом.",
  "Спам, флуд и реклама сторонних серверов запрещены.",
  "Не обходи наказания через твинки — бан всех аккаунтов.",
];

const TICKER =
  "LoloGrief · Tablet OS 2.6.1 · play.lologrief.fun · Раздача каждую неделю · Набор в модераторы открыт · ";

export default function HomePage() {
  const { user } = useSession();
  const [stats, setStats] = useState<Stats | null>(null);
  const [news, setNews] = useState<NewsRow[]>([]);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    api<Stats>("/api/stats").then(setStats).catch(() => {});
    api<{ news: NewsRow[] }>("/api/news")
      .then((d) => setNews(d.news.slice(0, 3)))
      .catch(() => {});
  }, []);

  const copyIp = async () => {
    try {
      await navigator.clipboard.writeText("play.lologrief.fun");
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      /* ignore */
    }
  };

  const statCards = [
    { label: "Онлайн сейчас", value: stats ? String(stats.players) : "…", glow: true },
    { label: "Игроков", value: stats ? String(stats.users) : "…" },
    { label: "Тем на форуме", value: stats ? String(stats.topics) : "…" },
    { label: "Открытых тикетов", value: stats ? String(stats.openTickets) : "…" },
  ];

  return (
    <div className="mx-auto max-w-5xl space-y-8 px-4 py-6 md:px-8 md:py-8">
      {/* hero */}
      <motion.section
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="card relative overflow-hidden p-6 md:p-8"
      >
        <div className="honeycomb absolute inset-0 opacity-50" />
        <div className="absolute -right-20 -top-24 size-72 rounded-full bg-honey/10 blur-[90px]" />
        <div className="shimmer-line absolute inset-x-0 top-0 h-px" />

        <div className="relative grid gap-8 md:grid-cols-[1.5fr_1fr]">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-honey/30 bg-honey/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.22em] text-honey">
              <Terminal className="size-3.5" />
              Tablet OS · Server Edition · v2.6.1
            </div>
            <h1 className="mt-4 font-display text-3xl font-black leading-[1.05] tracking-tight md:text-5xl">
              LOLO<span className="text-honey text-glow">GRIEF</span>
              <span className="mt-2 block text-base font-bold tracking-wide text-zinc-400 md:text-lg">
                официальный форум — LoloForum
              </span>
            </h1>
            <p className="mt-4 max-w-lg text-sm leading-relaxed text-zinc-400">
              Общайся с игроками, читай обновления, участвуй в раздачах, подавай
              репорты, обжалуй баны и вступай в команду сервера — всё внутри
              одного планшета.
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <button onClick={copyIp} className="btn btn-primary">
                {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
                {copied ? "IP скопирован" : "play.lologrief.fun"}
              </button>
              {!user && (
                <Link href="/register" className="btn btn-ghost">
                  Создать аккаунт
                  <ChevronRight className="size-4" />
                </Link>
              )}
            </div>
            <div className="mt-7 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
              {statCards.map((s) => (
                <div
                  key={s.label}
                  className={cn(
                    "rounded-xl border bg-panel2/80 px-3 py-2.5",
                    s.glow ? "border-honey/40" : "border-line",
                  )}
                >
                  <p
                    className={cn(
                      "font-display text-xl font-bold",
                      s.glow ? "text-honey" : "text-zinc-100",
                    )}
                  >
                    {s.value}
                  </p>
                  <p className="mt-0.5 text-[10px] uppercase tracking-wider text-zinc-500">
                    {s.label}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* terminal card */}
          <div className="hidden flex-col overflow-hidden rounded-2xl border border-line bg-[#0c0c0f] md:flex">
            <div className="flex items-center gap-1.5 border-b border-line px-4 py-2.5">
              <span className="size-2.5 rounded-full bg-red-400/70" />
              <span className="size-2.5 rounded-full bg-honey/70" />
              <span className="size-2.5 rounded-full bg-green-400/70" />
              <span className="ml-2 font-mono text-[10px] text-zinc-500">
                lologrief — терминал
              </span>
            </div>
            <div className="flex-1 space-y-1.5 p-4 font-mono text-[11px] leading-relaxed">
              <p className="text-zinc-500">$ lolo boot --tablet</p>
              <p className="text-green-400">✓ ядро Tablet OS загружено</p>
              <p className="text-green-400">✓ модуль форума активен</p>
              <p className="text-green-400">✓ тикет-система v2 онлайн</p>
              <p className="text-honey">→ players: {stats?.players ?? "…"} online</p>
              <p className="text-honey">→ giveaways: {stats?.giveaways ?? "…"} active</p>
              <p className="text-zinc-500">
                $ <span className="anim-blink text-honey">▍</span>
              </p>
            </div>
          </div>
        </div>
      </motion.section>

      {/* ticker */}
      <div className="relative overflow-hidden rounded-xl border border-line bg-panel py-2">
        <div className="anim-marquee flex w-max whitespace-nowrap font-mono text-[11px] uppercase tracking-[0.2em] text-zinc-500">
          <span>{TICKER.repeat(3)}</span>
          <span>{TICKER.repeat(3)}</span>
        </div>
      </div>

      {/* app tiles */}
      <section>
        <h2 className="mb-4 font-display text-sm font-bold uppercase tracking-[0.25em] text-zinc-400">
          Приложения планшета
        </h2>
        <div className="stagger grid grid-cols-2 gap-3 md:grid-cols-4">
          {TILES.map((t) => {
            const Icon = t.icon;
            return (
              <Link
                key={t.href + t.label}
                href={t.href}
                className="card card-hover group relative overflow-hidden p-4"
              >
                <div className="absolute -right-8 -top-8 size-24 rounded-full bg-honey/0 blur-2xl transition-all duration-300 group-hover:bg-honey/15" />
                <span className="grid size-11 place-items-center rounded-xl border border-line bg-panel2 text-honey transition-all duration-300 group-hover:border-honey/50 group-hover:shadow-[0_0_20px_-2px_rgba(255,210,61,0.5)]">
                  <Icon className="size-5" />
                </span>
                <p className="mt-3 text-sm font-bold text-zinc-100">{t.label}</p>
                <p className="mt-0.5 text-[11px] text-zinc-500">{t.desc}</p>
              </Link>
            );
          })}
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        {/* latest news */}
        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-sm font-bold uppercase tracking-[0.25em] text-zinc-400">
              Последние новости
            </h2>
            <Link
              href="/news"
              className="text-xs font-bold text-honey transition-opacity hover:opacity-70"
            >
              Все публикации →
            </Link>
          </div>
          <div className="stagger space-y-3">
            {news.map((n) => {
              const meta = NEWS_KIND_META[n.kind];
              return (
                <Link key={n.id} href="/news" className="card card-hover block p-4">
                  <div className="flex items-center gap-2">
                    <StatusChip label={meta.label} color={meta.color} />
                    <span className="text-[10px] text-zinc-600">
                      {timeAgo(n.createdAt)} · {n.authorName}
                    </span>
                    {n.kind === "giveaway" && (
                      <span className="ml-auto inline-flex items-center gap-1 text-[10px] font-bold text-green-400">
                        <Users className="size-3" /> {n.entries}
                      </span>
                    )}
                  </div>
                  <p className="mt-2 font-bold text-zinc-100">{n.title}</p>
                  <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-zinc-500">
                    {n.content}
                  </p>
                </Link>
              );
            })}
            {news.length === 0 && (
              <div className="card p-6 text-center text-xs text-zinc-500">
                Публикации загружаются…
              </div>
            )}
          </div>
        </section>

        {/* quick rules */}
        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-sm font-bold uppercase tracking-[0.25em] text-zinc-400">
              Запомни правила
            </h2>
            <Link
              href="/rules"
              className="text-xs font-bold text-honey transition-opacity hover:opacity-70"
            >
              Полная сводка →
            </Link>
          </div>
          <div className="card p-5">
            <ul className="space-y-3.5">
              {QUICK_RULES.map((r, i) => (
                <li key={i} className="flex gap-3 text-xs leading-relaxed text-zinc-400">
                  <span className="grid size-6 shrink-0 place-items-center rounded-lg border border-honey/30 bg-honey/10 font-display text-[11px] font-bold text-honey">
                    {i + 1}
                  </span>
                  {r}
                </li>
              ))}
            </ul>
            <div className="mt-5 flex items-center gap-2 rounded-xl border border-line bg-panel2 px-3 py-2.5 text-[11px] text-zinc-500">
              <ClipboardList className="size-4 shrink-0 text-honey" />
              Нарушителя увидел? Подай репорт во вкладке «Обращения».
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
