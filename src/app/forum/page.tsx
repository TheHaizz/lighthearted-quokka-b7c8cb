"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ChevronRight, Lock, MessagesSquare } from "lucide-react";
import { api } from "@/lib/client";
import type { Section } from "@/lib/types";
import { Empty, LoadingBlock, PageHeader } from "@/components/ui";
import { SectionIcon } from "@/components/SectionIcon";

export default function ForumPage() {
  const [sections, setSections] = useState<Section[] | null>(null);

  useEffect(() => {
    api<{ sections: Section[] }>("/api/sections")
      .then((d) => setSections(d.sections))
      .catch(() => setSections([]));
  }, []);

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 md:px-8 md:py-8">
      <PageHeader
        title="Форум"
        sub="Ветки обсуждений сервера LoloGrief — выбирай раздел и создавай темы"
      />
      {!sections ? (
        <LoadingBlock />
      ) : sections.length === 0 ? (
        <Empty
          icon={<MessagesSquare className="size-6" />}
          title="Веток пока нет"
          hint="Администратор может создать ветки через Админ-меню"
        />
      ) : (
        <div className="stagger space-y-3">
          {sections.map((s) => (
            <Link
              key={s.id}
              href={`/forum/${s.id}`}
              className="card card-hover group flex items-center gap-4 p-4 md:p-5"
            >
              <span className="grid size-12 shrink-0 place-items-center rounded-2xl border border-line bg-panel2 text-honey transition-all duration-300 group-hover:border-honey/50 group-hover:shadow-[0_0_22px_-4px_rgba(255,210,61,0.55)]">
                <SectionIcon name={s.icon} className="size-5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex flex-wrap items-center gap-2">
                  <span className="font-bold text-zinc-100">{s.title}</span>
                  {s.isClosed && (
                    <span className="inline-flex items-center gap-1 rounded-full border border-red-400/40 bg-red-400/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-red-300">
                      <Lock className="size-2.5" /> Закрыта
                    </span>
                  )}
                </span>
                <span className="mt-0.5 block truncate text-xs text-zinc-500">
                  {s.description || "Без описания"}
                </span>
              </span>
              <span className="hidden shrink-0 rounded-lg border border-line bg-panel2 px-2.5 py-1 font-mono text-[11px] text-zinc-400 sm:block">
                {s.topicCount} тем
              </span>
              <ChevronRight className="size-4 shrink-0 text-zinc-600 transition-transform duration-300 group-hover:translate-x-1 group-hover:text-honey" />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
