import { count, desc, eq } from "drizzle-orm";
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
import type { TicketType } from "@/lib/types";

const VALID_TYPES: TicketType[] = ["report", "appeal", "app_moderator", "app_admin"];

function staffView(user: DBUser | null, unlocked: boolean): boolean {
  return unlocked || (user !== null && (user.role === "moderator" || user.role === "admin"));
}

export async function GET(req: Request) {
  return guard(async () => {
    const url = new URL(req.url);
    const typeParam = url.searchParams.get("type");
    const me = await getCurrentUser();
    const unlocked = await isAdminUnlocked();
    if (!me && !unlocked) throw new HttpError(401, "Требуется авторизация");

    let rows;
    if (staffView(me, unlocked)) {
      rows = await db
        .select({ ticket: tickets, author: users })
        .from(tickets)
        .innerJoin(users, eq(tickets.authorId, users.id))
        .orderBy(desc(tickets.id))
        .limit(300);
    } else {
      rows = await db
        .select({ ticket: tickets, author: users })
        .from(tickets)
        .innerJoin(users, eq(tickets.authorId, users.id))
        .where(eq(tickets.authorId, me!.id))
        .orderBy(desc(tickets.id))
        .limit(300);
    }
    if (typeParam && VALID_TYPES.includes(typeParam as TicketType)) {
      rows = rows.filter((r) => r.ticket.type === typeParam);
    }

    const replyCounts = await db
      .select({ ticketId: ticketReplies.ticketId, c: count() })
      .from(ticketReplies)
      .groupBy(ticketReplies.ticketId);
    const rcMap = new Map(replyCounts.map((r) => [r.ticketId, r.c]));

    return json({
      isStaff: staffView(me, unlocked),
      tickets: rows.map((r) => ({
        id: r.ticket.id,
        type: r.ticket.type,
        title: r.ticket.title,
        content: r.ticket.content,
        targetName: r.ticket.targetName,
        imageUrl: r.ticket.imageUrl,
        status: r.ticket.status,
        createdAt: iso(r.ticket.createdAt),
        author: toAuthor(r.author),
        replyCount: rcMap.get(r.ticket.id) ?? 0,
      })),
    });
  });
}

export async function POST(req: Request) {
  return guard(async () => {
    const u = await requireUser();
    assertWritable(u);
    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
    const type = String(body.type ?? "") as TicketType;
    if (!VALID_TYPES.includes(type)) throw new HttpError(400, "Неизвестный тип обращения");
    const title = String(body.title ?? "").trim().slice(0, 140);
    const content = String(body.content ?? "").trim().slice(0, 4000);
    const targetName = String(body.targetName ?? "").trim().slice(0, 40);
    const image = cleanImage(body.image);
    if (title.length < 4) throw new HttpError(400, "Тема обращения: минимум 4 символа");
    if (content.length < 10) {
      throw new HttpError(400, "Заполните шаблон обращения (минимум 10 символов)");
    }
    const [t] = await db
      .insert(tickets)
      .values({
        type,
        authorId: u.id,
        title,
        content,
        targetName: targetName || null,
        imageUrl: image,
      })
      .returning();
    return json({ ticketId: t.id });
  });
}
