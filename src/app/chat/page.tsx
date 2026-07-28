"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { MessageCircle, Send, Trash2 } from "lucide-react";
import { api, cn, fmtTime } from "@/lib/client";
import type { ChatMsg } from "@/lib/types";
import { Spinner } from "@/components/ui";
import { UserChip } from "@/components/UserChip";
import { ImageAttach } from "@/components/ImageAttach";
import { useSession } from "@/components/SessionProvider";

export default function ChatPage() {
  const { user } = useSession();
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [canModerate, setCanModerate] = useState(false);
  const [content, setContent] = useState("");
  const [image, setImage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const lastIdRef = useRef(0);
  const boxRef = useRef<HTMLDivElement>(null);
  const stickRef = useRef(true);

  // initial load + polling
  useEffect(() => {
    let alive = true;
    const load = () => {
      api<{ messages: ChatMsg[]; canModerate: boolean }>(
        `/api/chat?after=${lastIdRef.current}`,
      )
        .then((d) => {
          if (!alive) return;
          setCanModerate(d.canModerate);
          if (d.messages.length > 0) {
            lastIdRef.current = d.messages[d.messages.length - 1].id;
            setMessages((prev) => {
              const seen = new Set(prev.map((m) => m.id));
              const fresh = d.messages.filter((m) => !seen.has(m.id));
              return [...prev, ...fresh].slice(-200);
            });
          }
        })
        .catch(() => {});
    };
    load();
    const t = setInterval(load, 2500);
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, []);

  // autoscroll
  useEffect(() => {
    const box = boxRef.current;
    if (box && stickRef.current) {
      box.scrollTop = box.scrollHeight;
    }
  }, [messages]);

  const onScroll = () => {
    const box = boxRef.current;
    if (!box) return;
    stickRef.current = box.scrollHeight - box.scrollTop - box.clientHeight < 80;
  };

  const send = async (e: FormEvent) => {
    e.preventDefault();
    if (!content.trim() && !image) return;
    setBusy(true);
    setError(null);
    try {
      const d = await api<{ message: ChatMsg }>("/api/chat", {
        body: { content, image },
      });
      setMessages((prev) => [...prev, d.message]);
      lastIdRef.current = Math.max(lastIdRef.current, d.message.id);
      setContent("");
      setImage(null);
      stickRef.current = true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не удалось отправить");
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id: number) => {
    try {
      await api(`/api/chat?id=${id}`, { method: "DELETE" });
      setMessages((prev) => prev.filter((m) => m.id !== id));
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="mx-auto flex h-full max-w-5xl flex-col px-4 py-4 md:px-8">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h1 className="font-display text-xl font-bold tracking-wide md:text-2xl">
            Общий чат
          </h1>
          <p className="mt-1 flex items-center gap-2 text-xs text-zinc-500">
            <span className="size-1.5 anim-blink rounded-full bg-green-400" />
            живой канал игроков LoloGrief — обновляется сам
          </p>
        </div>
        <span className="rounded-lg border border-line bg-panel2 px-2.5 py-1 font-mono text-[11px] text-zinc-400">
          {messages.length} сообщ.
        </span>
      </div>

      <div className="card flex min-h-0 flex-1 flex-col overflow-hidden">
        <div
          ref={boxRef}
          onScroll={onScroll}
          className="scroll-slim min-h-0 flex-1 space-y-1 overflow-y-auto p-3 md:p-4"
        >
          {messages.length === 0 && (
            <div className="flex h-full flex-col items-center justify-center gap-2 py-16 text-zinc-600">
              <MessageCircle className="size-8" />
              <p className="text-xs">Пока тихо. Напиши первым!</p>
            </div>
          )}
          {messages.map((m, i) => {
            const prev = messages[i - 1];
            const sameAuthor = prev?.author.id === m.author.id;
            return (
              <div
                key={m.id}
                className={cn(
                  "group anim-pop rounded-xl px-3 py-2 transition-colors hover:bg-panel2/70",
                  sameAuthor ? "mt-0.5" : "mt-2.5",
                )}
                style={{ animationDuration: "0.2s" }}
              >
                <div className="flex items-center gap-2">
                  <UserChip user={m.author} size="sm" />
                  <span className="font-mono text-[10px] text-zinc-600">
                    {fmtTime(m.createdAt)}
                  </span>
                  {canModerate && (
                    <button
                      onClick={() => void remove(m.id)}
                      className="ml-auto grid size-6 place-items-center rounded-md text-zinc-700 opacity-0 transition-all hover:text-red-300 group-hover:opacity-100"
                      title="Удалить"
                    >
                      <Trash2 className="size-3" />
                    </button>
                  )}
                </div>
                {m.content && (
                  <p className="mt-1 whitespace-pre-wrap break-words pl-0.5 text-sm leading-relaxed text-zinc-300">
                    {m.content}
                  </p>
                )}
                {m.imageUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={m.imageUrl}
                    alt="Вложение"
                    className="mt-2 max-h-56 rounded-xl border border-line object-cover"
                  />
                )}
              </div>
            );
          })}
        </div>

        {/* composer */}
        <div className="border-t border-line bg-panel/80 p-3">
          {user ? (
            <form onSubmit={send} className="space-y-2.5">
              <div className="flex items-center gap-2">
                <input
                  className="input"
                  placeholder={`Сообщение от ${user.nickname}…`}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  maxLength={500}
                />
                <button
                  disabled={busy || (!content.trim() && !image)}
                  className="btn btn-primary shrink-0 !px-4"
                >
                  {busy ? <Spinner className="size-4 text-black" /> : <Send className="size-4" />}
                </button>
              </div>
              <div className="flex items-center justify-between">
                <ImageAttach value={image} onChange={setImage} label="Фото" />
                {error && <p className="text-[11px] font-semibold text-red-300">{error}</p>}
              </div>
            </form>
          ) : (
            <div className="flex items-center justify-between gap-3 px-1 py-1">
              <p className="text-xs text-zinc-500">
                Чат — только для игроков сервера. Войди, чтобы писать.
              </p>
              <Link href="/login" className="btn btn-primary shrink-0 !px-3 !py-1.5 !text-xs">
                Войти
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
