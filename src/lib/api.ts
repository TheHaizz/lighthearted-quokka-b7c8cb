import { NextResponse } from "next/server";

export class HttpError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export function json(data: unknown, status = 200) {
  return NextResponse.json(data, { status });
}

export async function guard(
  fn: () => Promise<NextResponse | Response>,
): Promise<NextResponse | Response> {
  try {
    return await fn();
  } catch (e) {
    if (e instanceof HttpError) {
      return json({ error: e.message }, e.status);
    }
    console.error("[api error]", e);
    return json({ error: "Внутренняя ошибка сервера" }, 500);
  }
}

/** Validates a data-url image coming from the client (already compressed). */
export function cleanImage(v: unknown): string | null {
  if (typeof v !== "string" || v.length === 0) return null;
  if (!v.startsWith("data:image/")) return null;
  if (v.length > 1_400_000) {
    throw new HttpError(400, "Изображение слишком большое (макс ~1 МБ)");
  }
  return v;
}

export function iso(d: unknown): string {
  return new Date(d as string | Date).toISOString();
}
