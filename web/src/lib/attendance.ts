import type { Attendance } from "../api/attendance.api";

/**
 * Days of the week that are not working days (0 = Sunday … 6 = Saturday).
 * A day in this list with no attendance record is shown as "Off" instead of "Absent".
 */
export const WEEKLY_OFF_DAYS: number[] = [0];

export type DayStatus =
  | "present" // checked in and out
  | "incomplete" // checked in, never checked out (past day)
  | "in-progress" // today, checked in, not yet out
  | "pending" // today, nothing yet
  | "absent" // past working day, no record
  | "off" // weekly off, no record
  | "future"
  | "before-join"; // before the account existed

export type CalendarDay = {
  date: string; // YYYY-MM-DD
  day: number;
  weekday: number;
  status: DayStatus;
  record?: Attendance;
};

/** Today's date in IST as YYYY-MM-DD (matches how the backend stores `date`). */
export function todayIST(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
}

export function monthKey(date: string): string {
  return date.slice(0, 7);
}

export function shiftMonth(month: string, delta: number): string {
  const [y, m] = month.split("-").map(Number);
  const d = new Date(Date.UTC(y, m - 1 + delta, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

export function monthLabel(month: string): string {
  const [y, m] = month.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, 1)).toLocaleDateString("en-GB", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

export function fmtTime(iso?: string | null): string | null {
  if (!iso) return null;
  return new Date(iso).toLocaleTimeString("en-IN", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: "Asia/Kolkata",
  });
}

export function fmtDateLong(date: string): string {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

export function fmtDateShort(date: string): { day: string; weekday: string; month: string } {
  const [y, m, d] = date.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return {
    day: String(d),
    weekday: dt.toLocaleDateString("en-GB", { weekday: "short", timeZone: "UTC" }),
    month: dt.toLocaleDateString("en-GB", { month: "short", timeZone: "UTC" }),
  };
}

/** Human duration between check-in and check-out, e.g. "8h 12m". */
export function duration(fromIso?: string | null, toIso?: string | null): string | null {
  if (!fromIso || !toIso) return null;
  const mins = Math.max(0, Math.round((new Date(toIso).getTime() - new Date(fromIso).getTime()) / 60000));
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h ? `${h}h ${m}m` : `${m}m`;
}

export function checkInOf(a: Attendance): string {
  return a.checkInAt || a.markedAt;
}

/** Build every day of `month` with its attendance status. */
export function buildMonth(
  month: string,
  records: Attendance[],
  today: string,
  joinedOn?: string | null
): CalendarDay[] {
  const byDate = new Map<string, Attendance>();
  for (const r of records) if (r.date && monthKey(r.date) === month) byDate.set(r.date, r);

  const [y, m] = month.split("-").map(Number);
  const daysInMonth = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const days: CalendarDay[] = [];

  for (let d = 1; d <= daysInMonth; d++) {
    const date = `${month}-${String(d).padStart(2, "0")}`;
    const weekday = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
    const record = byDate.get(date);
    let status: DayStatus;

    if (record) {
      if (record.checkOutAt) status = "present";
      else status = date === today ? "in-progress" : "incomplete";
    } else if (date > today) status = "future";
    else if (joinedOn && date < joinedOn) status = "before-join";
    else if (date === today) status = "pending";
    else if (WEEKLY_OFF_DAYS.includes(weekday)) status = "off";
    else status = "absent";

    days.push({ date, day: d, weekday, status, record });
  }
  return days;
}

export type MonthSummary = {
  present: number; // days with a check-in (complete or not)
  absent: number;
  incomplete: number;
  workingDays: number; // days that count towards the percentage
  percent: number;
};

export function summarize(days: CalendarDay[]): MonthSummary {
  let present = 0;
  let absent = 0;
  let incomplete = 0;
  for (const d of days) {
    if (d.status === "present" || d.status === "in-progress") present++;
    else if (d.status === "incomplete") {
      present++;
      incomplete++;
    } else if (d.status === "absent") absent++;
  }
  const workingDays = present + absent;
  return {
    present,
    absent,
    incomplete,
    workingDays,
    percent: workingDays ? Math.round((present / workingDays) * 100) : 0,
  };
}

export const STATUS_META: Record<
  DayStatus,
  { label: string; cell: string; dot: string; tone: "green" | "red" | "amber" | "slate" | "indigo" }
> = {
  present: {
    label: "Present",
    cell: "bg-emerald-500 text-white shadow-sm shadow-emerald-500/30",
    dot: "bg-emerald-500",
    tone: "green",
  },
  "in-progress": {
    label: "Checked in",
    cell: "bg-primary text-white ring-4 ring-primary/20",
    dot: "bg-primary",
    tone: "indigo",
  },
  incomplete: {
    label: "No check-out",
    cell: "bg-amber-400 text-white shadow-sm shadow-amber-400/30",
    dot: "bg-amber-400",
    tone: "amber",
  },
  absent: {
    label: "Absent",
    cell: "bg-rose-100 text-rose-700 ring-1 ring-inset ring-rose-200",
    dot: "bg-rose-400",
    tone: "red",
  },
  pending: {
    label: "Today",
    cell: "bg-white text-primary-700 ring-2 ring-inset ring-primary",
    dot: "bg-primary-300",
    tone: "indigo",
  },
  off: { label: "Weekly off", cell: "bg-slate-100 text-slate-400", dot: "bg-slate-300", tone: "slate" },
  future: { label: "Upcoming", cell: "text-slate-300", dot: "bg-slate-200", tone: "slate" },
  "before-join": { label: "Before joining", cell: "text-slate-300", dot: "bg-slate-200", tone: "slate" },
};
