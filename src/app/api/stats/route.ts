import { count, eq } from "drizzle-orm";
import { db } from "@/db";
import { news, tickets, topics, users } from "@/db/schema";
import { guard, json } from "@/lib/api";

export async function GET() {
  return guard(async () => {
    const [u] = await db.select({ c: count() }).from(users);
    const [t] = await db.select({ c: count() }).from(topics);
    const [tk] = await db
      .select({ c: count() })
      .from(tickets)
      .where(eq(tickets.status, "open"));
    const [g] = await db
      .select({ c: count() })
      .from(news)
      .where(eq(news.kind, "giveaway"));
    // Playful "online" number that drifts with time of day.
    const now = new Date();
    const seed = now.getUTCDate() * 7 + now.getUTCHours() * 3 + now.getUTCMinutes();
    const players = 14 + (seed % 31);
    return json({
      players,
      users: u?.c ?? 0,
      topics: t?.c ?? 0,
      openTickets: tk?.c ?? 0,
      giveaways: g?.c ?? 0,
    });
  });
}
