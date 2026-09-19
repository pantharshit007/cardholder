CREATE TABLE "card_image_uploads" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"image_url" text NOT NULL,
	"image_public_id" text NOT NULL,
	"claimed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "card_image_uploads_image_public_id_unique" UNIQUE("image_public_id")
);
--> statement-breakpoint
CREATE TABLE "cloudinary_cleanup_jobs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"image_public_id" text NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"last_attempt_at" timestamp with time zone,
	"last_error" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "cloudinary_cleanup_jobs_image_public_id_unique" UNIQUE("image_public_id")
);
--> statement-breakpoint
ALTER TABLE "card_image_uploads" ADD CONSTRAINT "card_image_uploads_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "card_image_uploads_user_id_idx" ON "card_image_uploads" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "card_image_uploads_user_id_claimed_at_idx" ON "card_image_uploads" USING btree ("user_id","claimed_at");