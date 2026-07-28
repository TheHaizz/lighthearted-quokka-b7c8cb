import { guard, HttpError, json } from "@/lib/api";
import { checkAdminPassword, lockAdmin, unlockAdmin } from "@/lib/auth";

export async function POST(req: Request) {
  return guard(async () => {
    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
    const password = String(body.password ?? "");
    if (!checkAdminPassword(password)) {
      throw new HttpError(401, "Доступ отклонён");
    }
    await unlockAdmin();
    return json({ ok: true });
  });
}

export async function DELETE() {
  return guard(async () => {
    await lockAdmin();
    return json({ ok: true });
  });
}
