"use client";

import type { ReactNode } from "react";
import { LoaderCircle } from "lucide-react";
import { cn } from "@/lib/client";

export function Spinner({ className }: { className?: string }) {
  return (
    <LoaderCircle className={cn("size-5 animate-spin text-honey", className)} />
  );
}

export function LoadingBlock({ label = "Загрузка…" }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-20 text-zinc-500">
      <Spinner className="size-7" />
      <p className="text-xs uppercase tracking-[0.25em]">{label}</p>
    </div>
  );
}

export function Empty({
  icon,
  title,
  hint,
  action,
}: {
  icon?: ReactNode;
  title: string;
  hint?: string;
  action?: ReactNode;
}) {
  return (
    <div className="card anim-pop flex flex-col items-center gap-2.5 border-dashed px-6 py-14 text-center">
      {icon && (
        <span className="grid size-12 place-items-center rounded-2xl border border-line bg-panel2 text-honey">
          {icon}
        </span>
      )}
      <p className="font-bold text-zinc-200">{title}</p>
      {hint && <p className="max-w-sm text-xs text-zinc-500">{hint}</p>}
      {action}
    </div>
  );
}

export function PageHeader({
  title,
  sub,
  right,
}: {
  title: string;
  sub?: string;
  right?: ReactNode;
}) {
  return (
    <div className="anim-fade-up mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="font-display text-xl font-bold tracking-wide text-zinc-50 md:text-2xl">
          {title}
        </h1>
        {sub && <p className="mt-1 text-xs text-zinc-500 md:text-sm">{sub}</p>}
      </div>
      {right}
    </div>
  );
}

export function StatusChip({ label, color }: { label: string; color: string }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide"
      style={{
        color,
        borderColor: `${color}55`,
        background: `${color}12`,
        boxShadow: `0 0 14px ${color}18`,
      }}
    >
      <span className="size-1.5 rounded-full" style={{ background: color }} />
      {label}
    </span>
  );
}

export function FieldLabel({ children }: { children: ReactNode }) {
  return (
    <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500">
      {children}
    </label>
  );
}
