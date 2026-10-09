CREATE TYPE "ModuleAccessType" AS ENUM (
    'FREE_BOOTCAMP',
    'PAID',
    'PROMO',
    'ALL_ENROLLED'
);

ALTER TABLE "courses"
ADD COLUMN "free_bootcamp_enabled" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "course_modules"
ADD COLUMN "access_types" "ModuleAccessType"[] NOT NULL DEFAULT ARRAY[]::"ModuleAccessType"[];
