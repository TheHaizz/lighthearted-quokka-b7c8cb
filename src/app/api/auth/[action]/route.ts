import { eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { guard, HttpError, json } from "@/lib/api";
import {
  createSession,
  destroySession,
  getCurrentUser,
  hashPassword,
  isAdminUnlocked,
  toMe,
  verifyPassword,
} from "@/lib/auth";

type Ctx = { params: Promise<{ action: string }> };

export async function POST(req: Request, ctx: Ctx) {
  const { action } = await ctx.params;
  return guard(async () => {
    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;

    if (action === "register") {
      const nick = String(body.nickname ?? "").trim();
      const pw = String(body.password ?? "");
      if (!/^[A-Za-z0-9_]{3,20}$/.test(nick)) {
        throw new HttpError(400, "Ник: 3–20 символов (латиница, цифры, _)");
      }
      if (pw.length < 4 || pw.length > 64) {
        throw new HttpError(400, "Пароль: от 4 до 64 символов");
      }
      const existing = await db
        .select({ id: users.id })
        .from(users)
        .where(sql`lower(${users.nickname}) = lower(${nick})`)
        .limit(1);
      if (existing.length > 0) {
        throw new HttpError(409, "Такой ник уже занят");
      }
      const [u] = await db
        .insert(users)
        .values({ nickname: nick, passwordHash: hashPassword(pw) })
        .returning();
      await createSession(u.id);
      return json({ user: toMe(u) });
    }

    if (action === "login") {
      const nick = String(body.nickname ?? "").trim();
      const pw = String(body.password ?? "");
      const rows = await db
        .select()
        .from(users)
        .where(sql`lower(${users.nickname}) = lower(${nick})`)
        .limit(1);
      const u = rows[0];
      if (!u || !verifyPassword(pw, u.passwordHash)) {
        throw new HttpError(401, "Неверный ник или пароль");
      }
      await createSession(u.id);
      return json({ user: toMe(u) });
    }

    if (action === "logout") {
      await destroySession();
      return json({ ok: true });
    }

    throw new HttpError(404, "Неизвестное действие");
  });
}

export async function GET(_req: Request, ctx: Ctx) {
  const { action } = await ctx.params;
  return guard(async () => {
    if (action !== "me") throw new HttpError(404, "Неизвестное действие");
    const u = await getCurrentUser();
    return json({ user: u ? toMe(u) : null, adminUnlocked: await isAdminUnlocked() });
  });
}
