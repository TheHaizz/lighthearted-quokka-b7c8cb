"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Hexagon, KeyRound, LogIn, UserRound } from "lucide-react";
import { api, cn } from "@/lib/client";
import { FieldLabel, Spinner } from "@/components/ui";
import { useSession } from "@/components/SessionProvider";

export default function LoginPage() {
  const router = useRouter();
  const { refresh } = useSession();
  const [nickname, setNickname] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [shakeKey, setShakeKey] = useState(0);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await api("/api/auth/login", { body: { nickname, password } });
      await refresh();
      router.push("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка входа");
      setShakeKey((k) => k + 1);
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthShell
      title="Вход в систему"
      sub="Введи свой игровой никнейм и пароль"
      shakeKey={shakeKey}
    >
      <form onSubmit={submit} className="space-y-4">
        <div>
          <FieldLabel>Никнейм</FieldLabel>
          <div className="relative">
            <UserRound className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-600" />
            <input
              className="input !pl-9"
              placeholder="Steve_2013"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              autoComplete="username"
              maxLength={20}
            />
          </div>
        </div>
        <div>
          <FieldLabel>Пароль</FieldLabel>
          <div className="relative">
            <KeyRound className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-600" />
            <input
              type="password"
              className="input !pl-9"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
          </div>
        </div>
        {error && (
          <p className="rounded-xl border border-red-400/30 bg-red-400/10 px-3 py-2 text-xs font-semibold text-red-300">
            {error}
          </p>
        )}
        <button disabled={busy} className="btn btn-primary w-full">
          {busy ? <Spinner className="size-4 text-black" /> : <LogIn className="size-4" />}
          Войти в планшет
        </button>
        <p className="text-center text-xs text-zinc-500">
          Нет аккаунта?{" "}
          <Link href="/register" className="font-bold text-honey hover:opacity-70">
            Зарегистрируйся
          </Link>
        </p>
      </form>
    </AuthShell>
  );
}

export function AuthShell({
  title,
  sub,
  children,
  shakeKey,
}: {
  title: string;
  sub: string;
  children: React.ReactNode;
  shakeKey?: number;
}) {
  return (
    <div className="flex min-h-full items-center justify-center px-4 py-10">
      <div
        key={shakeKey}
        className={cn(
          "card anim-pop w-full max-w-sm overflow-hidden",
          Boolean(shakeKey) && "anim-shake",
        )}
      >
        <div className="shimmer-line h-0.5" />
        <div className="p-6 md:p-7">
          <div className="mb-6 flex flex-col items-center text-center">
            <span className="relative grid size-12 place-items-center">
              <Hexagon className="size-12 text-honey" strokeWidth={1.4} />
              <span className="absolute size-2.5 rounded-full bg-honey shadow-[0_0_12px_rgba(255,210,61,0.9)]" />
            </span>
            <h1 className="mt-3 font-display text-lg font-bold tracking-wide">
              {title}
            </h1>
            <p className="mt-1 text-xs text-zinc-500">{sub}</p>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
