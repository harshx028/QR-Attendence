-- AlterTable: add check-out, location, and date columns to Attendance
ALTER TABLE "Attendance" ADD COLUMN "date" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Attendance" ADD COLUMN "checkOutAt" DATETIME;
ALTER TABLE "Attendance" ADD COLUMN "checkInLat" REAL;
ALTER TABLE "Attendance" ADD COLUMN "checkInLng" REAL;
ALTER TABLE "Attendance" ADD COLUMN "checkOutLat" REAL;
ALTER TABLE "Attendance" ADD COLUMN "checkOutLng" REAL;

-- Backfill date from markedAt (shift to IST = UTC+5:30)
UPDATE "Attendance" SET "date" = strftime('%Y-%m-%d', datetime("markedAt", '+5 hours', '+30 minutes')) WHERE "date" = '';

-- CreateIndex
CREATE INDEX "Attendance_userId_date_idx" ON "Attendance"("userId", "date");
