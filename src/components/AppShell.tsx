"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import {
  Check,
  Copy,
  Crown,
  Flag,
  Hexagon,
  House,
  KeyRound,
  LogOut,
  Menu,
  MessageCircle,
  MessagesSquare,
  Newspaper,
  ScrollText,
  Wifi,
  X,
} from "lucide-react";
import { api, cn } from "@/lib/client";
import { useSession } from "./SessionProvider";
import { UserChip } from "./UserChip";

const NAV = [
  { href: "/", label: "Главная", icon: House },
  { href: "/forum", label: "Форум", icon: MessagesSquare },
  { href: "/chat", label: "Общий чат", icon: MessageCircle },
  { href: "/tickets", label: "Обращения", icon: Flag },
  { href: "/news", label: "Новости", icon: Newspaper },
  { href: "/rules", label: "Правила", icon: ScrollText },
  { href: "/admin", label: "Админ-меню", icon: KeyRound },
];

const SERVER_IP = "pictures-documents.gl.joinmc.link";

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, adminUnlocked, refresh } = useSession();
  const [now, setNow] = useState<Date | null>(null);
  const [online, setOnline] = useState<number | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setNow(new Date());
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    let alive = true;
    const load = () => {
      api<{ players: number }>("/api/stats")
        .then((d) => alive && setOnline(d.players))
        .catch(() => {});
    };
    load();
    const t = setInterval(load, 45_000);
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, []);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  const copyIp = async () => {
    try {
      await navigator.clipboard.writeText(SERVER_IP);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard unavailable */
    }
  };

  const logout = async () => {
    await api("/api/auth/logout", { method: "POST" }).catch(() => {});
    await refresh();
    router.push("/");
  };

  return (
    <div className="flex h-full flex-col bg-ink text-zinc-100">
      {/* status bar */}
      <header className="flex h-13 shrink-0 items-center gap-2.5 border-b border-line bg-panel/90 px-3 py-2.5 backdrop-blur md:gap-3 md:px-4">
        <button
          onClick={() => setMenuOpen((v) => !v)}
          className="btn-ghost btn !p-2 md:hidden"
          aria-label="Меню"
        >
          {menuOpen ? <X className="size-4" /> : <Menu className="size-4" />}
        </button>

        <Link href="/" className="group flex items-center gap-2.5">
          <span className="relative grid size-8 place-items-center">
            <Hexagon className="size-8 text-honey transition-transform duration-300 group-hover:rotate-90" strokeWidth={1.6} />
            <span className="absolute size-2 rounded-full bg-honey shadow-[0_0_10px_rgba(255,210,61,0.9)]" />
          </span>
          <span className="leading-none">
            <span className="block font-display text-sm font-bold tracking-widest">
              LOLO<span className="text-honey">FORUM</span>
            </span>
            <span className="mt-1 hidden text-[9px] uppercase tracking-[0.22em] text-zinc-500 sm:block">
              Tablet OS · LoloGrief
            </span>
          </span>
        </Link>

        <div className="flex-1" />

        <button
          onClick={copyIp}
          className="hidden items-center gap-1.5 rounded-lg border border-line bg-panel2 px-2.5 py-1.5 font-mono text-[11px] text-zinc-400 transition-colors hover:border-honey/40 hover:text-honey sm:flex"
          title="Нажмите, чтобы скопировать IP"
        >
          {copied ? (
            <Check className="size-3.5 text-green-400" />
          ) : (
            <Copy className="size-3.5" />
          )}
          {copied ? "Скопировано!" : SERVER_IP}
        </button>

        <span className="hidden items-center gap-1.5 rounded-lg border border-line bg-panel2 px-2.5 py-1.5 text-[11px] text-zinc-400 lg:flex">
          <Wifi className="size-3.5 text-green-400" />
          <span className="font-mono">{online ?? "…"}</span>
          <span className="hidden xl:inline">онлайн</span>
        </span>

        <span className="hidden rounded-lg border border-line bg-panel2 px-2.5 py-1.5 font-mono text-[11px] text-honey md:block">
          {now ? now.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" }) : "--:--"}
        </span>

        {user ? (
          <span className="flex items-center gap-2 rounded-xl border border-line bg-panel2 py-1 pl-2.5 pr-1.5">
            <UserChip user={user} size="sm" />
            <button
              onClick={logout}
              className="grid size-7 place-items-center rounded-lg border border-line bg-panel text-zinc-500 transition-colors hover:border-red-400/40 hover:text-red-300"
              title="Выйти"
            >
              <LogOut className="size-3.5" />
            </button>
          </span>
        ) : (
          <span className="flex items-center gap-1.5">
            <Link href="/login" className="btn btn-primary !px-3 !py-1.5 !text-xs">
              Войти
            </Link>
            <Link
              href="/register"
              className="btn btn-ghost hidden !px-3 !py-1.5 !text-xs sm:inline-flex"
            >
              Регистрация
            </Link>
          </span>
        )}
      </header>

      <div className="flex min-h-0 flex-1">
        {/* sidebar */}
        {menuOpen && (
          <div
            className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm md:hidden"
            onClick={() => setMenuOpen(false)}
          />
        )}
        <aside
          className={cn(
            "z-40 flex w-60 shrink-0 flex-col border-r border-line bg-panel/95 backdrop-blur transition-transform duration-300 max-md:fixed max-md:inset-y-0 max-md:left-0 max-md:top-0 max-md:pt-14",
            menuOpen ? "max-md:translate-x-0" : "max-md:-translate-x-full",
          )}
        >
          <nav className="scroll-slim flex-1 space-y-1 overflow-y-auto p-3">
            {NAV.map((item) => {
              const active =
                item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "group flex items-center gap-3 rounded-xl border px-3 py-2.5 text-sm font-semibold transition-all duration-200",
                    active
                      ? "border-honey/40 bg-honey/10 text-honey shadow-[0_0_24px_-6px_rgba(255,210,61,0.4)]"
                      : "border-transparent text-zinc-400 hover:border-line hover:bg-panel2 hover:text-zinc-100",
                  )}
                >
                  <span
                    className={cn(
                      "grid size-8 place-items-center rounded-lg border transition-colors",
                      active
                        ? "border-honey/50 bg-honey/15 text-honey"
                        : "border-line bg-panel text-zinc-500 group-hover:text-zinc-200",
                    )}
                  >
                    <Icon className="size-4" />
                  </span>
                  {item.label}
                  {item.href === "/admin" && adminUnlocked && (
                    <span className="ml-auto size-1.5 anim-blink rounded-full bg-honey" />
                  )}
                </Link>
              );
            })}
          </nav>

          <div className="space-y-2 border-t border-line p-3">
            <div className="rounded-xl border border-line bg-panel2 p-3 text-[10px] leading-relaxed text-zinc-500">
              <p className="mb-1.5 font-bold uppercase tracking-wider text-zinc-400">
                Короны команды
              </p>
              <p className="flex items-center gap-1.5">
                <Crown className="size-3.5 fill-white/15 text-zinc-100" /> Модератор
              </p>
              <p className="mt-1 flex items-center gap-1.5">
                <Crown className="size-3.5 fill-honey/25 text-honey" /> Администратор
              </p>
            </div>
            <p className="px-1 text-center font-mono text-[9px] text-zinc-600">
              LoloForum v2.6.1 · Tablet OS
            </p>
          </div>
        </aside>

        {/* content */}
        <main className="scroll-slim relative min-w-0 flex-1 overflow-y-auto">
          <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-24 bg-[radial-gradient(60%_100%_at_50%_0%,rgba(255,210,61,0.06),transparent)]" />
          {children}
        </main>
      </div>
    </div>
  );
}
