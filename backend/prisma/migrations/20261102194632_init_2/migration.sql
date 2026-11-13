-- AlterTable
ALTER TABLE "Attendance" ADD COLUMN "remarks" TEXT;

-- CreateTable
CREATE TABLE "GuestAttendance" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "fullName" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "markedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "checkOutAt" DATETIME,
    "checkInLat" REAL,
    "checkInLng" REAL,
    "checkOutLat" REAL,
    "checkOutLng" REAL
);

-- CreateIndex
CREATE INDEX "GuestAttendance_phone_date_idx" ON "GuestAttendance"("phone", "date");
