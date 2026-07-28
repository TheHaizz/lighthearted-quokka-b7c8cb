"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Lock,
  MessageSquare,
  Plus,
  Send,
} from "lucide-react";
import { api, cn, timeAgo } from "@/lib/client";
import type { Section, TopicRow } from "@/lib/types";
import { Empty, FieldLabel, LoadingBlock, PageHeader, Spinner } from "@/components/ui";
import { SectionIcon } from "@/components/SectionIcon";
import { UserChip } from "@/components/UserChip";
import { ImageAttach } from "@/components/ImageAttach";
import { useSession } from "@/components/SessionProvider";

export default function SectionPage() {
  const params = useParams();
  const router = useRouter();
  const id = Number(params.id);
  const { user, adminUnlocked } = useSession();

  const [sections, setSections] = useState<Section[] | null>(null);
  const [topics, setTopics] = useState<TopicRow[] | null>(null);
  const [composerOpen, setComposerOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [image, setImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const section = sections?.find((s) => s.id === id) ?? null;
  const isStaff = Boolean(user?.isStaff || adminUnlocked);
  const canCreate = Boolean(user) && (isStaff || !section?.isClosed);

  useEffect(() => {
    api<{ sections: Section[] }>("/api/sections")
      .then((d) => setSections(d.sections))
      .catch(() => setSections([]));
    api<{ topics: TopicRow[] }>(`/api/topics?sectionId=${id}`)
      .then((d) => setTopics(d.topics))
      .catch(() => setTopics([]));
  }, [id]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const d = await api<{ topicId: number }>("/api/topics", {
        body: { sectionId: id, title, content, image },
      });
      router.push(`/forum/topic/${d.topicId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не удалось создать тему");
      setBusy(false);
    }
  };

  if (!sections || !topics) return <LoadingBlock />;

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 md:px-8 md:py-8">
      <Link
        href="/forum"
        className="mb-4 inline-flex items-center gap-1.5 text-xs font-bold text-zinc-500 transition-colors hover:text-honey"
      >
        <ChevronLeft className="size-4" /> Все ветки
      </Link>

      <PageHeader
        title={section?.title ?? "Ветка"}
        sub={section?.description || undefined}
        right={
          canCreate ? (
            <button
              onClick={() => setComposerOpen((v) => !v)}
              className={cn("btn", composerOpen ? "btn-ghost" : "btn-primary")}
            >
              <Plus className="size-4" />
              {composerOpen ? "Скрыть" : "Новая тема"}
            </button>
          ) : undefined
        }
      />

      {section?.isClosed && (
        <div className="anim-fade-up mb-5 flex items-center gap-3 rounded-2xl border border-red-400/30 bg-red-400/10 px-4 py-3 text-xs font-semibold text-red-200">
          <Lock className="size-4 shrink-0" />
          Ветка закрыта модерацией: новые темы и ответы могут оставлять только модераторы и администраторы.
        </div>
      )}

      {composerOpen && canCreate && (
        <form
          onSubmit={submit}
          className="card anim-pop mb-6 space-y-4 border-honey/25 p-5"
        >
          <div className="flex items-center gap-2 text-sm font-bold text-honey">
            <SectionIcon name={section?.icon ?? "MessagesSquare"} className="size-4" />
            Новая тема в «{section?.title}»
          </div>
          <div>
            <FieldLabel>Заголовок темы</FieldLabel>
            <input
              className="input"
              placeholder="О чём поговорим?"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={140}
            />
          </div>
          <div>
            <FieldLabel>Первое сообщение</FieldLabel>
            <textarea
              className="input min-h-28 resize-y"
              placeholder="Текст сообщения…"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              maxLength={4000}
            />
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <ImageAttach value={image} onChange={setImage} />
            <button disabled={busy} className="btn btn-primary">
              {busy ? <Spinner className="size-4 text-black" /> : <Send className="size-4" />}
              Опубликовать тему
            </button>
          </div>
          {error && <p className="text-xs font-semibold text-red-300">{error}</p>}
        </form>
      )}

      {topics.length === 0 ? (
        <Empty
          icon={<MessageSquare className="size-6" />}
          title="В ветке пока пусто"
          hint={user ? "Создай первую тему кнопкой выше" : "Войди, чтобы создать первую тему"}
        />
      ) : (
        <div className="stagger space-y-2.5">
          {topics.map((t) => (
            <Link
              key={t.id}
              href={`/forum/topic/${t.id}`}
              className="card card-hover group flex items-center gap-4 px-4 py-3.5"
            >
              <span className="grid size-9 shrink-0 place-items-center rounded-xl border border-line bg-panel2 text-zinc-500 transition-colors group-hover:text-honey">
                <MessageSquare className="size-4" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate font-bold text-zinc-100">{t.title}</span>
                <span className="mt-0.5 flex items-center gap-2 text-[11px] text-zinc-500">
                  <UserChip user={t.author} size="sm" />
                  <span>· {timeAgo(t.createdAt)}</span>
                </span>
              </span>
              <span className="hidden shrink-0 text-right sm:block">
                <span className="block font-mono text-xs text-zinc-300">
                  {t.postCount} отв.
                </span>
                <span className="text-[10px] text-zinc-600">
                  {t.lastAt ? `обновлено ${timeAgo(t.lastAt)}` : "без ответов"}
                </span>
              </span>
              <ChevronRight className="size-4 shrink-0 text-zinc-600 transition-transform duration-300 group-hover:translate-x-1 group-hover:text-honey" />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
