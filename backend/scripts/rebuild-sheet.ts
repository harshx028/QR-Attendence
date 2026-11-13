/**
 * Rebuild the Google Sheet tabs for a month from the database, using the
 * one-row-per-day layout (check-in + check-out + both locations in one row).
 *
 *   npm run rebuild-sheet            # current month
 *   npm run rebuild-sheet 2026-10    # a specific month
 *
 * An existing tab in the old one-row-per-event layout is renamed to
 * "<Month Year> (old format)" first, so nothing is deleted.
 */
import "dotenv/config";
import prisma from "../services/prismaClient.ts";
import {
  GUEST_HEADERS,
  HEADERS,
  getMonthTabName,
  guestRowFromDb,
  guestTabName,
  rewriteTab,
  staffRowFromDb,
} from "../services/google.ts";

const arg = process.argv[2];
const month = arg ?? new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" }).slice(0, 7);

if (!/^\d{4}-\d{2}$/.test(month)) {
  console.error(`Invalid month "${month}". Use YYYY-MM, e.g. 2026-11`);
  process.exit(1);
}

// Midday of the 1st, so the IST month name is unambiguous.
const [y, m] = month.split("-").map(Number);
const ref = new Date(Date.UTC(y, m - 1, 1, 12));

const main = async () => {
  const staff = await prisma.attendance.findMany({
    where: { date: { startsWith: `${month}-` } },
    orderBy: { markedAt: "asc" },
    include: { user: { select: { fullName: true, email: true } } },
  });
  const guests = await prisma.guestAttendance.findMany({
    where: { date: { startsWith: `${month}-` } },
    orderBy: { markedAt: "asc" },
  });

  const staffTab = getMonthTabName(ref);
  const guestTab = guestTabName(ref);

  await rewriteTab(staffTab, HEADERS, staff.map(staffRowFromDb));
  console.log(`✔ "${staffTab}": ${staff.length} rows`);

  await rewriteTab(guestTab, GUEST_HEADERS, guests.map(guestRowFromDb));
  console.log(`✔ "${guestTab}": ${guests.length} rows`);
};

main()
  .catch((e) => {
    console.error("Rebuild failed:", e.message);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
