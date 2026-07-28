"use client";

import { Crown } from "lucide-react";
import { cn } from "@/lib/client";
import type { AuthorInfo } from "@/lib/types";

type ChipUser = Pick<
  AuthorInfo,
  "nickname" | "role" | "prefix" | "prefixColor" | "status" | "statusColor"
>;

export function UserChip({
  user,
  size = "md",
  className,
}: {
  user: ChipUser;
  size?: "sm" | "md";
  className?: string;
}) {
  const isAdmin = user.role === "admin";
  const isMod = user.role === "moderator";
  const text = size === "sm" ? "text-xs" : "text-sm";
  const tag = size === "sm" ? "text-[9px]" : "text-[10px]";
  const crown = size === "sm" ? "size-3.5" : "size-4";

  return (
    <span className={cn("inline-flex min-w-0 items-center gap-1.5", className)}>
      {isAdmin && (
        <Crown
          className={cn(
            crown,
            "shrink-0 fill-honey/25 text-honey drop-shadow-[0_0_6px_rgba(255,210,61,0.65)]",
          )}
          aria-label="Администратор"
        />
      )}
      {isMod && (
        <Crown
          className={cn(
            crown,
            "shrink-0 fill-white/15 text-zinc-100 drop-shadow-[0_0_6px_rgba(255,255,255,0.45)]",
          )}
          aria-label="Модератор"
        />
      )}
      {user.prefix && (
        <span
          className={cn(
            "shrink-0 rounded-md border px-1.5 py-px font-extrabold uppercase tracking-wide",
            tag,
          )}
          style={{
            color: user.prefixColor,
            borderColor: `${user.prefixColor}55`,
            background: `${user.prefixColor}14`,
            boxShadow: `0 0 14px ${user.prefixColor}20`,
          }}
        >
          {user.prefix}
        </span>
      )}
      <span
        className={cn(
          "truncate font-bold",
          text,
          isAdmin ? "text-honey" : "text-zinc-100",
        )}
      >
        {user.nickname}
      </span>
      {user.status && (
        <span
          className={cn(
            "hidden shrink-0 items-center gap-1 rounded-full border px-1.5 py-px sm:inline-flex",
            tag,
          )}
          style={{
            color: user.statusColor,
            borderColor: `${user.statusColor}44`,
            background: `${user.statusColor}10`,
          }}
        >
          <span
            className="size-1 rounded-full"
            style={{ background: user.statusColor }}
          />
          {user.status}
        </span>
      )}
    </span>
  );
}
