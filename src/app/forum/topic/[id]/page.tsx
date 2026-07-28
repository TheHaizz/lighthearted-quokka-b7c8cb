"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { ChevronLeft, Lock, Send, Trash2 } from "lucide-react";
import { api, timeAgo } from "@/lib/client";
import type { PostRow } from "@/lib/types";
import { FieldLabel, LoadingBlock, PageHeader, Spinner } from "@/components/ui";
import { UserChip } from "@/components/UserChip";
import { ImageAttach } from "@/components/ImageAttach";
import { useSession } from "@/components/SessionProvider";

interface TopicData {
  topic: { id: number; sectionId: number; title: string; createdAt: string };
  section: { id: number; title: string; icon: string; isClosed: boolean };
  posts: PostRow[];
  canModerate: boolean;
}

export default function TopicPage() {
  const params = useParams();
  const id = Number(params.id);
  const { user } = useSession();

  const [data, setData] = useState<TopicData | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [content, setContent] = useState("");
  const [image, setImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = () => {
    api<TopicData>(`/api/topics?id=${id}`)
      .then(setData)
      .catch(() => setNotFound(true));
  };
  useEffect(load, [id]);

  const reply = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const d = await api<{ post: PostRow }>("/api/posts", {
        body: { topicId: id, content, image },
      });
      setData((prev) =>
        prev ? { ...prev, posts: [...prev.posts, d.post] } : prev,
      );
      setContent("");
      setImage(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не удалось отправить");
    } finally {
      setBusy(false);
    }
  };

  const removePost = async (postId: number) => {
    try {
      await api(`/api/posts?id=${postId}`, { method: "DELETE" });
      setData((prev) =>
        prev ? { ...prev, posts: prev.posts.filter((p) => p.id !== postId) } : prev,
      );
    } catch {
      /* ignore */
    }
  };

  if (notFound) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 text-zinc-500">
        <p className="font-display text-lg font-bold">Тема не найдена</p>
        <Link href="/forum" className="btn btn-ghost !text-xs">
          К списку веток
        </Link>
      </div>
    );
  }
  if (!data) return <LoadingBlock />;

  const closed = data.section.isClosed;
  const canAnswer = Boolean(user) && (!closed || data.canModerate);

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 md:px-8 md:py-8">
      <Link
        href={`/forum/${data.section.id}`}
        className="mb-4 inline-flex items-center gap-1.5 text-xs font-bold text-zinc-500 transition-colors hover:text-honey"
      >
        <ChevronLeft className="size-4" /> {data.section.title}
      </Link>

      <PageHeader title={data.topic.title} sub={`Тема · ${data.posts.length} сообщений`} />

      {closed && (
        <div className="anim-fade-up mb-5 flex items-center gap-3 rounded-2xl border border-red-400/30 bg-red-400/10 px-4 py-3 text-xs font-semibold text-red-200">
          <Lock className="size-4 shrink-0" /> Ветка закрыта — отвечать могут только модераторы и администраторы.
        </div>
      )}

      <div className="stagger space-y-3">
        {data.posts.map((p, idx) => (
          <article
            key={p.id}
            className="card group relative overflow-hidden p-4 md:p-5"
          >
            <span className="absolute right-3 top-3 font-mono text-[10px] text-zinc-700">
              #{idx + 1}
            </span>
            <div className="flex flex-wrap items-center gap-2">
              <UserChip user={p.author} />
              <span className="text-[10px] text-zinc-600">{timeAgo(p.createdAt)}</span>
              {data.canModerate && idx > 0 && (
                <button
                  onClick={() => void removePost(p.id)}
                  className="ml-auto grid size-7 place-items-center rounded-lg border border-line text-zinc-600 opacity-0 transition-all hover:border-red-400/40 hover:text-red-300 group-hover:opacity-100"
                  title="Удалить сообщение"
                >
                  <Trash2 className="size-3.5" />
                </button>
              )}
            </div>
            <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-zinc-300">
              {p.content}
            </p>
            {p.imageUrl && (
              // eslint-disable-next-line @next/next/no-img-element
            <img
                src={p.imageUrl}
                alt="Вложение"
                className="mt-3 max-h-72 rounded-xl border border-line object-cover"
              />
            )}
          </article>
        ))}
      </div>

      {/* reply composer */}
      {user ? (
        canAnswer ? (
          <form onSubmit={reply} className="card anim-fade-up mt-6 space-y-3 p-4 md:p-5">
            <FieldLabel>Твой ответ</FieldLabel>
            <textarea
              className="input min-h-24 resize-y"
              placeholder="Напиши ответ в тему…"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              maxLength={4000}
            />
            <div className="flex flex-wrap items-center justify-between gap-3">
              <ImageAttach value={image} onChange={setImage} />
              <button disabled={busy} className="btn btn-primary">
                {busy ? <Spinner className="size-4 text-black" /> : <Send className="size-4" />}
                Ответить
              </button>
            </div>
            {error && <p className="text-xs font-semibold text-red-300">{error}</p>}
          </form>
        ) : (
          <p className="mt-6 text-center text-xs text-zinc-600">
            Ветка закрыта — ответы доступны только команде сервера.
          </p>
        )
      ) : (
        <div className="card mt-6 flex flex-col items-center gap-3 p-6 text-center">
          <p className="text-sm text-zinc-400">Войди, чтобы ответить в теме</p>
          <Link href="/login" className="btn btn-primary !text-xs">
            Войти по никнейму
          </Link>
        </div>
      )}
    </div>
  );
}
