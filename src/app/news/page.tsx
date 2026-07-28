"use client";

import { useEffect, useState } from "react";
import { Gift, Megaphone, Newspaper, Users } from "lucide-react";
import { api, cn, timeAgo } from "@/lib/client";
import { NEWS_KIND_META, type NewsKind, type NewsRow } from "@/lib/types";
import { Empty, LoadingBlock, PageHeader, StatusChip } from "@/components/ui";
import { useSession } from "@/components/SessionProvider";

const FILTERS: Array<{ key: NewsKind | "all"; label: string }> = [
  { key: "all", label: "Все" },
  { key: "update", label: "Обновления" },
  { key: "giveaway", label: "Раздачи" },
  { key: "announcement", label: "Анонсы" },
];

export default function NewsPage() {
  const { user } = useSession();
  const [filter, setFilter] = useState<NewsKind | "all">("all");
  const [news, setNews] = useState<NewsRow[] | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);

  const load = () => {
    const q = filter === "all" ? "" : `?kind=${filter}`;
    api<{ news: NewsRow[] }>(`/api/news${q}`)
      .then((d) => setNews(d.news))
      .catch(() => setNews([]));
  };
  useEffect(() => {
    setNews(null);
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  const toggleEnter = async (n: NewsRow) => {
    if (!user) return;
    setBusyId(n.id);
    try {
      const d = await api<{ entered: boolean; entries: number }>(
        `/api/news/${n.id}/enter`,
        { method: "POST" },
      );
      setNews((prev) =>
        prev
          ? prev.map((x) =>
              x.id === n.id ? { ...x, entered: d.entered, entries: d.entries } : x,
            )
          : prev,
      );
    } catch {
      /* ignore */
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 md:px-8 md:py-8">
      <PageHeader
        title="Новости и раздачи"
        sub="Обновления сервера, анонсы событий и регулярные раздачи для игроков"
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

      {!news ? (
        <LoadingBlock />
      ) : news.length === 0 ? (
        <Empty
          icon={<Newspaper className="size-6" />}
          title="Публикаций пока нет"
          hint="Администрация публикует новости через Админ-меню"
        />
      ) : (
        <div className="stagger grid gap-4 md:grid-cols-2">
          {news.map((n) => {
            const meta = NEWS_KIND_META[n.kind];
            const isGiveaway = n.kind === "giveaway";
            return (
              <article
                key={n.id}
                className={cn(
                  "card card-hover relative flex flex-col overflow-hidden p-5",
                  isGiveaway && "border-green-400/30",
                )}
              >
                {isGiveaway && (
                  <div className="absolute -right-10 -top-10 size-32 rounded-full bg-green-400/10 blur-3xl" />
                )}
                <div className="flex items-center gap-2">
                  <StatusChip label={meta.label} color={meta.color} />
                  <span className="text-[10px] text-zinc-600">
                    {timeAgo(n.createdAt)} · {n.authorName}
                  </span>
                </div>
                <h2 className="mt-3 font-display text-base font-bold leading-snug text-zinc-50">
                  {n.title}
                </h2>
                <p className="mt-2 flex-1 whitespace-pre-wrap text-[13px] leading-relaxed text-zinc-400">
                  {n.content}
                </p>
                {n.imageUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={n.imageUrl}
                    alt="Публикация"
                    className="mt-3 max-h-56 rounded-xl border border-line object-cover"
                  />
                )}
                {isGiveaway && (
                  <div className="mt-4 flex items-center gap-3 rounded-xl border border-green-400/25 bg-green-400/5 p-3">
                    <Gift className="size-8 shrink-0 text-green-400" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-green-300">
                        <Users className="mr-1 inline size-3.5" />
                        {n.entries} участвуют
                      </p>
                      <p className="text-[10px] text-zinc-500">
                        {user
                          ? n.entered
                            ? "Ты в списке участников — удачи!"
                            : "Нажми, чтобы попасть в список участников"
                          : "Войди под своим ником, чтобы участвовать"}
                      </p>
                    </div>
                    {user && (
                    <button
                        disabled={busyId === n.id}
                        onClick={() => void toggleEnter(n)}
                        className={cn(
                          "btn shrink-0 !px-3 !py-1.5 !text-xs",
                          n.entered ? "btn-danger" : "btn-primary",
                        )}
                      >
                        {n.entered ? "Выйти" : "Участвовать"}
                      </button>
                    )}
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}

      <div className="mt-6 flex items-center gap-3 rounded-2xl border border-honey/25 bg-honey/5 p-4 text-xs text-zinc-400">
        <Megaphone className="size-5 shrink-0 text-honey" />
        Раздачи проходят каждую неделю: победителя администрация выбирает случайно
        из списка участников и объявляет на форуме и в игре.
      </div>
    </div>
  );
}
