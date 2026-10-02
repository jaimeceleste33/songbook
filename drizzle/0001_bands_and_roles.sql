CREATE TABLE "band_members" (
	"band_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"role" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "band_members_band_id_user_id_pk" PRIMARY KEY("band_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "bands" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "invitations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"band_id" uuid NOT NULL,
	"role" text NOT NULL,
	"token_hash" text NOT NULL,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"accepted_at" timestamp with time zone,
	"accepted_by" uuid,
	CONSTRAINT "invitations_token_hash_unique" UNIQUE("token_hash")
);
--> statement-breakpoint
CREATE TABLE "password_resets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"token_hash" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"used_at" timestamp with time zone,
	CONSTRAINT "password_resets_token_hash_unique" UNIQUE("token_hash")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"name" text NOT NULL,
	"password_hash" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
-- Hand-edited: the generated version added NOT NULL columns to tables that
-- already hold the first band's songs, which fails. Every existing row is
-- assigned to one band created here, then the constraints are applied.
-- Nothing is deleted or rewritten besides the new columns.
INSERT INTO "bands" ("name") VALUES ('Mi banda');--> statement-breakpoint
ALTER TABLE "songs" ADD COLUMN "band_id" uuid;--> statement-breakpoint
UPDATE "songs" SET "band_id" = (SELECT "id" FROM "bands" ORDER BY "created_at" LIMIT 1);--> statement-breakpoint
ALTER TABLE "songs" ALTER COLUMN "band_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "songs" ADD COLUMN "deleted_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "setlists" ADD COLUMN "band_id" uuid;--> statement-breakpoint
UPDATE "setlists" SET "band_id" = (SELECT "id" FROM "bands" ORDER BY "created_at" LIMIT 1);--> statement-breakpoint
ALTER TABLE "setlists" ALTER COLUMN "band_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "setlists" ADD COLUMN "deleted_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "app_settings" ADD COLUMN "band_id" uuid;--> statement-breakpoint
UPDATE "app_settings" SET "band_id" = (SELECT "id" FROM "bands" ORDER BY "created_at" LIMIT 1);--> statement-breakpoint
ALTER TABLE "app_settings" ALTER COLUMN "band_id" SET NOT NULL;--> statement-breakpoint
DROP INDEX "app_settings_key_idx";--> statement-breakpoint
-- The old primary key on "key" alone was named by Postgres, not by us; look it
-- up instead of assuming "app_settings_pkey".
DO $$
DECLARE pk text;
BEGIN
  SELECT conname INTO pk FROM pg_constraint
  WHERE conrelid = 'public.app_settings'::regclass AND contype = 'p';
  IF pk IS NOT NULL THEN
    EXECUTE format('ALTER TABLE "app_settings" DROP CONSTRAINT %I', pk);
  END IF;
END $$;--> statement-breakpoint
ALTER TABLE "app_settings" ADD CONSTRAINT "app_settings_band_id_key_pk" PRIMARY KEY("band_id","key");--> statement-breakpoint
ALTER TABLE "band_members" ADD CONSTRAINT "band_members_band_id_bands_id_fk" FOREIGN KEY ("band_id") REFERENCES "public"."bands"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "band_members" ADD CONSTRAINT "band_members_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_band_id_bands_id_fk" FOREIGN KEY ("band_id") REFERENCES "public"."bands"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_accepted_by_users_id_fk" FOREIGN KEY ("accepted_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "password_resets" ADD CONSTRAINT "password_resets_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app_settings" ADD CONSTRAINT "app_settings_band_id_bands_id_fk" FOREIGN KEY ("band_id") REFERENCES "public"."bands"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "setlists" ADD CONSTRAINT "setlists_band_id_bands_id_fk" FOREIGN KEY ("band_id") REFERENCES "public"."bands"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "songs" ADD CONSTRAINT "songs_band_id_bands_id_fk" FOREIGN KEY ("band_id") REFERENCES "public"."bands"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "setlists_band_idx" ON "setlists" USING btree ("band_id");--> statement-breakpoint
CREATE INDEX "songs_band_idx" ON "songs" USING btree ("band_id");