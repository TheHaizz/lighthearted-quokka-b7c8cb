"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import {
  Ban,
  Check,
  Crown,
  KeyRound,
  Lock,
  LockOpen,
  Megaphone,
  MessagesSquare,
  Newspaper,
  Pencil,
  Plus,
  Save,
  Search,
  ShieldCheck,
  Tags,
  Trash2,
  TriangleAlert,
  Users,
  X,
} from "lucide-react";
import { api, cn, timeAgo } from "@/lib/client";
import type {
  AdminUserRow,
  NewsKind,
  NewsRow,
  Section,
  Tag,
} from "@/lib/types";
import { NEWS_KIND_META } from "@/lib/types";
import { Empty, FieldLabel, LoadingBlock, PageHeader, Spinner, StatusChip } from "@/components/ui";
import { UserChip } from "@/components/UserChip";
import { ImageAttach } from "@/components/ImageAttach";
import { ICON_OPTIONS, SectionIcon } from "@/components/SectionIcon";
import { useSession } from "@/components/SessionProvider";

type Tab = "users" | "sections" | "publish" | "tags";

const TABS: Array<{ key: Tab; label: string; icon: typeof Users }> = [
  { key: "users", label: "Игроки и роли", icon: Users },
  { key: "sections", label: "Ветки форума", icon: MessagesSquare },
  { key: "publish", label: "Публикации", icon: Newspaper },
  { key: "tags", label: "Префиксы и статусы", icon: Tags },
];

export default function AdminPage() {
  const { adminUnlocked, loading, refresh } = useSession();
  const [tab, setTab] = useState<Tab>("users");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);
  const [busy, setBusy] = useState(false);

  const unlock = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(false);
    try {
      await api("/api/admin/access", { body: { password } });
      setPassword("");
      await refresh();
    } catch {
      setError(true);
      setPassword("");
    } finally {
      setBusy(false);
    }
  };

  const lock = async () => {
    await api("/api/admin/access", { method: "DELETE" }).catch(() => {});
    await refresh();
  };

  if (loading) return <LoadingBlock />;

  if (!adminUnlocked) {
    return (
      <div className="flex h-full items-center justify-center px-4">
        <div
          key={String(error) + password.length}
          className={cn("card anim-pop w-full max-w-sm p-7", error && "anim-shake")}
        >
          <div className="flex flex-col items-center text-center">
            <span className="relative grid size-14 place-items-center rounded-2xl border border-honey/30 bg-honey/10">
              <Lock className="size-6 text-honey" />
              <span className="absolute -right-1 -top-1 size-2.5 anim-blink rounded-full bg-honey" />
            </span>
            <h1 className="mt-4 font-display text-lg font-bold tracking-wide">
              Системный терминал
            </h1>
            <p className="mt-1.5 text-xs leading-relaxed text-zinc-500">
              Панель управления сервером. Введите ключ доступа.
            </p>
          </div>
          <form onSubmit={unlock} className="mt-6 space-y-3">
            <div className="relative">
              <KeyRound
                className={cn(
                  "absolute left-3 top-1/2 size-4 -translate-y-1/2 transition-colors",
                  error ? "text-red-400" : "text-zinc-600",
                )}
              />
              <input
                type="password"
                className={cn("input !pl-9 font-mono", error && "!border-red-400/60")}
                placeholder="ключ доступа"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError(false);
                }}
                autoFocus
              />
            </div>
            {error && (
              <p className="flex items-center gap-1.5 text-[11px] font-bold text-red-300">
                <TriangleAlert className="size-3.5" /> Доступ отклонён
              </p>
            )}
            <button disabled={busy || password.length === 0} className="btn btn-primary w-full">
              {busy ? <Spinner className="size-4 text-black" /> : <LockOpen className="size-4" />}
              Разблокировать терминал
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 md:px-8 md:py-8">
      <PageHeader
        title="Админ-меню"
        sub="Полный контроль сервера: игроки, роли, ветки, публикации, префиксы и статусы"
        right={
          <button onClick={lock} className="btn btn-danger !text-xs">
            <Lock className="size-3.5" /> Заблокировать
          </button>
        }
      />

      <div className="anim-fade-up mb-5 flex items-center gap-2 rounded-2xl border border-honey/25 bg-honey/5 px-4 py-2.5 text-[11px] font-semibold text-honey">
        <ShieldCheck className="size-4 shrink-0" />
        Терминал разблокирован. Все изменения применяются мгновенно.
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        {TABS.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={cn(
                "btn !text-xs",
                tab === t.key
                  ? "btn-primary"
                  : "btn-ghost",
              )}
            >
              <Icon className="size-3.5" />
              {t.label}
            </button>
          );
        })}
      </div>

      {tab === "users" && <UsersTab />}
      {tab === "sections" && <SectionsTab />}
      {tab === "publish" && <PublishTab />}
      {tab === "tags" && <TagsTab />}

      <div className="mt-8 flex items-start gap-2.5 rounded-2xl border border-line bg-panel2/70 p-4 text-[11px] leading-relaxed text-zinc-500">
        <Megaphone className="mt-0.5 size-4 shrink-0 text-honey" />
        <p>
          Легенда корон: <Crown className="inline size-3.5 fill-white/15 text-zinc-100" />{" "}
          белая — модератор, разбирает репорты и модерирует чат;{" "}
          <Crown className="inline size-3.5 fill-honey/25 text-honey" /> жёлтая —
          администратор. Роли выдаются во вкладке «Игроки и роли». Репорты игроков
          видны в разделе «Обращения» только команде сервера.
        </p>
      </div>
    </div>
  );
}

