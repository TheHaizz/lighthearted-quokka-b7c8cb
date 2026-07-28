import { asc, count, desc, eq, max } from "drizzle-orm";
import { db } from "@/db";
import { posts, sections, topics, users } from "@/db/schema";
import { cleanImage, guard, HttpError, iso, json } from "@/lib/api";
import {
  assertWritable,
  canModerate,
  isAdminUnlocked,
  requireStaff,
  requireUser,
  toAuthor,
  toMe,
} from "@/lib/auth";

export async function GET(req: Request) {
  return guard(async () => {
    const url = new URL(req.url);
    const id = Number(url.searchParams.get("id"));

    if (id) {
      const rows = await db
        .select({ topic: topics, author: users, section: sections })
        .from(topics)
        .innerJoin(users, eq(topics.authorId, users.id))
        .innerJoin(sections, eq(topics.sectionId, sections.id))
        .where(eq(topics.id, id))
        .limit(1);
      const row = rows[0];
      if (!row) throw new HttpError(404, "Тема не найдена");
      const postRows = await db
        .select({ post: posts, author: users })
        .from(posts)
        .innerJoin(users, eq(posts.authorId, users.id))
        .where(eq(posts.topicId, id))
        .orderBy(asc(posts.id));
      return json({
        topic: {
          id: row.topic.id,
          sectionId: row.topic.sectionId,
          title: row.topic.title,
          createdAt: iso(row.topic.createdAt),
          author: toAuthor(row.author),
        },
        section: {
          id: row.section.id,
          title: row.section.title,
          icon: row.section.icon,
          isClosed: row.section.isClosed,
        },
        posts: postRows.map((p) => ({
          id: p.post.id,
          topicId: p.post.topicId,
          content: p.post.content,
          imageUrl: p.post.imageUrl,
          createdAt: iso(p.post.createdAt),
          author: toAuthor(p.author),
        })),
        canModerate: await canModerate(),
      });
    }

    const sectionId = Number(url.searchParams.get("sectionId"));
    if (!sectionId) throw new HttpError(400, "Укажите sectionId или id темы");

    const rows = await db
      .select({ topic: topics, author: users })
      .from(topics)
      .innerJoin(users, eq(topics.authorId, users.id))
      .where(eq(topics.sectionId, sectionId))
      .orderBy(desc(topics.id));

    const stats = await db
      .select({ topicId: posts.topicId, c: count(), last: max(posts.createdAt) })
      .from(posts)
      .groupBy(posts.topicId);
    const statMap = new Map(stats.map((s) => [s.topicId, s]));

    return json({
      topics: rows.map((r) => {
        const st = statMap.get(r.topic.id);
        return {
          id: r.topic.id,
          sectionId: r.topic.sectionId,
          title: r.topic.title,
          createdAt: iso(r.topic.createdAt),
          postCount: st?.c ?? 0,
          lastAt: st?.last ? iso(st.last) : null,
          author: toAuthor(r.author),
        };
      }),
    });
  });
}

export async function POST(req: Request) {
  return guard(async () => {
    const u = await requireUser();
    assertWritable(u);
    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
    const sectionId = Number(body.sectionId);
    const title = String(body.title ?? "").trim().slice(0, 140);
    const content = String(body.content ?? "").trim().slice(0, 4000);
    const image = cleanImage(body.image);
    if (!sectionId) throw new HttpError(400, "Не указана ветка");
    if (title.length < 4) throw new HttpError(400, "Заголовок темы: минимум 4 символа");
    if (content.length < 2) throw new HttpError(400, "Напишите текст первого сообщения");

    const [sec] = await db
      .select()
      .from(sections)
      .where(eq(sections.id, sectionId))
      .limit(1);
    if (!sec) throw new HttpError(404, "Ветка не найдена");
    const staff = toMe(u).isStaff || (await isAdminUnlocked());
    if (sec.isClosed && !staff) {
      throw new HttpError(403, "Ветка закрыта для новых тем");
    }

    const [t] = await db
      .insert(topics)
      .values({ sectionId, authorId: u.id, title })
      .returning();
    await db
      .insert(posts)
      .values({ topicId: t.id, authorId: u.id, content, imageUrl: image });
    return json({ topicId: t.id });
  });
}

export async function DELETE(req: Request) {
  return guard(async () => {
    await requireStaff();
    const id = Number(new URL(req.url).searchParams.get("id"));
    if (!id) throw new HttpError(400, "Не указана тема");
    await db.delete(topics).where(eq(topics.id, id));
    return json({ ok: true });
  });
}
