import {
  boolean,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  nickname: varchar("nickname", { length: 24 }).notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: varchar("role", { length: 16 }).notNull().default("player"), // player | moderator | admin
  prefix: varchar("prefix", { length: 32 }),
  prefixColor: varchar("prefix_color", { length: 16 }).notNull().default("#ffd23d"),
  status: varchar("status", { length: 32 }),
  statusColor: varchar("status_color", { length: 16 }).notNull().default("#a1a1aa"),
  banned: boolean("banned").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const sessions = pgTable("sessions", {
  id: serial("id").primaryKey(),
  token: varchar("token", { length: 64 }).notNull().unique(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const sections = pgTable("sections", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 80 }).notNull(),
  description: text("description").notNull().default(""),
  icon: varchar("icon", { length: 40 }).notNull().default("MessagesSquare"),
  isClosed: boolean("is_closed").notNull().default(false),
  sort: integer("sort").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const topics = pgTable("topics", {
  id: serial("id").primaryKey(),
  sectionId: integer("section_id")
    .notNull()
    .references(() => sections.id, { onDelete: "cascade" }),
  authorId: integer("author_id")
    .notNull()
    .references(() => users.id),
  title: varchar("title", { length: 140 }).notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const posts = pgTable("posts", {
  id: serial("id").primaryKey(),
  topicId: integer("topic_id")
    .notNull()
    .references(() => topics.id, { onDelete: "cascade" }),
  authorId: integer("author_id")
    .notNull()
    .references(() => users.id),
  content: text("content").notNull(),
  imageUrl: text("image_url"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const tickets = pgTable("tickets", {
  id: serial("id").primaryKey(),
  type: varchar("type", { length: 20 }).notNull(), // report | appeal | app_moderator | app_admin
  authorId: integer("author_id")
    .notNull()
    .references(() => users.id),
  title: varchar("title", { length: 140 }).notNull(),
  content: text("content").notNull(),
  targetName: varchar("target_name", { length: 40 }),
  imageUrl: text("image_url"),
  status: varchar("status", { length: 16 }).notNull().default("open"), // open | progress | accepted | rejected
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const ticketReplies = pgTable("ticket_replies", {
  id: serial("id").primaryKey(),
  ticketId: integer("ticket_id")
    .notNull()
    .references(() => tickets.id, { onDelete: "cascade" }),
  authorId: integer("author_id")
    .notNull()
    .references(() => users.id),
  content: text("content").notNull(),
  imageUrl: text("image_url"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const chatMessages = pgTable("chat_messages", {
  id: serial("id").primaryKey(),
  authorId: integer("author_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  imageUrl: text("image_url"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const news = pgTable("news", {
  id: serial("id").primaryKey(),
  authorId: integer("author_id")
    .notNull()
    .references(() => users.id),
  title: varchar("title", { length: 140 }).notNull(),
  content: text("content").notNull(),
  kind: varchar("kind", { length: 16 }).notNull().default("update"), // update | giveaway | announcement
  imageUrl: text("image_url"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const giveawayEntries = pgTable("giveaway_entries", {
  id: serial("id").primaryKey(),
  newsId: integer("news_id")
    .notNull()
    .references(() => news.id, { onDelete: "cascade" }),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const customTags = pgTable("custom_tags", {
  id: serial("id").primaryKey(),
  kind: varchar("kind", { length: 8 }).notNull(), // prefix | status
  label: varchar("label", { length: 32 }).notNull(),
  color: varchar("color", { length: 16 }).notNull().default("#ffd23d"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
