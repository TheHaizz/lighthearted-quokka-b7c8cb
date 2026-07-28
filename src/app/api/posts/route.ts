import { eq } from "drizzle-orm";
import { db } from "@/db";
import { posts, sections, topics } from "@/db/schema";
import { cleanImage, guard, HttpError, iso, json } from "@/lib/api";
import {
  assertWritable,
  isAdminUnlocked,
  requireStaff,
  requireUser,
  toAuthor,
  toMe,
} from "@/lib/auth";

export async function POST(req: Request) {
  return guard(async () => {
    const u = await requireUser();
    assertWritable(u);
    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
    const topicId = Number(body.topicId);
    const content = String(body.content ?? "").trim().slice(0, 4000);
    const image = cleanImage(body.image);
    if (!topicId) throw new HttpError(400, "Не указана тема");
    if (content.length < 1 && !image) throw new HttpError(400, "Пустое сообщение");

    const rows = await db
      .select({ topic: topics, section: sections })
      .from(topics)
      .innerJoin(sections, eq(topics.sectionId, sections.id))
      .where(eq(topics.id, topicId))
      .limit(1);
    const row = rows[0];
    if (!row) throw new HttpError(404, "Тема не найдена");
    const staff = toMe(u).isStaff || (await isAdminUnlocked());
    if (row.section.isClosed && !staff) {
      throw new HttpError(403, "Ветка закрыта модерацией");
    }

    const [p] = await db
      .insert(posts)
      .values({ topicId, authorId: u.id, content, imageUrl: image })
      .returning();
    return json({
      post: {
        id: p.id,
        topicId: p.topicId,
        content: p.content,
        imageUrl: p.imageUrl,
        createdAt: iso(p.createdAt),
        author: toAuthor(u),
      },
    });
  });
}

export async function DELETE(req: Request) {
  return guard(async () => {
    await requireStaff();
    const id = Number(new URL(req.url).searchParams.get("id"));
    if (!id) throw new HttpError(400, "Не указано сообщение");
    await db.delete(posts).where(eq(posts.id, id));
    return json({ ok: true });
  });
}
