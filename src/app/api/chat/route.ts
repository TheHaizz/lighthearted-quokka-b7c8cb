import { asc, desc, eq, gt } from "drizzle-orm";
import { db } from "@/db";
import { chatMessages, users } from "@/db/schema";
import { cleanImage, guard, HttpError, iso, json } from "@/lib/api";
import {
  assertWritable,
  canModerate,
  requireStaff,
  requireUser,
  toAuthor,
} from "@/lib/auth";

export async function GET(req: Request) {
  return guard(async () => {
    const after = Number(new URL(req.url).searchParams.get("after") ?? 0);
    let rows;
    if (after > 0) {
      rows = await db
        .select({ msg: chatMessages, author: users })
        .from(chatMessages)
        .innerJoin(users, eq(chatMessages.authorId, users.id))
        .where(gt(chatMessages.id, after))
        .orderBy(asc(chatMessages.id))
        .limit(150);
    } else {
      const latest = await db
        .select({ msg: chatMessages, author: users })
        .from(chatMessages)
        .innerJoin(users, eq(chatMessages.authorId, users.id))
        .orderBy(desc(chatMessages.id))
        .limit(60);
      rows = latest.reverse();
    }
    return json({
      messages: rows.map((r) => ({
        id: r.msg.id,
        content: r.msg.content,
        imageUrl: r.msg.imageUrl,
        createdAt: iso(r.msg.createdAt),
        author: toAuthor(r.author),
      })),
      canModerate: await canModerate(),
    });
  });
}

export async function POST(req: Request) {
  return guard(async () => {
    const u = await requireUser();
    assertWritable(u);
    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
    const content = String(body.content ?? "").trim().slice(0, 500);
    const image = cleanImage(body.image);
    if (content.length < 1 && !image) throw new HttpError(400, "Пустое сообщение");
    const [msg] = await db
      .insert(chatMessages)
      .values({ authorId: u.id, content, imageUrl: image })
      .returning();
    return json({
      message: {
        id: msg.id,
        content: msg.content,
        imageUrl: msg.imageUrl,
        createdAt: iso(msg.createdAt),
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
    await db.delete(chatMessages).where(eq(chatMessages.id, id));
    return json({ ok: true });
  });
}
