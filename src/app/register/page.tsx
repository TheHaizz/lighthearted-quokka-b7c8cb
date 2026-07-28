"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { KeyRound, Sparkles, UserRound } from "lucide-react";
import { api } from "@/lib/client";
import { FieldLabel, Spinner } from "@/components/ui";
import { useSession } from "@/components/SessionProvider";
import { AuthShell } from "../login/page";

export default function RegisterPage() {
  const router = useRouter();
  const { refresh } = useSession();
  const [nickname, setNickname] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [shakeKey, setShakeKey] = useState(0);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (password !== confirm) {
      setError("Пароли не совпадают");
      setShakeKey((k) => k + 1);
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await api("/api/auth/register", { body: { nickname, password } });
      await refresh();
      router.push("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка регистрации");
      setShakeKey((k) => k + 1);
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthShell
      title="Новый игрок"
      sub="Аккаунт форума LoloGrief — никнейм:пароль"
      shakeKey={shakeKey}
    >
      <form onSubmit={submit} className="space-y-4">
        <div>
          <FieldLabel>Игровой никнейм</FieldLabel>
          <div className="relative">
            <UserRound className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-600" />
            <input
              className="input !pl-9"
              placeholder="3–20 символов: A-Z, 0-9, _"
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
              placeholder="Минимум 4 символа"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
            />
          </div>
        </div>
        <div>
          <FieldLabel>Повтори пароль</FieldLabel>
          <input
            type="password"
            className="input"
            placeholder="••••••••"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            autoComplete="new-password"
          />
        </div>
        {error && (
          <p className="rounded-xl border border-red-400/30 bg-red-400/10 px-3 py-2 text-xs font-semibold text-red-300">
            {error}
          </p>
        )}
        <button disabled={busy} className="btn btn-primary w-full">
          {busy ? <Spinner className="size-4 text-black" /> : <Sparkles className="size-4" />}
          Создать аккаунт
        </button>
        <p className="text-center text-[11px] leading-relaxed text-zinc-600">
          Роли и короны выдаёт администрация. Уже есть аккаунт?{" "}
          <Link href="/login" className="font-bold text-honey hover:opacity-70">
            Войти
          </Link>
        </p>
      </form>
    </AuthShell>
  );
}