/* ------------------------------ USERS TAB ------------------------------ */

function UsersTab() {
  const [q, setQ] = useState("");
  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [selected, setSelected] = useState<AdminUserRow | null>(null);

  const search = useCallback((query: string) => {
    setLoadingList(true);
    api<{ users: AdminUserRow[] }>(`/api/admin/users?q=${encodeURIComponent(query)}`)
      .then((d) => setUsers(d.users))
      .catch(() => {})
      .finally(() => setLoadingList(false));
  }, []);

  useEffect(() => {
    const t = setTimeout(() => search(q), 300);
    return () => clearTimeout(t);
  }, [q, search]);

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_1.1fr]">
      <div className="card overflow-hidden">
        <div className="border-b border-line p-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-600" />
            <input
              className="input !pl-9"
              placeholder="Поиск по никнейму…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
        </div>
        <div className="scroll-slim max-h-[26rem] overflow-y-auto p-2">
          {loadingList ? (
            <div className="flex justify-center py-10">
              <Spinner />
            </div>
          ) : users.length === 0 ? (
            <p className="py-10 text-center text-xs text-zinc-600">Игроки не найдены</p>
          ) : (
            users.map((u) => (
              <button
                key={u.id}
                onClick={() => setSelected(u)}
                className={cn(
                  "flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left transition-colors",
                  selected?.id === u.id
                    ? "bg-honey/10 ring-1 ring-honey/40"
                    : "hover:bg-panel2",
                )}
              >
                <UserChip user={u} size="sm" />
                {u.banned && (
                  <span className="ml-auto inline-flex items-center gap-1 rounded-md bg-red-400/10 px-1.5 py-0.5 text-[9px] font-bold uppercase text-red-300">
                    <Ban className="size-2.5" /> бан
                  </span>
                )}
              </button>
            ))
          )}
        </div>
      </div>

      <div>
        {selected ? (
          <UserEditor
            key={selected.id}
            user={selected}
            onSaved={(u) => {
              setSelected(u);
              setUsers((prev) => prev.map((x) => (x.id === u.id ? u : x)));
            }}
            onClose={() => setSelected(null)}
          />
        ) : (
          <div className="card flex h-full min-h-56 flex-col items-center justify-center gap-2 border-dashed p-8 text-center text-zinc-600">
            <Users className="size-8" />
            <p className="text-xs">Выбери игрока слева, чтобы редактировать роль, префикс, статус и бан</p>
          </div>
        )}
      </div>
    </div>
  );
}

