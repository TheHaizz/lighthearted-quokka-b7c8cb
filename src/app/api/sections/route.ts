import { asc, count, eq, max } from "drizzle-orm";
import { db } from "@/db";
import { sections, topics } from "@/db/schema";
import { guard, HttpError, json } from "@/lib/api";
import { requireAdminMenu } from "@/lib/auth";

export async function GET() {
  return guard(async () => {
    const rows = await db
      .select({ section: sections, topicCount: count(topics.id) })
      .from(sections)
      .leftJoin(topics, eq(topics.sectionId, sections.id))
      .groupBy(sections.id)
      .orderBy(asc(sections.sort), asc(sections.id));
    return json({
      sections: rows.map((r) => ({
        id: r.section.id,
        title: r.section.title,
        description: r.section.description,
        icon: r.section.icon,
        isClosed: r.section.isClosed,
        sort: r.section.sort,
        topicCount: r.topicCount,
      })),
    });
  });
}

export async function POST(req: Request) {
  return guard(async () => {
    await requireAdminMenu();
    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
    const title = String(body.title ?? "").trim().slice(0, 80);
    const description = String(body.description ?? "").trim().slice(0, 200);
    const icon = String(body.icon ?? "MessagesSquare").slice(0, 40);
    if (title.length < 3) throw new HttpError(400, "Название ветки слишком короткое");
    const [row] = await db.select({ value: max(sections.sort) }).from(sections);
    const [created] = await db
      .insert(sections)
      .values({ title, description, icon, sort: (row?.value ?? 0) + 1 })
      .returning();
    return json({ section: created });
  });
}

export async function PATCH(req: Request) {
  return guard(async () => {
    await requireAdminMenu();
    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
    const id = Number(body.id);
    if (!id) throw new HttpError(400, "Не указана ветка");
    const patch: Partial<typeof sections.$inferInsert> = {};
    if (typeof body.title === "string" && body.title.trim().length >= 3) {
      patch.title = body.title.trim().slice(0, 80);
    }
    if (typeof body.description === "string") {
      patch.description = body.description.trim().slice(0, 200);
    }
    if (typeof body.icon === "string") patch.icon = body.icon.slice(0, 40);
    if (typeof body.isClosed === "boolean") patch.isClosed = body.isClosed;
    if (typeof body.sort === "number" && Number.isFinite(body.sort)) patch.sort = body.sort;
    if (Object.keys(patch).length === 0) throw new HttpError(400, "Нечего обновлять");
    const [updated] = await db
      .update(sections)
      .set(patch)
      .where(eq(sections.id, id))
      .returning();
    if (!updated) throw new HttpError(404, "Ветка не найдена");
    return json({ section: updated });
  });
}

export async function DELETE(req: Request) {
  return guard(async () => {
    await requireAdminMenu();
    const id = Number(new URL(req.url).searchParams.get("id"));
    if (!id) throw new HttpError(400, "Не указана ветка");
    await db.delete(sections).where(eq(sections.id, id));
    return json({ ok: true });
  });
}
