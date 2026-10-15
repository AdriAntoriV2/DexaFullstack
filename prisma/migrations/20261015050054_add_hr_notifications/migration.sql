-- CreateTable
CREATE TABLE "hr_notifications" (
    "id" UUID NOT NULL,
    "type" VARCHAR(100) NOT NULL,
    "employee_id" UUID NOT NULL,
    "changed_fields" TEXT[],
    "message" VARCHAR(500) NOT NULL,
    "occurred_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "read_at" TIMESTAMPTZ(3),

    CONSTRAINT "hr_notifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "hr_notifications_occurred_at_idx" ON "hr_notifications"("occurred_at");

-- CreateIndex
CREATE INDEX "hr_notifications_read_at_occurred_at_idx" ON "hr_notifications"("read_at", "occurred_at");
