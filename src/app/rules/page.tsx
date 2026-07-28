"use client";

import { useState } from "react";
import {
  ChevronDown,
  Gavel,
  Gamepad2,
  ScrollText,
  ShieldAlert,
  UserRound,
} from "lucide-react";
import { cn } from "@/lib/client";
import { PageHeader } from "@/components/ui";

interface RuleGroup {
  icon: typeof ScrollText;
  title: string;
  accent: string;
  rules: string[];
}

const GROUPS: RuleGroup[] = [
  {
    icon: UserRound,
    title: "1. Поведение и общение",
    accent: "#ffd23d",
    rules: [
      "1.1. Оскорбления, токсичность и провокации — мут от 30 минут.",
      "1.2. Спам, флуд, КАПС и злоупотребление символами — предупреждение, затем мут.",
      "1.3. Реклама сторонних серверов и ресурсов — мгновенный бан.",
      "1.4. Запрещены контент 18+, шок-контент и разжигание конфликтов.",
      "1.5. Уважай команду сервера: спорные решения обсуждаются в тикетах, а не в чате.",
    ],
  },
  {
    icon: Gamepad2,
    title: "2. Игровой процесс",
    accent: "#38bdf8",
    rules: [
      "2.1. Читы, X-Ray, макросы и любые модификации, дающие преимущество, — бан без предупреждения.",
      "2.2. Дюп предметов и эксплуатация багов — бан + откат имущества. Нашёл баг — сообщи в репорт.",
      "2.3. Запрещено намеренное создание лаг-машин и краш-механизмов.",
      "2.4. Обман при торговле (scam) наказывается баном до 7 дней.",
      "2.5. Твинк-аккаунты для обхода наказаний блокируются вместе с основным.",
    ],
  },
  {
    icon: ShieldAlert,
    title: "3. Аккаунт и безопасность",
    accent: "#4ade80",
    rules: [
      "3.1. Один игрок — один основной аккаунт на форуме и в игре.",
      "3.2. Передача и продажа аккаунтов запрещена — доступ потеряешь навсегда.",
      "3.3. Никогда не сообщай пароль: администрация его никогда не спрашивает.",
      "3.4. Взломан аккаунт? Сразу создай тикет «Обжалование» с описанием ситуации.",
    ],
  },
  {
    icon: Gavel,
    title: "4. Наказания и обжалование",
    accent: "#f87171",
    rules: [
      "4.1. Лестница наказаний: предупреждение → мут → кик → временный бан → перманентный бан.",
      "4.2. Модераторы (белая корона) могут мутить и принимать репорты.",
      "4.3. Администраторы (жёлтая корона) решают вопросы банов, ролей и раздач.",
      "4.4. Любое наказание можно обжаловать через тикет «Обжалование бана» с доказательствами.",
      "4.5. Ложные репорты и давление на команду наказываются так же, как нарушение.",
    ],
  },
];

export default function RulesPage() {
  const [open, setOpen] = useState<number>(0);

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 md:px-8 md:py-8">
      <PageHeader
        title="Сводка правил LoloGrief"
        sub="Вступая на сервер, ты автоматически соглашаешься с правилами. Незнание не освобождает от ответственности."
      />

      <div className="stagger space-y-3">
        {GROUPS.map((g, i) => {
          const Icon = g.icon;
          const isOpen = open === i;
          return (
            <div
              key={g.title}
              className={cn(
                "card overflow-hidden transition-all duration-300",
                isOpen && "border-honey/30",
              )}
            >
              <button
                onClick={() => setOpen(isOpen ? -1 : i)}
                className="flex w-full items-center gap-3 p-4 text-left"
              >
                <span
                  className="grid size-10 shrink-0 place-items-center rounded-xl border"
                  style={{
                    color: g.accent,
                    borderColor: `${g.accent}44`,
                    background: `${g.accent}10`,
                  }}
                >
                  <Icon className="size-4.5" />
                </span>
                <span className="flex-1 font-display text-sm font-bold text-zinc-100 md:text-base">
                  {g.title}
                </span>
                <ChevronDown
                  className={cn(
                    "size-4 text-zinc-500 transition-transform duration-300",
                    isOpen && "rotate-180 text-honey",
                  )}
                />
              </button>
              <div
                className={cn(
                  "grid transition-all duration-300 ease-out",
                  isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
                )}
              >
                <div className="overflow-hidden">
                  <ul className="space-y-2 border-t border-line px-4 py-4">
                    {g.rules.map((r) => (
                      <li
                        key={r}
                        className="rounded-xl border border-line/60 bg-panel2/60 px-3.5 py-2.5 text-[13px] leading-relaxed text-zinc-300"
                      >
                        {r}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-6 rounded-2xl border border-honey/25 bg-honey/5 p-4 text-xs leading-relaxed text-zinc-400">
        <span className="font-bold text-honey">Обжалование:</span> если считаешь
        наказание несправедливым — открой тикет «Обжалование бана» в разделе
        «Обращения», заполни шаблон и приложи скриншоты. Администрация отвечает в
        течение 24 часов.
      </div>
    </div>
  );
}
