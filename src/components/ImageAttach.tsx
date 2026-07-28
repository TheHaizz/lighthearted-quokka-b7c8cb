"use client";

import { useRef, useState } from "react";
import { ImagePlus, X } from "lucide-react";

export function ImageAttach({
  value,
  onChange,
  label = "Прикрепить фото",
}: {
  value: string | null;
  onChange: (v: string | null) => void;
  label?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  async function handleFile(file: File) {
    if (file.size > 10 * 1024 * 1024) return;
    setBusy(true);
    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () => reject(new Error("read"));
        reader.readAsDataURL(file);
      });
      const img = await new Promise<HTMLImageElement>((resolve, reject) => {
        const el = new Image();
        el.onload = () => resolve(el);
        el.onerror = () => reject(new Error("img"));
        el.src = dataUrl;
      });
      const max = 960;
      const scale = Math.min(1, max / Math.max(img.width, img.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(img.width * scale));
      canvas.height = Math.max(1, Math.round(img.height * scale));
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("canvas");
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      onChange(canvas.toDataURL("image/jpeg", 0.72));
    } catch {
      onChange(null);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) void handleFile(f);
          e.target.value = "";
        }}
      />
      {value ? (
        <div className="relative">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={value}
            alt="Прикреплённое изображение"
            className="h-16 w-16 rounded-xl border border-line object-cover"
          />
          <button
            type="button"
            onClick={() => onChange(null)}
            className="absolute -right-1.5 -top-1.5 grid size-5 place-items-center rounded-full bg-red-500 text-black shadow-lg transition-transform hover:scale-110"
            aria-label="Убрать изображение"
          >
            <X className="size-3" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={busy}
          className="btn btn-ghost !px-3 !py-1.5 !text-xs"
        >
          <ImagePlus className="size-4" />
          {busy ? "Обработка…" : label}
        </button>
      )}
    </div>
  );
}
