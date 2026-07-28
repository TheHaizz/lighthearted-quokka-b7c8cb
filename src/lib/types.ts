export type Role = "player" | "moderator" | "admin";

export interface AuthorInfo {
  id: number;
  nickname: string;
  role: Role;
  prefix: string | null;
  prefixColor: string;
  status: string | null;
  statusColor: string;
}

export interface Me extends AuthorInfo {
  banned: boolean;
  isStaff: boolean;
}

export interface Section {
  id: number;
  title: string;
  description: string;
  icon: string;
  isClosed: boolean;
  sort: number;
  topicCount: number;
}

export interface TopicRow {
  id: number;
  sectionId: number;
  title: string;
  createdAt: string;
  postCount: number;
  lastAt: string | null;
  author: AuthorInfo;
}

export interface PostRow {
  id: number;
  topicId: number;
  content: string;
  imageUrl: string | null;
  createdAt: string;
  author: AuthorInfo;
}

export interface ChatMsg {
  id: number;
  content: string;
  imageUrl: string | null;
  createdAt: string;
  author: AuthorInfo;
}

export type TicketType = "report" | "appeal" | "app_moderator" | "app_admin";
export type TicketStatus = "open" | "progress" | "accepted" | "rejected";

export interface TicketRow {
  id: number;
  type: TicketType;
  title: string;
  content: string;
  targetName: string | null;
  imageUrl: string | null;
  status: TicketStatus;
  createdAt: string;
  author: AuthorInfo;
  replyCount: number;
}

export interface TicketReply {
  id: number;
  ticketId: number;
  content: string;
  imageUrl: string | null;
  createdAt: string;
  author: AuthorInfo;
}

export type NewsKind = "update" | "giveaway" | "announcement";

export interface NewsRow {
  id: number;
  kind: NewsKind;
  title: string;
  content: string;
  imageUrl: string | null;
  createdAt: string;
  authorName: string;
  entries: number;
  entered: boolean;
}

export interface Tag {
  id: number;
  kind: "prefix" | "status";
  label: string;
  color: string;
}

export interface AdminUserRow extends AuthorInfo {
  banned: boolean;
  createdAt: string;
}

export const TICKET_TYPE_META: Record<
  TicketType,
  { label: string; short: string; hint: string }
> = {
  report: {
    label: "Репорт",
    short: "Репорты",
    hint: "Жалоба на игрока-нарушителя — видят только модераторы и администраторы",
  },
  appeal: {
    label: "Обжалование бана",
    short: "Обжалования",
    hint: "Запрос на снятие неправомерного бана",
  },
  app_moderator: {
    label: "Заявка на модератора",
    short: "Заявки · Модерация",
    hint: "Вступление в команду сервера — белая корона",
  },
  app_admin: {
    label: "Заявка на администратора",
    short: "Заявки · Админ",
    hint: "Вступление в команду сервера — жёлтая корона",
  },
};

export const TICKET_STATUS_META: Record<
  TicketStatus,
  { label: string; color: string }
> = {
  open: { label: "Открыт", color: "#ffd23d" },
  progress: { label: "На рассмотрении", color: "#38bdf8" },
  accepted: { label: "Принят", color: "#4ade80" },
  rejected: { label: "Отклонён", color: "#f87171" },
};

export const TICKET_TEMPLATES: Record<TicketType, string> = {
  report:
    "Ник нарушителя: \nНарушенное правило (номер/название): \nДата и время нарушения: \nОписание ситуации: \n\nПрикрепите доказательства (скриншот) кнопкой ниже.",
  appeal:
    "Ваш ник в игре: \nПричина бана (из сообщения о бане): \nДата бана: \nКто выдал бан (если известно): \nПочему бан считаете неправомерным: \n\nПрикрепите доказательства (скриншот) кнопкой ниже.",
  app_moderator:
    "Ваш ник: \nВозраст: \nСколько играете на LoloGrief: \nОнлайн в день (часов): \nОпыт модерации (где, как долго): \nПочему именно вы: \nСвязь с вами (Telegram/Discord): ",
  app_admin:
    "Ваш ник: \nВозраст: \nСколько играете на LoloGrief: \nОнлайн в день (часов): \nОпыт администрирования: \nЗнание команд и плагинов: \nПочему именно вы: \nСвязь с вами (Telegram/Discord): ",
};

export const NEWS_KIND_META: Record<NewsKind, { label: string; color: string }> =
  {
    update: { label: "Обновление", color: "#38bdf8" },
    giveaway: { label: "Раздача", color: "#4ade80" },
    announcement: { label: "Анонс", color: "#ffd23d" },
  };
