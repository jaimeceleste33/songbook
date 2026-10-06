ALTER TABLE "songs" ADD COLUMN "tempo" integer;--> statement-breakpoint
ALTER TABLE "songs" ADD COLUMN "time_signature" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "show_chords" boolean DEFAULT false NOT NULL;