import { count, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { giveawayEntries, news, users } from "@/db/schema";
import { cleanImage, guard, HttpError, iso, json } from "@/lib/api";
import { getCurrentUser, requireAdminMenu } from "@/lib/auth";
import type { NewsKind } from "@/lib/types";

const VALID_KINDS: NewsKind[] = ["update", "giveaway", "announcement"];

export async function GET(req: Request) {
  return guard(async () => {
    const kindParam = new URL(req.url).searchParams.get("kind");
    let rows = await db
      .select({ item: news, author: users })
      .from(news)
      .innerJoin(users, eq(news.authorId, users.id))
      .orderBy(desc(news.id))
      .limit(80);
    if (kindParam && VALID_KINDS.includes(kindParam as NewsKind)) {
      rows = rows.filter((r) => r.item.kind === kindParam);
    }
    const entryCounts = await db
      .select({ newsId: giveawayEntries.newsId, c: count() })
      .from(giveawayEntries)
      .groupBy(giveawayEntries.newsId);
    const ecMap = new Map(entryCounts.map((e) => [e.newsId, e.c]));

    const me = await getCurrentUser();
    const enteredSet = new Set<number>();
    if (me) {
      const mine = await db
        .select({ newsId: giveawayEntries.newsId })
        .from(giveawayEntries)
        .where(eq(giveawayEntries.userId, me.id));
      mine.forEach((m) => enteredSet.add(m.newsId));
    }

    return json({
      news: rows.map((r) => ({
        id: r.item.id,
        kind: r.item.kind,
        title: r.item.title,
        content: r.item.content,
        imageUrl: r.item.imageUrl,
        createdAt: iso(r.item.createdAt),
        authorName: r.author.nickname,
        entries: ecMap.get(r.item.id) ?? 0,
        entered: enteredSet.has(r.item.id),
      })),
    });
  });
}

export async function POST(req: Request) {
  return guard(async () => {
    await requireAdminMenu();
    const me = await getCurrentUser();
    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
    const kind = String(body.kind ?? "update") as NewsKind;
    if (!VALID_KINDS.includes(kind)) throw new HttpError(400, "Неизвестный тип публикации");
    const title = String(body.title ?? "").trim().slice(0, 140);
    const content = String(body.content ?? "").trim().slice(0, 8000);
    const image = cleanImage(body.image);
    if (title.length < 4) throw new HttpError(400, "Заголовок: минимум 4 символа");
    if (content.length < 4) throw new HttpError(400, "Текст публикации слишком короткий");
    const [created] = await db
      .insert(news)
      .values({ authorId: me?.id ?? 1, title, content, kind, imageUrl: image })
      .returning();
    return json({ id: created.id });
  });
}

export async function DELETE(req: Request) {
  return guard(async () => {
    await requireAdminMenu();
    const id = Number(new URL(req.url).searchParams.get("id"));
    if (!id) throw new HttpError(400, "Не указана публикация");
    await db.delete(news).where(eq(news.id, id));
    return json({ ok: true });
  });
}