function UserEditor({
  user,
  onSaved,
  onClose,
}: {
  user: AdminUserRow;
  onSaved: (u: AdminUserRow) => void;
  onClose: () => void;
}) {
  const [role, setRole] = useState(user.role);
  const [prefix, setPrefix] = useState(user.prefix ?? "");
  const [prefixColor, setPrefixColor] = useState(user.prefixColor);
  const [status, setStatus] = useState(user.status ?? "");
  const [statusColor, setStatusColor] = useState(user.statusColor);
  const [banned, setBanned] = useState(user.banned);
  const [busy, setBusy] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const save = async () => {
    setBusy(true);
    setError(null);
    try {
      const d = await api<{ user: AdminUserRow }>("/api/admin/users", {
        method: "PATCH",
        body: { id: user.id, role, prefix, prefixColor, status, statusColor, banned },
      });
      onSaved(d.user);
      setSavedFlash(true);
      setTimeout(() => setSavedFlash(false), 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка сохранения");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="card anim-pop space-y-4 p-5">
      <div className="flex items-center justify-between">
        <p className="font-display text-sm font-bold">
          Редактор: <span className="text-honey">{user.nickname}</span>
        </p>
        <button
          onClick={onClose}
          className="grid size-7 place-items-center rounded-lg border border-line text-zinc-500 hover:text-zinc-200"
        >
          <X className="size-3.5" />
        </button>
      </div>

      <div>
        <FieldLabel>Роль на сервере</FieldLabel>
        <div className="grid grid-cols-3 gap-2">
          {(
            [
              { key: "player", label: "Игрок", icon: Users, active: "border-line text-zinc-300" },
              { key: "moderator", label: "Модератор", icon: Crown, active: "border-zinc-100/60 text-zinc-100" },
              { key: "admin", label: "Админ", icon: Crown, active: "border-honey/60 text-honey" },
            ] as const
          ).map((r) => {
            const Icon = r.icon;
            return (
              <button
                key={r.key}
                onClick={() => setRole(r.key)}
                className={cn(
                  "flex flex-col items-center gap-1.5 rounded-xl border bg-panel2 px-2 py-3 text-[11px] font-bold transition-all",
                  role === r.key ? cn(r.active, "shadow-[0_0_20px_-6px_rgba(255,210,61,0.4)]") : "border-line text-zinc-500 hover:text-zinc-300",
                )}
              >
                <Icon className="size-4" />
                {r.label}
              </button>
            );
          })}
        </div>
        <p className="mt-1.5 text-[10px] text-zinc-600">
          Модератор получает белую корону, администратор — жёлтую.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
        <div>
          <FieldLabel>Кастомный префикс</FieldLabel>
          <input
            className="input"
            placeholder="Например: ЛЕГЕНДА"
            value={prefix}
            onChange={(e) => setPrefix(e.target.value)}
            maxLength={24}
          />
        </div>
        <div>
          <FieldLabel>Цвет</FieldLabel>
          <input
            type="color"
            value={prefixColor}
            onChange={(e) => setPrefixColor(e.target.value)}
            className="h-10 w-16 cursor-pointer rounded-lg border border-line bg-panel2 p-1"
          />
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
        <div>
          <FieldLabel>Статус игрока</FieldLabel>
          <input
            className="input"
            placeholder="Например: СТРОИТ БАЗУ"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            maxLength={24}
          />
        </div>
        <div>
          <FieldLabel>Цвет</FieldLabel>
          <input
            type="color"
            value={statusColor}
            onChange={(e) => setStatusColor(e.target.value)}
            className="h-10 w-16 cursor-pointer rounded-lg border border-line bg-panel2 p-1"
          />
        </div>
      </div>

      <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-line bg-panel2 px-3.5 py-3">
        <input
          type="checkbox"
          checked={banned}
          onChange={(e) => setBanned(e.target.checked)}
          className="size-4 accent-red-500"
        />
        <span className="text-xs font-bold text-red-300">
          Забанить игрока (только чтение на форуме)
        </span>
      </label>

      {error && <p className="text-xs font-semibold text-red-300">{error}</p>}

      <button onClick={save} disabled={busy} className="btn btn-primary w-full">
        {busy ? (
          <Spinner className="size-4 text-black" />
        ) : savedFlash ? (
          <Check className="size-4" />
        ) : (
          <Save className="size-4" />
        )}
        {savedFlash ? "Сохранено!" : "Применить изменения"}
      </button>
    </div>
  );
}

/* ----------------------------- SECTIONS TAB ----------------------------- */

function SectionsTab() {
  const [sections, setSections] = useState<Section[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [icon, setIcon] = useState(ICON_OPTIONS[0]);
  const [editId, setEditId] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editIcon, setEditIcon] = useState(ICON_OPTIONS[0]);
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);

  const load = useCallback(() => {
    api<{ sections: Section[] }>("/api/sections")
      .then((d) => setSections(d.sections))
      .catch(() => {})
      .finally(() => setLoadingList(false));
  }, []);
  useEffect(load, [load]);

  const create = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await api("/api/sections", { body: { title, description, icon } });
      setTitle("");
      setDescription("");
      load();
    } catch {
      /* ignore */
    }
  };

  const toggle = async (s: Section) => {
    await api("/api/sections", {
      method: "PATCH",
      body: { id: s.id, isClosed: !s.isClosed },
    }).catch(() => {});
    load();
  };

  const startEdit = (s: Section) => {
    setEditId(s.id);
    setEditTitle(s.title);
    setEditDesc(s.description);
    setEditIcon(s.icon);
  };

  const saveEdit = async () => {
    if (editId === null) return;
    await api("/api/sections", {
      method: "PATCH",
      body: { id: editId, title: editTitle, description: editDesc, icon: editIcon },
    }).catch(() => {});
    setEditId(null);
    load();
  };

  const remove = async (id: number) => {
    await api(`/api/sections?id=${id}`, { method: "DELETE" }).catch(() => {});
    setConfirmDelete(null);
    load();
  };

  return (
    <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
      <div className="space-y-2.5">
        {loadingList ? (
          <LoadingBlock />
        ) : (
          sections.map((s) => (
            <div key={s.id} className="card p-4">
              {editId === s.id ? (
                <div className="space-y-3">
                  <input className="input" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} maxLength={80} />
                  <input className="input" value={editDesc} onChange={(e) => setEditDesc(e.target.value)} maxLength={200} placeholder="Описание" />
                  <IconPicker value={editIcon} onChange={setEditIcon} />
                  <div className="flex gap-2">
                    <button onClick={saveEdit} className="btn btn-primary !px-3 !py-1.5 !text-xs">
                      <Save className="size-3.5" /> Сохранить
                    </button>
                    <button onClick={() => setEditId(null)} className="btn btn-ghost !px-3 !py-1.5 !text-xs">
                      Отмена
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <span className="grid size-10 shrink-0 place-items-center rounded-xl border border-line bg-panel2 text-honey">
                    <SectionIcon name={s.icon} className="size-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-2 font-bold text-zinc-100">
                      {s.title}
                      {s.isClosed && (
                        <span className="rounded-md bg-red-400/10 px-1.5 py-0.5 text-[9px] font-bold uppercase text-red-300">
                          закрыта
                        </span>
                      )}
                    </p>
                    <p className="truncate text-[11px] text-zinc-500">
                      {s.description || "Без описания"} · {s.topicCount} тем
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1.5">
                    <button
                      onClick={() => void toggle(s)}
                      className={cn(
                        "grid size-8 place-items-center rounded-lg border transition-colors",
                        s.isClosed
                          ? "border-red-400/40 text-red-300 hover:bg-red-400/10"
                          : "border-line text-zinc-500 hover:border-honey/40 hover:text-honey",
                      )}
                      title={s.isClosed ? "Открыть ветку" : "Закрыть ветку"}
                    >
                      {s.isClosed ? <Lock className="size-3.5" /> : <LockOpen className="size-3.5" />}
                    </button>
                    <button
                      onClick={() => startEdit(s)}
                      className="grid size-8 place-items-center rounded-lg border border-line text-zinc-500 transition-colors hover:border-honey/40 hover:text-honey"
                      title="Редактировать"
                    >
                      <Pencil className="size-3.5" />
                    </button>
                    {confirmDelete === s.id ? (
                      <button
                        onClick={() => void remove(s.id)}
                        className="btn btn-danger !px-2.5 !py-1.5 !text-[10px]"
                      >
                        Точно удалить?
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          setConfirmDelete(s.id);
                          setTimeout(() => setConfirmDelete(null), 3000);
                        }}
                        className="grid size-8 place-items-center rounded-lg border border-line text-zinc-500 transition-colors hover:border-red-400/40 hover:text-red-300"
                        title="Удалить ветку"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      <form onSubmit={create} className="card h-fit space-y-3 p-5">
        <p className="flex items-center gap-2 font-display text-sm font-bold text-honey">
          <Plus className="size-4" /> Новая ветка
        </p>
        <div>
          <FieldLabel>Название</FieldLabel>
          <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={80} placeholder="Например: Реплеи и видео" />
        </div>
        <div>
          <FieldLabel>Описание</FieldLabel>
          <input className="input" value={description} onChange={(e) => setDescription(e.target.value)} maxLength={200} placeholder="О чём эта ветка" />
        </div>
        <div>
          <FieldLabel>Иконка</FieldLabel>
          <IconPicker value={icon} onChange={setIcon} />
        </div>
        <button className="btn btn-primary w-full">
          <Plus className="size-4" /> Создать ветку
        </button>
      </form>
    </div>
  );
}

function IconPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {ICON_OPTIONS.map((name) => (
        <button
          key={name}
          type="button"
          onClick={() => onChange(name)}
          className={cn(
            "grid size-9 place-items-center rounded-lg border transition-all",
            value === name
              ? "border-honey/60 bg-honey/15 text-honey shadow-[0_0_14px_-2px_rgba(255,210,61,0.6)]"
              : "border-line bg-panel2 text-zinc-500 hover:text-zinc-200",
          )}
        >
          <SectionIcon name={name} className="size-4" />
        </button>
      ))}
    </div>
  );
}

/* ----------------------------- PUBLISH TAB ----------------------------- */

function PublishTab() {
  const [kind, setKind] = useState<NewsKind>("update");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [image, setImage] = useState<string | null>(null);
  const [news, setNews] = useState<NewsRow[]>([]);
  const [busy, setBusy] = useState(false);
  const [ok, setOk] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);

  const load = useCallback(() => {
    api<{ news: NewsRow[] }>("/api/news")
      .then((d) => setNews(d.news))
      .catch(() => {});
  }, []);
  useEffect(load, [load]);

  const publish = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      await api("/api/news", { body: { kind, title, content, image } });
      setTitle("");
      setContent("");
      setImage(null);
      setOk(true);
      setTimeout(() => setOk(false), 1600);
      load();
    } catch {
      /* ignore */
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id: number) => {
    await api(`/api/news?id=${id}`, { method: "DELETE" }).catch(() => {});
    setConfirmDelete(null);
    load();
  };

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_1.2fr]">
      <form onSubmit={publish} className="card h-fit space-y-3 p-5">
        <p className="flex items-center gap-2 font-display text-sm font-bold text-honey">
          <Megaphone className="size-4" /> Новая публикация
        </p>
        <div>
          <FieldLabel>Тип</FieldLabel>
          <select className="input" value={kind} onChange={(e) => setKind(e.target.value as NewsKind)}>
            <option value="update">Обновление сервера</option>
            <option value="giveaway">Раздача</option>
            <option value="announcement">Анонс</option>
          </select>
        </div>
        <div>
          <FieldLabel>Заголовок</FieldLabel>
          <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={140} placeholder="Например: Обновление 2.7 — новые ивенты" />
        </div>
        <div>
          <FieldLabel>Текст</FieldLabel>
          <textarea className="input min-h-32 resize-y" value={content} onChange={(e) => setContent(e.target.value)} maxLength={8000} placeholder="Подробности публикации…" />
        </div>
        <ImageAttach value={image} onChange={setImage} label="Картинка к публикации" />
        <button disabled={busy} className="btn btn-primary w-full">
          {busy ? <Spinner className="size-4 text-black" /> : ok ? <Check className="size-4" /> : <Megaphone className="size-4" />}
          {ok ? "Опубликовано!" : "Опубликовать"}
        </button>
      </form>

      <div className="space-y-2.5">
        {news.length === 0 ? (
          <Empty icon={<Newspaper className="size-6" />} title="Публикаций нет" hint="Первый пост появится после публикации" />
        ) : (
          news.map((n) => {
            const meta = NEWS_KIND_META[n.kind];
            return (
              <div key={n.id} className="card flex items-center gap-3 p-4">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusChip label={meta.label} color={meta.color} />
                    <span className="text-[10px] text-zinc-600">{timeAgo(n.createdAt)}</span>
                  </div>
                  <p className="mt-1.5 truncate text-sm font-bold text-zinc-100">{n.title}</p>
                </div>
                {confirmDelete === n.id ? (
                  <button onClick={() => void remove(n.id)} className="btn btn-danger !px-2.5 !py-1.5 !text-[10px]">
                    Точно?
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      setConfirmDelete(n.id);
                      setTimeout(() => setConfirmDelete(null), 3000);
                    }}
                    className="grid size-8 shrink-0 place-items-center rounded-lg border border-line text-zinc-500 transition-colors hover:border-red-400/40 hover:text-red-300"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

/* ------------------------------- TAGS TAB ------------------------------- */

function TagsTab() {
  const [tags, setTags] = useState<Tag[]>([]);
  const [kind, setKind] = useState<"prefix" | "status">("prefix");
  const [label, setLabel] = useState("");
  const [color, setColor] = useState("#ffd23d");

  const load = useCallback(() => {
    api<{ tags: Tag[] }>("/api/admin/tags")
      .then((d) => setTags(d.tags))
      .catch(() => {});
  }, []);
  useEffect(load, [load]);

  const create = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await api("/api/admin/tags", { body: { kind, label, color } });
      setLabel("");
      load();
    } catch {
      /* ignore */
    }
  };

  const remove = async (id: number) => {
    await api(`/api/admin/tags?id=${id}`, { method: "DELETE" }).catch(() => {});
    load();
  };

  const prefixes = tags.filter((t) => t.kind === "prefix");
  const statuses = tags.filter((t) => t.kind === "status");

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_1.3fr]">
      <form onSubmit={create} className="card h-fit space-y-3 p-5">
        <p className="flex items-center gap-2 font-display text-sm font-bold text-honey">
          <Tags className="size-4" /> Новый тег
        </p>
        <div>
          <FieldLabel>Тип тега</FieldLabel>
          <div className="grid grid-cols-2 gap-2">
            <button type="button" onClick={() => setKind("prefix")} className={cn("btn !text-xs", kind === "prefix" ? "btn-primary" : "btn-ghost")}>
              Префикс
            </button>
            <button type="button" onClick={() => setKind("status")} className={cn("btn !text-xs", kind === "status" ? "btn-primary" : "btn-ghost")}>
              Статус
            </button>
          </div>
        </div>
        <div>
          <FieldLabel>Название</FieldLabel>
          <input className="input" value={label} onChange={(e) => setLabel(e.target.value)} maxLength={24} placeholder={kind === "prefix" ? "Например: ЛЕГЕНДА" : "Например: В ИГРЕ"} />
        </div>
        <div>
          <FieldLabel>Цвет</FieldLabel>
          <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="h-10 w-24 cursor-pointer rounded-lg border border-line bg-panel2 p-1" />
        </div>
        <button className="btn btn-primary w-full">
          <Plus className="size-4" /> Добавить в каталог
        </button>
        <p className="text-[10px] leading-relaxed text-zinc-600">
          Каталог — библиотека тегов сервера. Назначение игрокам выполняется во
          вкладке «Игроки и роли»: впиши название и выбери цвет.
        </p>
      </form>

      <div className="space-y-4">
        <TagList title="Префиксы" tags={prefixes} onRemove={remove} />
        <TagList title="Статусы" tags={statuses} onRemove={remove} />
      </div>
    </div>
  );
}

function TagList({
  title,
  tags,
  onRemove,
}: {
  title: string;
  tags: Tag[];
  onRemove: (id: number) => void;
}) {
  return (
    <div className="card p-4">
      <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">
        {title} · {tags.length}
      </p>
      {tags.length === 0 ? (
        <p className="text-xs text-zinc-600">Пусто</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {tags.map((t) => (
            <span
              key={t.id}
              className="group inline-flex items-center gap-2 rounded-lg border px-2.5 py-1.5 text-xs font-bold"
              style={{ color: t.color, borderColor: `${t.color}55`, background: `${t.color}10` }}
            >
              {t.label}
              <button
                onClick={() => onRemove(t.id)}
                className="grid size-4 place-items-center rounded-full bg-black/30 text-zinc-400 opacity-60 transition-all hover:text-red-300 group-hover:opacity-100"
              >
                <X className="size-2.5" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
