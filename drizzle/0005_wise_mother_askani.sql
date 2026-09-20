ALTER TABLE "user" ADD COLUMN "is_admin" boolean DEFAULT false NOT NULL;--> statement-breakpoint
CREATE INDEX "user_email_verified_id_idx" ON "user" USING btree ("email_verified","id");