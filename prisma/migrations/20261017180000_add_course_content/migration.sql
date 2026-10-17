ALTER TABLE "courses"
    ADD COLUMN "published_by_id" TEXT;
ALTER TABLE "courses"
    ADD COLUMN "review_feedback" TEXT;

ALTER TABLE "courses"
    ADD CONSTRAINT "courses_published_by_id_fkey"
    FOREIGN KEY ("published_by_id") REFERENCES "users"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "course_lessons" (
    "id" UUID NOT NULL,
    "course_id" UUID NOT NULL,
    "title" VARCHAR(160) NOT NULL,
    "content" TEXT NOT NULL,
    "video_url" VARCHAR(2048),
    "position" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "course_lessons_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "course_resources" (
    "id" UUID NOT NULL,
    "lesson_id" UUID NOT NULL,
    "title" VARCHAR(160) NOT NULL,
    "url" VARCHAR(2048) NOT NULL,
    "position" INTEGER NOT NULL,

    CONSTRAINT "course_resources_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "course_lessons_course_id_position_key"
    ON "course_lessons"("course_id", "position");
CREATE INDEX "course_lessons_course_id_position_idx"
    ON "course_lessons"("course_id", "position");
CREATE INDEX "course_resources_lesson_id_position_idx"
    ON "course_resources"("lesson_id", "position");

ALTER TABLE "course_lessons"
    ADD CONSTRAINT "course_lessons_course_id_fkey"
    FOREIGN KEY ("course_id") REFERENCES "courses"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "course_resources"
    ADD CONSTRAINT "course_resources_lesson_id_fkey"
    FOREIGN KEY ("lesson_id") REFERENCES "course_lessons"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
