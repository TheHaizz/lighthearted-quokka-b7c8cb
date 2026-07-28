import { and, count, eq } from "drizzle-orm";
import { db } from "@/db";
import { giveawayEntries, news } from "@/db/schema";
import { guard, HttpError, json } from "@/lib/api";
import { assertWritable, requireUser } from "@/lib/auth";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(_req: Request, ctx: Ctx) {
  const { id: raw } = await ctx.params;
  const newsId = Number(raw);
  return guard(async () => {
    const u = await requireUser();
    assertWritable(u);
    const [item] = await db.select().from(news).where(eq(news.id, newsId)).limit(1);
    if (!item) throw new HttpError(404, "Публикация не найдена");
    if (item.kind !== "giveaway") {
      throw new HttpError(400, "Участвовать можно только в раздачах");
    }
    const existing = await db
      .select()
      .from(giveawayEntries)
      .where(and(eq(giveawayEntries.newsId, newsId), eq(giveawayEntries.userId, u.id)))
      .limit(1);
    let entered: boolean;
    if (existing.length > 0) {
      await db
        .delete(giveawayEntries)
        .where(and(eq(giveawayEntries.newsId, newsId), eq(giveawayEntries.userId, u.id)));
      entered = false;
    } else {
      await db.insert(giveawayEntries).values({ newsId, userId: u.id });
      entered = true;
    }
    const [row] = await db
      .select({ c: count() })
      .from(giveawayEntries)
      .where(eq(giveawayEntries.newsId, newsId));
    return json({ entered, entries: row?.c ?? 0 });
  });
}
