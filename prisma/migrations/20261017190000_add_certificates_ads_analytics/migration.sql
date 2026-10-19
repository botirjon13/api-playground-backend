CREATE TYPE "AdStatus" AS ENUM (
    'ACTIVE',
    'PENDING_REVIEW',
    'REJECTED',
    'EXPIRED'
);

CREATE TYPE "CourseCompletionStatus" AS ENUM (
    'PENDING_REVIEW',
    'APPROVED',
    'REJECTED'
);

CREATE TYPE "FinalTestAttemptStatus" AS ENUM (
    'FAILED',
    'PASSED',
    'PENDING_REVIEW',
    'APPROVED',
    'REJECTED'
);

ALTER TABLE "courses"
    ADD COLUMN "passing_score" INTEGER NOT NULL DEFAULT 70;

CREATE TABLE "course_final_questions" (
    "id" UUID NOT NULL,
    "course_id" UUID NOT NULL,
    "prompt" TEXT NOT NULL,
    "option_a" VARCHAR(1000) NOT NULL,
    "option_b" VARCHAR(1000) NOT NULL,
    "option_c" VARCHAR(1000) NOT NULL,
    "option_d" VARCHAR(1000) NOT NULL,
    "correct_option" INTEGER NOT NULL,
    "position" INTEGER NOT NULL,
    CONSTRAINT "course_final_questions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "course_lesson_completions" (
    "user_id" TEXT NOT NULL,
    "lesson_id" UUID NOT NULL,
    "completed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "course_lesson_completions_pkey" PRIMARY KEY ("user_id", "lesson_id")
);

