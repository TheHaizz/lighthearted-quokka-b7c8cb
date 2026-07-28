import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { ticketReplies, tickets, users } from "@/db/schema";
import { cleanImage, guard, HttpError, iso, json } from "@/lib/api";
import {
  assertWritable,
  getCurrentUser,
  isAdminUnlocked,
  requireUser,
  toAuthor,
  type DBUser,
} from "@/lib/auth";
import type { TicketStatus } from "@/lib/types";

type Ctx = { params: Promise<{ id: string }> };

const VALID_STATUS: TicketStatus[] = ["open", "progress", "accepted", "rejected"];

function canView(ticketAuthorId: number, user: DBUser | null, unlocked: boolean) {
  if (unlocked) return true;
  if (!user) return false;
  return (
    user.id === ticketAuthorId || user.role === "moderator" || user.role === "admin"
  );
}

export async function GET(_req: Request, ctx: Ctx) {
  const { id: raw } = await ctx.params;
  const id = Number(raw);
  return guard(async () => {
    const rows = await db
      .select({ ticket: tickets, author: users })
      .from(tickets)
      .innerJoin(users, eq(tickets.authorId, users.id))
      .where(eq(tickets.id, id))
      .limit(1);
    const row = rows[0];
    if (!row) throw new HttpError(404, "Обращение не найдено");
    const me = await getCurrentUser();
    const unlocked = await isAdminUnlocked();
    if (!canView(row.ticket.authorId, me, unlocked)) {
      throw new HttpError(403, "Это обращение видят только автор и команда сервера");
    }
    const replyRows = await db
      .select({ reply: ticketReplies, author: users })
      .from(ticketReplies)
      .innerJoin(users, eq(ticketReplies.authorId, users.id))
      .where(eq(ticketReplies.ticketId, id))
      .orderBy(asc(ticketReplies.id));
    return json({
      ticket: {
        id: row.ticket.id,
        type: row.ticket.type,
        title: row.ticket.title,
        content: row.ticket.content,
        targetName: row.ticket.targetName,
        imageUrl: row.ticket.imageUrl,
        status: row.ticket.status,
        createdAt: iso(row.ticket.createdAt),
        author: toAuthor(row.author),
      },
      replies: replyRows.map((r) => ({
        id: r.reply.id,
        ticketId: r.reply.ticketId,
        content: r.reply.content,
        imageUrl: r.reply.imageUrl,
        createdAt: iso(r.reply.createdAt),
        author: toAuthor(r.author),
      })),
      canModerate:
        unlocked ||
        (me !== null && (me.role === "moderator" || me.role === "admin")),
    });
  });
}

export async function PATCH(req: Request, ctx: Ctx) {
  const { id: raw } = await ctx.params;
  const id = Number(raw);
  return guard(async () => {
    const me = await getCurrentUser();
    const unlocked = await isAdminUnlocked();
    const staff =
      unlocked || (me !== null && (me.role === "moderator" || me.role === "admin"));
    if (!staff) throw new HttpError(403, "Недостаточно прав");
    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
    const status = String(body.status ?? "") as TicketStatus;
    if (!VALID_STATUS.includes(status)) throw new HttpError(400, "Неизвестный статус");
    const [updated] = await db
      .update(tickets)
      .set({ status })
      .where(eq(tickets.id, id))
      .returning();
    if (!updated) throw new HttpError(404, "Обращение не найдено");
    return json({ status: updated.status });
  });
}

export async function POST(req: Request, ctx: Ctx) {
  const { id: raw } = await ctx.params;
  const id = Number(raw);
  return guard(async () => {
    const u = await requireUser();
    assertWritable(u);
    const rows = await db.select().from(tickets).where(eq(tickets.id, id)).limit(1);
    const t = rows[0];
    if (!t) throw new HttpError(404, "Обращение не найдено");
    const unlocked = await isAdminUnlocked();
    const staff = unlocked || u.role === "moderator" || u.role === "admin";
    if (u.id !== t.authorId && !staff) {
      throw new HttpError(403, "Нет доступа к этому обращению");
    }
    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
    const content = String(body.content ?? "").trim().slice(0, 3000);
    const image = cleanImage(body.image);
    if (content.length < 1 && !image) throw new HttpError(400, "Пустой ответ");
    const [reply] = await db
      .insert(ticketReplies)
      .values({ ticketId: id, authorId: u.id, content, imageUrl: image })
      .returning();
    // When staff answers a fresh ticket — move it to "in progress" automatically.
    if (staff && u.id !== t.authorId && t.status === "open") {
      await db.update(tickets).set({ status: "progress" }).where(eq(tickets.id, id));
    }
    return json({
      reply: {
        id: reply.id,
        ticketId: reply.ticketId,
        content: reply.content,
        imageUrl: reply.imageUrl,
        createdAt: iso(reply.createdAt),
        author: toAuthor(u),
      },
    });
  });
}
