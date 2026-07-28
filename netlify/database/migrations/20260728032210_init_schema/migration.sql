CREATE TABLE "chat_messages" (
	"id" serial PRIMARY KEY,
	"author_id" integer NOT NULL,
	"content" text NOT NULL,
	"image_url" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "custom_tags" (
	"id" serial PRIMARY KEY,
	"kind" varchar(8) NOT NULL,
	"label" varchar(32) NOT NULL,
	"color" varchar(16) DEFAULT '#ffd23d' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "giveaway_entries" (
	"id" serial PRIMARY KEY,
	"news_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "news" (
	"id" serial PRIMARY KEY,
	"author_id" integer NOT NULL,
	"title" varchar(140) NOT NULL,
	"content" text NOT NULL,
	"kind" varchar(16) DEFAULT 'update' NOT NULL,
	"image_url" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "posts" (
	"id" serial PRIMARY KEY,
	"topic_id" integer NOT NULL,
	"author_id" integer NOT NULL,
	"content" text NOT NULL,
	"image_url" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sections" (
	"id" serial PRIMARY KEY,
	"title" varchar(80) NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"icon" varchar(40) DEFAULT 'MessagesSquare' NOT NULL,
	"is_closed" boolean DEFAULT false NOT NULL,
	"sort" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" serial PRIMARY KEY,
	"token" varchar(64) NOT NULL UNIQUE,
	"user_id" integer NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ticket_replies" (
	"id" serial PRIMARY KEY,
	"ticket_id" integer NOT NULL,
	"author_id" integer NOT NULL,
	"content" text NOT NULL,
	"image_url" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tickets" (
	"id" serial PRIMARY KEY,
	"type" varchar(20) NOT NULL,
	"author_id" integer NOT NULL,
	"title" varchar(140) NOT NULL,
	"content" text NOT NULL,
	"target_name" varchar(40),
	"image_url" text,
	"status" varchar(16) DEFAULT 'open' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "topics" (
	"id" serial PRIMARY KEY,
	"section_id" integer NOT NULL,
	"author_id" integer NOT NULL,
	"title" varchar(140) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY,
	"nickname" varchar(24) NOT NULL UNIQUE,
	"password_hash" text NOT NULL,
	"role" varchar(16) DEFAULT 'player' NOT NULL,
	"prefix" varchar(32),
	"prefix_color" varchar(16) DEFAULT '#ffd23d' NOT NULL,
	"status" varchar(32),
	"status_color" varchar(16) DEFAULT '#a1a1aa' NOT NULL,
	"banned" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_author_id_users_id_fkey" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "giveaway_entries" ADD CONSTRAINT "giveaway_entries_news_id_news_id_fkey" FOREIGN KEY ("news_id") REFERENCES "news"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "giveaway_entries" ADD CONSTRAINT "giveaway_entries_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "news" ADD CONSTRAINT "news_author_id_users_id_fkey" FOREIGN KEY ("author_id") REFERENCES "users"("id");--> statement-breakpoint
ALTER TABLE "posts" ADD CONSTRAINT "posts_topic_id_topics_id_fkey" FOREIGN KEY ("topic_id") REFERENCES "topics"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "posts" ADD CONSTRAINT "posts_author_id_users_id_fkey" FOREIGN KEY ("author_id") REFERENCES "users"("id");--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "ticket_replies" ADD CONSTRAINT "ticket_replies_ticket_id_tickets_id_fkey" FOREIGN KEY ("ticket_id") REFERENCES "tickets"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "ticket_replies" ADD CONSTRAINT "ticket_replies_author_id_users_id_fkey" FOREIGN KEY ("author_id") REFERENCES "users"("id");--> statement-breakpoint
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_author_id_users_id_fkey" FOREIGN KEY ("author_id") REFERENCES "users"("id");--> statement-breakpoint
ALTER TABLE "topics" ADD CONSTRAINT "topics_section_id_sections_id_fkey" FOREIGN KEY ("section_id") REFERENCES "sections"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "topics" ADD CONSTRAINT "topics_author_id_users_id_fkey" FOREIGN KEY ("author_id") REFERENCES "users"("id");