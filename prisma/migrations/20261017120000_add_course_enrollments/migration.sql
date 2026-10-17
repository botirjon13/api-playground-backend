ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'MODERATOR';

CREATE TYPE "CourseStatus" AS ENUM (
    'DRAFT',
    'PENDING_REVIEW',
    'APPROVED',
    'PUBLISHED',
    'REJECTED'
);

CREATE TYPE "PracticalPlatformStatus" AS ENUM (
    'NOT_REQUESTED',
    'REQUESTED',
    'APPROVED',
    'REJECTED'
);

CREATE TYPE "EnrollmentStatus" AS ENUM ('ACTIVE', 'COMPLETED');

CREATE TABLE "courses" (
    "id" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "level" TEXT NOT NULL,
    "is_free" BOOLEAN NOT NULL DEFAULT true,
    "price_cents" INTEGER,
    "status" "CourseStatus" NOT NULL DEFAULT 'DRAFT',
    "practical_platform_status" "PracticalPlatformStatus" NOT NULL DEFAULT 'NOT_REQUESTED',
    "instructor_id" TEXT,
    "approved_by_id" TEXT,
    "published_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "courses_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "course_enrollments" (
    "user_id" TEXT NOT NULL,
    "course_id" UUID NOT NULL,
    "status" "EnrollmentStatus" NOT NULL DEFAULT 'ACTIVE',
    "enrolled_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "course_enrollments_pkey" PRIMARY KEY ("user_id", "course_id")
);

CREATE UNIQUE INDEX "courses_slug_key" ON "courses"("slug");
CREATE INDEX "courses_status_idx" ON "courses"("status");
CREATE INDEX "course_enrollments_course_id_idx" ON "course_enrollments"("course_id");

ALTER TABLE "courses"
    ADD CONSTRAINT "courses_instructor_id_fkey"
    FOREIGN KEY ("instructor_id") REFERENCES "users"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "courses"
    ADD CONSTRAINT "courses_approved_by_id_fkey"
    FOREIGN KEY ("approved_by_id") REFERENCES "users"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "course_enrollments"
    ADD CONSTRAINT "course_enrollments_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "course_enrollments"
    ADD CONSTRAINT "course_enrollments_course_id_fkey"
    FOREIGN KEY ("course_id") REFERENCES "courses"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

INSERT INTO "courses" (
    "id",
    "slug",
    "title",
    "description",
    "level",
    "is_free",
    "status",
    "published_at",
    "updated_at"
) VALUES (
    '00000000-0000-4000-8000-000000000001',
    'rest-api-basics',
    'REST API asoslari: birinchi amaliy so‘rov',
    'Swagger orqali GET /health endpointiga so‘rov yuborish, API javobini ko‘rish va birinchi amaliy missiyani bajarish.',
    'Boshlang‘ich',
    true,
    'PUBLISHED',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
);
