CREATE TYPE "LessonContentKind" AS ENUM ('TEXT', 'VIDEO', 'ATTACHMENT');

CREATE TABLE "lesson_content_items" (
    "id" UUID NOT NULL,
    "lesson_id" UUID NOT NULL,
    "kind" "LessonContentKind" NOT NULL,
    "title" TEXT,
    "body" TEXT,
    "url" TEXT,
    "file_name" TEXT,
    "storage_path" TEXT,
    "sort_order" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lesson_content_items_pkey" PRIMARY KEY ("id")
);

INSERT INTO "lesson_content_items" (
    "id",
    "lesson_id",
    "kind",
    "title",
    "body",
    "sort_order"
)
SELECT
    gen_random_uuid(),
    "id",
    'TEXT',
    'Lesson text',
    "description",
    1
FROM "lessons"
WHERE "description" IS NOT NULL AND btrim("description") <> '';

INSERT INTO "lesson_content_items" (
    "id",
    "lesson_id",
    "kind",
    "title",
    "url",
    "sort_order"
)
SELECT
    gen_random_uuid(),
    "id",
    'VIDEO',
    'Video',
    "content_url",
    CASE
        WHEN "description" IS NOT NULL AND btrim("description") <> '' THEN 2
        ELSE 1
    END
FROM "lessons"
WHERE "kind" = 'VIDEO'
  AND "content_url" IS NOT NULL
  AND btrim("content_url") <> '';

CREATE UNIQUE INDEX "lesson_content_items_lesson_id_sort_order_key"
ON "lesson_content_items"("lesson_id", "sort_order");

ALTER TABLE "lesson_content_items"
ADD CONSTRAINT "lesson_content_items_lesson_id_fkey"
FOREIGN KEY ("lesson_id") REFERENCES "lessons"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
