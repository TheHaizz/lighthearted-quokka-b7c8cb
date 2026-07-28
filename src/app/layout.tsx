import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { SessionProvider } from "@/components/SessionProvider";
import { TabletFrame } from "@/components/TabletFrame";

export const metadata: Metadata = {
  title: "LoloForum — форум сервера LoloGrief",
  description:
    "Официальный форум LoloGrief: обновления, раздачи, репорты, обжалования банов и заявки в команду сервера.",
};

export const viewport: Viewport = {
  themeColor: "#0a0a0c",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ru">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&family=Unbounded:wght@500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-ink font-body text-zinc-100 antialiased">
        <SessionProvider>
          <TabletFrame>{children}</TabletFrame>
        </SessionProvider>
      </body>
    </html>
  );
}
