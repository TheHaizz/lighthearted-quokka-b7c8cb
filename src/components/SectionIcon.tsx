"use client";

import {
  CircleHelp,
  Gamepad2,
  Gift,
  Heart,
  Lightbulb,
  Megaphone,
  MessageSquare,
  MessagesSquare,
  Newspaper,
  Palette,
  ShieldCheck,
  Star,
  Store,
  Swords,
  Wrench,
  type LucideIcon,
} from "lucide-react";

export const ICONS: Record<string, LucideIcon> = {
  MessagesSquare,
  MessageSquare,
  CircleHelp,
  Lightbulb,
  Store,
  Palette,
  Megaphone,
  Gamepad2,
  Swords,
  Star,
  Heart,
  Wrench,
  Newspaper,
  Gift,
  ShieldCheck,
};

export const ICON_OPTIONS = Object.keys(ICONS);

export function SectionIcon({
  name,
  className,
}: {
  name: string;
  className?: string;
}) {
  const Icon = ICONS[name] ?? MessagesSquare;
  return <Icon className={className} />;
}
