import { createHash, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { and, eq, gt } from "drizzle-orm";
import { db } from "@/db";
import { sessions, users } from "@/db/schema";
import { HttpError } from "./api";
import type { AuthorInfo, Me, Role } from "./types";

const SESSION_COOKIE = "lolo_session";
const ADMIN_COOKIE = "lolo_admin_key";
const SESSION_TTL = 1000 * 60 * 60 * 24 * 30;

// Password of the admin menu. Never exposed to the client bundle.
const ADMIN_PANEL_PASSWORD = "cewux";
const ADMIN_TOKEN = createHash("sha256")
  .update(`lologrief::tablet-os::${ADMIN_PANEL_PASSWORD}::unlock`)
  .digest("hex");

export type DBUser = typeof users.$inferSelect;

export function hashPassword(pw: string): string {
  return scryptSync(pw, "lologrief-forum::salt", 32).toString("hex");
}

export function verifyPassword(pw: string, hash: string): boolean {
  if (!/^[0-9a-f]{64}$/.test(hash)) return false;
  try {
    return timingSafeEqual(
      Buffer.from(hashPassword(pw), "hex"),
      Buffer.from(hash, "hex"),
    );
  } catch {
    return false;
  }
}

export function toAuthor(u: DBUser): AuthorInfo {
  return {
    id: u.id,
    nickname: u.nickname,
    role: u.role as Role,
    prefix: u.prefix,
    prefixColor: u.prefixColor,
    status: u.status,
    statusColor: u.statusColor,
  };
}

export function toMe(u: DBUser): Me {
  return {
    ...toAuthor(u),
    banned: u.banned,
    isStaff: u.role === "moderator" || u.role === "admin",
  };
}

export async function createSession(userId: number): Promise<void> {
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_TTL);
  await db.insert(sessions).values({ token, userId, expiresAt });
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

export async function destroySession(): Promise<void> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (token) {
    await db.delete(sessions).where(eq(sessions.token, token));
  }
  store.delete(SESSION_COOKIE);
}

export async function getCurrentUser(): Promise<DBUser | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const rows = await db
    .select({ user: users })
    .from(sessions)
    .innerJoin(users, eq(sessions.userId, users.id))
    .where(and(eq(sessions.token, token), gt(sessions.expiresAt, new Date())))
    .limit(1);
  return rows[0]?.user ?? null;
}

export async function isAdminUnlocked(): Promise<boolean> {
  const store = await cookies();
  return store.get(ADMIN_COOKIE)?.value === ADMIN_TOKEN;
}

export function checkAdminPassword(pw: string): boolean {
  const candidate = createHash("sha256")
    .update(`lologrief::tablet-os::${pw}::unlock`)
    .digest();
  const expected = Buffer.from(ADMIN_TOKEN, "hex");
  return candidate.length === expected.length && timingSafeEqual(candidate, expected);
}

export async function unlockAdmin(): Promise<void> {
  const store = await cookies();
  store.set(ADMIN_COOKIE, ADMIN_TOKEN, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 12,
  });
}

export async function lockAdmin(): Promise<void> {
  const store = await cookies();
  store.delete(ADMIN_COOKIE);
}

export async function requireUser(): Promise<DBUser> {
  const u = await getCurrentUser();
  if (!u) throw new HttpError(401, "Требуется авторизация");
  return u;
}

export function assertWritable(u: DBUser): void {
  if (u.banned) {
    throw new HttpError(403, "Ваш аккаунт заблокирован на сервере");
  }
}

/** Staff = moderator/admin role OR unlocked admin menu. */
export async function requireStaff(): Promise<{ user: DBUser | null }> {
  const u = await getCurrentUser();
  const staff = u !== null && (u.role === "moderator" || u.role === "admin");
  const unlocked = await isAdminUnlocked();
  if (!staff && !unlocked) {
    throw new HttpError(403, "Доступно только модераторам и администраторам");
  }
  return { user: u };
}

/** Admin menu = unlocked with panel password (regardless of crown). */
export async function requireAdminMenu(): Promise<void> {
  if (!(await isAdminUnlocked())) {
    throw new HttpError(403, "Админ-меню не разблокировано");
  }
}

export async function canModerate(): Promise<boolean> {
  const u = await getCurrentUser();
  if (u && (u.role === "moderator" || u.role === "admin")) return true;
  return isAdminUnlocked();
}
