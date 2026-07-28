"use client";

import { useEffect, useState, type ReactNode } from "react";
import { Hexagon } from "lucide-react";
import { AppShell } from "./AppShell";

const BOOT_LINES = [
  "Инициализация ядра планшета…",
  "Подключение к play.lologrief.fun…",
  "Загрузка модулей LoloForum…",
  "Синхронизация базы игроков…",
  "Готово. Добро пожаловать!",
];

export function TabletFrame({ children }: { children: ReactNode }) {
  const [progress, setProgress] = useState(0);
  const [booted, setBooted] = useState(false);

  useEffect(() => {
    let already = false;
    try {
      already = sessionStorage.getItem("lolo-boot") === "1";
    } catch {
      /* ignore */
    }
    if (already) {
      setBooted(true);
      return;
    }
    let p = 0;
    const t = setInterval(() => {
      p = Math.min(100, p + 3 + Math.random() * 12);
      setProgress(Math.floor(p));
      if (p >= 100) {
        clearInterval(t);
        setTimeout(() => {
          setBooted(true);
          try {
            sessionStorage.setItem("lolo-boot", "1");
          } catch {
            /* ignore */
          }
        }, 500);
      }
    }, 115);
    return () => clearInterval(t);
  }, []);

  const bootLine =
    BOOT_LINES[Math.min(BOOT_LINES.length - 1, Math.floor(progress / 22))];

  const skipBoot = () => {
    setProgress(100);
    setBooted(true);
    try {
      sessionStorage.setItem("lolo-boot", "1");
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="relative h-dvh w-full overflow-hidden bg-ink font-body">
      {/* ambient backdrop */}
      <div className="honeycomb absolute inset-0 opacity-70" />
      <div className="absolute -left-40 -top-40 size-[34rem] rounded-full bg-honey/10 blur-[120px]" />
      <div className="absolute -bottom-48 -right-40 size-[36rem] rounded-full bg-honeydeep/10 blur-[140px]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_35%,rgba(0,0,0,0.75)_100%)]" />
      {/* floating hexagons */}
      <Hexagon className="anim-float absolute left-[8%] top-[12%] hidden size-10 text-honey/15 md:block" />
      <Hexagon
        className="anim-float absolute right-[10%] top-[70%] hidden size-14 text-honey/10 md:block"
        style={{ animationDelay: "1.4s" }}
      />
      <Hexagon
        className="anim-float absolute left-[14%] top-[76%] hidden size-8 text-honey/20 md:block"
        style={{ animationDelay: "2.6s" }}
      />

      {/* device */}
      <div className="relative z-10 flex h-full w-full items-center justify-center md:p-6">
        <div className="relative h-full w-full md:h-[min(88dvh,880px)] md:max-w-[1240px]">
          {/* physical buttons */}
          <div className="absolute -right-[3px] top-20 hidden h-20 w-[5px] rounded-r-md bg-zinc-700 md:block" />
          <div className="absolute -right-[3px] top-44 hidden h-12 w-[5px] rounded-r-md bg-zinc-700 md:block" />
          <div className="absolute -left-[3px] top-28 hidden h-14 w-[5px] rounded-l-md bg-zinc-700 md:block" />

          {/* bezel */}
          <div className="relative h-full w-full bg-black shadow-[0_50px_120px_-30px_rgba(0,0,0,0.9),0_0_80px_-20px_rgba(255,210,61,0.15)] md:rounded-[2.6rem] md:border md:border-zinc-800 md:p-3.5">
            {/* camera */}
            <div className="absolute left-1/2 top-[7px] z-20 hidden -translate-x-1/2 items-center gap-2 md:flex">
              <span className="size-2 rounded-full bg-zinc-800 ring-1 ring-zinc-700" />
              <span className="size-1.5 anim-blink rounded-full bg-honey/80" />
            </div>
            {/* speaker */}
            <div className="absolute bottom-[8px] left-1/2 hidden h-1 w-24 -translate-x-1/2 rounded-full bg-zinc-800 md:block" />

            {/* screen */}
            <div className="relative h-full w-full overflow-hidden bg-ink md:rounded-[1.9rem] md:border md:border-line/70">
              <AppShell>{children}</AppShell>

              {/* boot overlay */}
              {!booted && (
                <button
                  onClick={skipBoot}
                  className="absolute inset-0 z-50 flex cursor-pointer flex-col items-center justify-center gap-6 bg-[#050506] text-left"
                >
                  <div className="honeycomb absolute inset-0 opacity-40" />
                  <div className="anim-pop relative flex flex-col items-center gap-4">
                    <div className="relative">
                      <Hexagon className="size-16 text-honey" strokeWidth={1.4} />
                      <Hexagon className="anim-blink absolute inset-0 m-auto size-7 fill-honey/20 text-honey" />
                    </div>
                    <div className="text-center">
                      <p className="font-display text-lg font-bold tracking-[0.3em] text-zinc-100">
                        TABLET <span className="text-honey">OS</span>
                      </p>
                      <p className="mt-1 text-[11px] uppercase tracking-[0.25em] text-zinc-500">
                        Server Edition · LoloGrief
                      </p>
                    </div>
                  </div>
                  <div className="relative w-64 max-w-[70%]">
                    <div className="flex items-center justify-between text-[11px] text-zinc-500">
                      <span className="min-h-4">{bootLine}</span>
                      <span className="font-mono text-honey">{progress}%</span>
                    </div>
                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-zinc-800">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-honeydeep to-honey shadow-[0_0_16px_rgba(255,210,61,0.7)] transition-all duration-150"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                  <p className="relative font-mono text-[10px] tracking-wider text-zinc-600">
                    v2.6.1 · сборка 2026 · play.lologrief.fun
                  </p>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
