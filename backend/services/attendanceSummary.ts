type UserRow = {
  id: string;
  fullName: string;
  email: string;
  role: string;
};

type AttendanceRow = {
  id: string;
  userId: string;
  markedAt: Date;
};

type UserSummary = {
  id: string;
  fullName: string;
  email: string;
  role: string;
  present: number;
  absent: number;
  elapsed: number;
  attendance: AttendanceRow[];
};

export type MonthlySummary = {
  month: number;
  year: number;
  daysInMonth: number;
  workingDaysElapsed: number;
  totalPresent: number;
  totalAbsent: number;
  totalMembers: number;
  summary: UserSummary[];
};

const toDateString = (date: Date): string => date.toDateString();

export const isWorkingDay = (date: Date): boolean => {
  const day = date.getDay();
  return day !== 0 && day !== 6;
};

export const countWorkingDays = (start: Date, end: Date): number => {
  let count = 0;
  const cursor = new Date(start);
  cursor.setHours(0, 0, 0, 0);
  const endDate = new Date(end);
  endDate.setHours(23, 59, 59, 999);

  while (cursor <= endDate) {
    if (isWorkingDay(cursor)) count += 1;
    cursor.setDate(cursor.getDate() + 1);
  }

  return count;
};

export const buildMonthlySummary = (
  users: UserRow[],
  records: AttendanceRow[],
  monthStart: Date,
  now: Date
): MonthlySummary => {
  const month = monthStart.getMonth() + 1;
  const year = monthStart.getFullYear();
  const daysInMonth = new Date(year, monthStart.getMonth() + 1, 0).getDate();
  const workingDaysElapsed = countWorkingDays(monthStart, now);

  const summary: UserSummary[] = users.map((user) => {
    const userRecords = records
      .filter((r) => r.userId === user.id)
      .sort((a, b) => a.markedAt.getTime() - b.markedAt.getTime());

    const presentDates = new Set(userRecords.map((r) => toDateString(r.markedAt)));
    const present = presentDates.size;
    const absent = Math.max(workingDaysElapsed - present, 0);

    return {
      ...user,
      present,
      absent,
      elapsed: workingDaysElapsed,
      attendance: userRecords,
    };
  });

  const totalPresent = summary.reduce((sum, u) => sum + u.present, 0);
  const totalAbsent = summary.reduce((sum, u) => sum + u.absent, 0);

  return {
    month,
    year,
    daysInMonth,
    workingDaysElapsed,
    totalPresent,
    totalAbsent,
    totalMembers: users.length,
    summary,
  };
};
