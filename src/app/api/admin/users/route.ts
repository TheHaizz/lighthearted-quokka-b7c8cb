import { desc, eq, ilike } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { guard, HttpError, iso, json } from "@/lib/api";
import { requireAdminMenu } from "@/lib/auth";
import type { Role } from "@/lib/types";

const VALID_ROLES: Role[] = ["player", "moderator", "admin"];
const COLOR_RE = /^#[0-9a-fA-F]{6}$/;

export async function GET(req: Request) {
  return guard(async () => {
    await requireAdminMenu();
    const q = new URL(req.url).searchParams.get("q")?.trim() ?? "";
    const rows = q
      ? await db
          .select()
          .from(users)
          .where(ilike(users.nickname, `%${q.slice(0, 24)}%`))
          .orderBy(desc(users.id))
          .limit(24)
      : await db.select().from(users).orderBy(desc(users.id)).limit(24);
    return json({
      users: rows.map((u) => ({
        id: u.id,
        nickname: u.nickname,
        role: u.role,
        prefix: u.prefix,
        prefixColor: u.prefixColor,
        status: u.status,
        statusColor: u.statusColor,
        banned: u.banned,
        createdAt: iso(u.createdAt),
      })),
    });
  });
}

export async function PATCH(req: Request) {
  return guard(async () => {
    await requireAdminMenu();
    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
    const id = Number(body.id);
    if (!id) throw new HttpError(400, "Не указан игрок");

    const patch: Partial<typeof users.$inferInsert> = {};
    if (typeof body.role === "string") {
      if (!VALID_ROLES.includes(body.role as Role)) {
        throw new HttpError(400, "Неизвестная роль");
      }
      patch.role = body.role as Role;
    }
    if (body.prefix !== undefined) {
      const v = String(body.prefix ?? "").trim().slice(0, 24);
      patch.prefix = v === "" ? null : v;
    }
    if (typeof body.prefixColor === "string" && COLOR_RE.test(body.prefixColor)) {
      patch.prefixColor = body.prefixColor;
    }
    if (body.status !== undefined) {
      const v = String(body.status ?? "").trim().slice(0, 24);
      patch.status = v === "" ? null : v;
    }
    if (typeof body.statusColor === "string" && COLOR_RE.test(body.statusColor)) {
      patch.statusColor = body.statusColor;
    }
    if (typeof body.banned === "boolean") patch.banned = body.banned;
    if (Object.keys(patch).length === 0) throw new HttpError(400, "Нечего обновлять");

    const [updated] = await db
      .update(users)
      .set(patch)
      .where(eq(users.id, id))
      .returning();
    if (!updated) throw new HttpError(404, "Игрок не найден");
    return json({
      user: {
        id: updated.id,
        nickname: updated.nickname,
        role: updated.role,
        prefix: updated.prefix,
        prefixColor: updated.prefixColor,
        status: updated.status,
        statusColor: updated.statusColor,
        banned: updated.banned,
        createdAt: iso(updated.createdAt),
      },
    });
  });
}
