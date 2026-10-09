ALTER TYPE "ApplicationSupportType" ADD VALUE IF NOT EXISTS 'PROMO';

CREATE TABLE "onboarding_field_settings" (
    "field_key" TEXT NOT NULL,
    "audiences" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "onboarding_field_settings_pkey" PRIMARY KEY ("field_key"),
    CONSTRAINT "onboarding_field_settings_audiences_check"
        CHECK ("audiences" <@ ARRAY['REGULAR', 'SCHOLARSHIP', 'PROMO']::TEXT[])
);

INSERT INTO "onboarding_field_settings" ("field_key", "audiences") VALUES
    ('gender', ARRAY['REGULAR', 'SCHOLARSHIP', 'PROMO']::TEXT[]),
    ('country', ARRAY['REGULAR', 'SCHOLARSHIP', 'PROMO']::TEXT[]),
    ('otherCountry', ARRAY['REGULAR', 'SCHOLARSHIP', 'PROMO']::TEXT[]),
    ('location', ARRAY['REGULAR', 'SCHOLARSHIP', 'PROMO']::TEXT[]),
    ('status', ARRAY['REGULAR', 'SCHOLARSHIP', 'PROMO']::TEXT[]),
    ('education', ARRAY[]::TEXT[]),
    ('learningMode', ARRAY['REGULAR', 'SCHOLARSHIP', 'PROMO']::TEXT[]),
    ('startDate', ARRAY['REGULAR', 'SCHOLARSHIP', 'PROMO']::TEXT[]),
    ('experience', ARRAY['REGULAR', 'SCHOLARSHIP', 'PROMO']::TEXT[]),
    ('jobSupport', ARRAY['REGULAR', 'SCHOLARSHIP', 'PROMO']::TEXT[]),
    ('specializedFocus', ARRAY[]::TEXT[]),
    ('specializedGoal', ARRAY[]::TEXT[]),
    ('mentorSupport', ARRAY[]::TEXT[]);

ALTER TABLE "scholarship_applications"
    ADD COLUMN "promo_code" TEXT,
    ADD COLUMN "promo_campaign_id" UUID,
    ADD COLUMN "completion_required_fields" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

ALTER TABLE "scholarship_applications"
    ADD CONSTRAINT "scholarship_applications_promo_campaign_id_fkey"
    FOREIGN KEY ("promo_campaign_id") REFERENCES "promo_campaigns"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