CREATE TABLE "course_certificates" (
    "id" UUID NOT NULL,
    "user_id" TEXT NOT NULL,
    "course_id" UUID NOT NULL,
    "recipient_name" VARCHAR(160) NOT NULL,
    "code" VARCHAR(32) NOT NULL,
    "issued_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "course_certificates_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "course_final_test_attempts" (
    "id" UUID NOT NULL,
    "user_id" TEXT NOT NULL,
    "course_id" UUID NOT NULL,
    "answers" JSONB NOT NULL,
    "score" INTEGER NOT NULL,
    "status" "FinalTestAttemptStatus" NOT NULL,
    "review_feedback" TEXT,
    "reviewed_by_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewed_at" TIMESTAMP(3),
    CONSTRAINT "course_final_test_attempts_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "course_completion_reviews" (
    "id" UUID NOT NULL,
    "user_id" TEXT NOT NULL,
    "course_id" UUID NOT NULL,
    "status" "CourseCompletionStatus" NOT NULL DEFAULT 'PENDING_REVIEW',
    "feedback" TEXT,
    "reviewed_by_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewed_at" TIMESTAMP(3),
    CONSTRAINT "course_completion_reviews_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ad_campaigns" (
    "id" UUID NOT NULL,
    "title" VARCHAR(160) NOT NULL,
    "image_url" VARCHAR(2048) NOT NULL,
    "target_url" VARCHAR(2048) NOT NULL,
    "status" "AdStatus" NOT NULL,
    "starts_at" TIMESTAMP(3) NOT NULL,
    "ends_at" TIMESTAMP(3) NOT NULL,
    "duration_days" INTEGER NOT NULL,
    "proposed_by_id" TEXT,
    "created_by_id" TEXT NOT NULL,
    "approved_by_id" TEXT,
    "review_feedback" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ad_campaigns_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ad_events" (
    "id" UUID NOT NULL,
    "ad_id" UUID NOT NULL,
    "user_id" TEXT,
    "type" VARCHAR(16) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ad_events_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "course_final_questions_course_id_position_key"
    ON "course_final_questions"("course_id", "position");
CREATE INDEX "course_final_questions_course_id_position_idx"
    ON "course_final_questions"("course_id", "position");
CREATE INDEX "course_lesson_completions_lesson_id_idx"
    ON "course_lesson_completions"("lesson_id");
CREATE UNIQUE INDEX "course_certificates_code_key"
    ON "course_certificates"("code");
CREATE UNIQUE INDEX "course_certificates_user_id_course_id_key"
    ON "course_certificates"("user_id", "course_id");
CREATE INDEX "course_certificates_user_id_issued_at_idx"
    ON "course_certificates"("user_id", "issued_at");
CREATE INDEX "course_final_test_attempts_course_id_status_created_at_idx"
    ON "course_final_test_attempts"("course_id", "status", "created_at");
CREATE INDEX "course_final_test_attempts_user_id_course_id_created_at_idx"
    ON "course_final_test_attempts"("user_id", "course_id", "created_at");
CREATE UNIQUE INDEX "course_completion_reviews_user_id_course_id_key"
    ON "course_completion_reviews"("user_id", "course_id");
CREATE INDEX "course_completion_reviews_course_id_status_created_at_idx"
    ON "course_completion_reviews"("course_id", "status", "created_at");
CREATE INDEX "ad_campaigns_status_starts_at_ends_at_idx"
    ON "ad_campaigns"("status", "starts_at", "ends_at");
CREATE INDEX "ad_campaigns_proposed_by_id_created_at_idx"
    ON "ad_campaigns"("proposed_by_id", "created_at");
CREATE INDEX "ad_events_ad_id_type_created_at_idx"
    ON "ad_events"("ad_id", "type", "created_at");

ALTER TABLE "course_final_questions"
    ADD CONSTRAINT "course_final_questions_course_id_fkey"
    FOREIGN KEY ("course_id") REFERENCES "courses"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

-- Preserve certificates for learners who completed the legacy mission before
-- certificate issuance existed. mission1 is the existing completion signal
-- for the legacy rest-api-basics free course.
INSERT INTO "course_enrollments" ("user_id", "course_id", "status", "enrolled_at")
SELECT "users"."id", "courses"."id", 'COMPLETED', "users"."created_at"
FROM "users"
CROSS JOIN "courses"
WHERE "users"."mission_1" = true
  AND "courses"."slug" = 'rest-api-basics'
  AND "courses"."is_free" = true
  AND "courses"."status" = 'PUBLISHED'
ON CONFLICT ("user_id", "course_id")
DO UPDATE SET "status" = 'COMPLETED';

INSERT INTO "course_certificates" ("id", "user_id", "course_id", "recipient_name", "code", "issued_at")
SELECT
    gen_random_uuid(),
    "course_enrollments"."user_id",
    "course_enrollments"."course_id",
    COALESCE(NULLIF(BTRIM("users"."full_name"), ''), 'OsonTrack tinglovchisi'),
    upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 16)),
    CURRENT_TIMESTAMP
FROM "course_enrollments"
JOIN "users" ON "users"."id" = "course_enrollments"."user_id"
JOIN "courses" ON "courses"."id" = "course_enrollments"."course_id"
WHERE "users"."mission_1" = true
  AND "courses"."slug" = 'rest-api-basics'
  AND "courses"."is_free" = true
  AND "courses"."status" = 'PUBLISHED'
ON CONFLICT ("user_id", "course_id") DO NOTHING;

ALTER TABLE "course_lesson_completions"
    ADD CONSTRAINT "course_lesson_completions_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "course_lesson_completions"
    ADD CONSTRAINT "course_lesson_completions_lesson_id_fkey"
    FOREIGN KEY ("lesson_id") REFERENCES "course_lessons"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "course_certificates"
    ADD CONSTRAINT "course_certificates_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "course_certificates"
    ADD CONSTRAINT "course_certificates_course_id_fkey"
    FOREIGN KEY ("course_id") REFERENCES "courses"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "course_final_test_attempts"
    ADD CONSTRAINT "course_final_test_attempts_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "course_final_test_attempts"
    ADD CONSTRAINT "course_final_test_attempts_course_id_fkey"
    FOREIGN KEY ("course_id") REFERENCES "courses"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "course_final_test_attempts"
    ADD CONSTRAINT "course_final_test_attempts_reviewed_by_id_fkey"
    FOREIGN KEY ("reviewed_by_id") REFERENCES "users"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "course_completion_reviews"
    ADD CONSTRAINT "course_completion_reviews_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "course_completion_reviews"
    ADD CONSTRAINT "course_completion_reviews_course_id_fkey"
    FOREIGN KEY ("course_id") REFERENCES "courses"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "course_completion_reviews"
    ADD CONSTRAINT "course_completion_reviews_reviewed_by_id_fkey"
    FOREIGN KEY ("reviewed_by_id") REFERENCES "users"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ad_campaigns"
    ADD CONSTRAINT "ad_campaigns_proposed_by_id_fkey"
    FOREIGN KEY ("proposed_by_id") REFERENCES "users"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ad_campaigns"
    ADD CONSTRAINT "ad_campaigns_created_by_id_fkey"
    FOREIGN KEY ("created_by_id") REFERENCES "users"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ad_campaigns"
    ADD CONSTRAINT "ad_campaigns_approved_by_id_fkey"
    FOREIGN KEY ("approved_by_id") REFERENCES "users"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ad_events"
    ADD CONSTRAINT "ad_events_ad_id_fkey"
    FOREIGN KEY ("ad_id") REFERENCES "ad_campaigns"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ad_events"
    ADD CONSTRAINT "ad_events_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
