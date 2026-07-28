import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { customTags } from "@/db/schema";
import { guard, HttpError, json } from "@/lib/api";
import { requireAdminMenu } from "@/lib/auth";

export async function GET() {
  return guard(async () => {
    const rows = await db
      .select()
      .from(customTags)
      .orderBy(asc(customTags.kind), asc(customTags.id));
    return json({
      tags: rows.map((t) => ({ id: t.id, kind: t.kind, label: t.label, color: t.color })),
    });
  });
}

export async function POST(req: Request) {
  return guard(async () => {
    await requireAdminMenu();
    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
    const kind = String(body.kind ?? "");
    if (kind !== "prefix" && kind !== "status") {
      throw new HttpError(400, "Тип тега: prefix или status");
    }
    const label = String(body.label ?? "").trim().slice(0, 24);
    const color = String(body.color ?? "#ffd23d");
    if (label.length < 2) throw new HttpError(400, "Название: минимум 2 символа");
    if (!/^#[0-9a-fA-F]{6}$/.test(color)) throw new HttpError(400, "Некорректный цвет");
    const [created] = await db
      .insert(customTags)
      .values({ kind, label, color })
      .returning();
    return json({ tag: { id: created.id, kind: created.kind, label: created.label, color: created.color } });
  });
}

export async function DELETE(req: Request) {
  return guard(async () => {
    await requireAdminMenu();
    const id = Number(new URL(req.url).searchParams.get("id"));
    if (!id) throw new HttpError(400, "Не указан тег");
    await db.delete(customTags).where(eq(customTags.id, id));
    return json({ ok: true });
  });
}
