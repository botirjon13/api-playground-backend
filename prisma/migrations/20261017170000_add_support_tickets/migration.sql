CREATE TYPE "TicketCategory" AS ENUM (
    'INSTRUCTOR_APPLICATION',
    'TECHNICAL_ISSUE',
    'COURSE_QUESTION',
    'SUGGESTION',
    'FEEDBACK',
    'OTHER'
);

CREATE TYPE "TicketStatus" AS ENUM (
    'OPEN',
    'IN_REVIEW',
    'NEEDS_INFORMATION',
    'CLOSED',
    'APPROVED',
    'REJECTED'
);

CREATE TABLE "support_tickets" (
    "id" UUID NOT NULL,
    "user_id" TEXT NOT NULL,
    "category" "TicketCategory" NOT NULL,
    "status" "TicketStatus" NOT NULL DEFAULT 'OPEN',
    "subject" VARCHAR(120) NOT NULL,
    "instructor_specialty" VARCHAR(160),
    "instructor_experience" TEXT,
    "instructor_portfolio" VARCHAR(2048),
    "instructor_course_idea" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "support_tickets_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "support_ticket_messages" (
    "id" UUID NOT NULL,
    "ticket_id" UUID NOT NULL,
    "sender_id" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "support_ticket_messages_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "support_tickets_user_id_updated_at_idx"
    ON "support_tickets"("user_id", "updated_at");
CREATE INDEX "support_tickets_category_status_updated_at_idx"
    ON "support_tickets"("category", "status", "updated_at");
CREATE INDEX "support_ticket_messages_ticket_id_created_at_idx"
    ON "support_ticket_messages"("ticket_id", "created_at");

ALTER TABLE "support_tickets"
    ADD CONSTRAINT "support_tickets_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "support_ticket_messages"
    ADD CONSTRAINT "support_ticket_messages_ticket_id_fkey"
    FOREIGN KEY ("ticket_id") REFERENCES "support_tickets"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "support_ticket_messages"
    ADD CONSTRAINT "support_ticket_messages_sender_id_fkey"
    FOREIGN KEY ("sender_id") REFERENCES "users"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
