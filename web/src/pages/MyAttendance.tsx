import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, LogIn, LogOut, Clock, MessageSquareText, CalendarX2 } from "lucide-react";
import AppShell from "../components/AppShell";
import AttendanceCalendar, { Legend } from "../components/AttendanceCalendar";
import ProgressRing from "../components/ProgressRing";
import { Badge, Spinner, cx } from "../components/ui";
import useMonthAttendance from "../hooks/useMonthAttendance";
import {
  CalendarDay,
  STATUS_META,
  checkInOf,
  duration,
  fmtDateLong,
  fmtDateShort,
  fmtTime,
  monthKey,
  monthLabel,
  shiftMonth,
  todayIST,
} from "../lib/attendance";

type Filter = "all" | "present" | "absent";

export default function MyAttendance() {
  const [month, setMonth] = useState(() => monthKey(todayIST()));
  const [selected, setSelected] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>("all");
  const { days, summary, today, joinedOn, isLoading, error, reload } = useMonthAttendance(month);

  const currentMonth = monthKey(today);
  const canGoNext = month < currentMonth;
  const canGoPrev = !joinedOn || month > monthKey(joinedOn);

  const changeMonth = (delta: number) => {
    setMonth((m) => shiftMonth(m, delta));
    setSelected(null);
  };

  const selectedDay = days.find((d) => d.date === selected) ?? null;

  const listDays = useMemo(() => {
    const relevant = days.filter((d) =>
      ["present", "incomplete", "in-progress", "absent"].includes(d.status)
    );
    const filtered = relevant.filter((d) =>
      filter === "all" ? true : filter === "absent" ? d.status === "absent" : d.status !== "absent"
    );
    return filtered.reverse();
  }, [days, filter]);

  const monthNav = (
    <div className="flex items-center gap-1 rounded-2xl border border-slate-200 bg-white p-1 shadow-sm">
      <button
        onClick={() => changeMonth(-1)}
        disabled={!canGoPrev}
        className="rounded-xl p-2 text-slate-500 transition hover:bg-slate-100 disabled:opacity-30"
        aria-label="Previous month"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>
      <p className="min-w-[9.5rem] text-center text-sm font-bold text-on-surface">{monthLabel(month)}</p>
      <button
        onClick={() => changeMonth(1)}
        disabled={!canGoNext}
        className="rounded-xl p-2 text-slate-500 transition hover:bg-slate-100 disabled:opacity-30"
        aria-label="Next month"
      >
        <ChevronRight className="h-5 w-5" />
      </button>
    </div>
  );

  return (
    <AppShell title="My Attendance" subtitle="See which days you were present or absent." actions={monthNav}>
      <div className="mb-4 flex justify-center lg:hidden">{monthNav}</div>

      {error ? (
        <div className="card p-8 text-center">
          <p className="font-semibold text-rose-600">{error}</p>
          <button onClick={reload} className="mt-3 text-sm font-bold text-primary">
            Try again
          </button>
        </div>
      ) : (
        <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
          {/* Calendar */}
          <section className="card p-4 sm:p-6 animate-fade-up">
            {isLoading ? (
              <div className="flex aspect-[7/6] items-center justify-center">
                <Spinner className="h-8 w-8" />
              </div>
            ) : (
              <AttendanceCalendar
                days={days}
                selected={selected}
                onSelect={(d) => setSelected((s) => (s === d.date ? null : d.date))}
              />
            )}
            <div className="mt-5 border-t border-slate-100 pt-4">
              <Legend />
            </div>
          </section>

          {/* Summary + selected day */}
          <div className="flex flex-col gap-5">
            <section className="card flex items-center gap-5 p-5 animate-fade-up">
              <ProgressRing value={summary.percent} size={92} />
              <div className="grid flex-1 grid-cols-2 gap-3">
                <MiniStat label="Present" value={summary.present} className="text-emerald-600" />
                <MiniStat label="Absent" value={summary.absent} className="text-rose-600" />
                <MiniStat label="No check-out" value={summary.incomplete} className="text-amber-600" />
                <MiniStat label="Working days" value={summary.workingDays} className="text-slate-700" />
              </div>
            </section>

            <section className="card p-5 animate-fade-up">
              {selectedDay ? (
                <DayDetail day={selectedDay} />
              ) : (
                <div className="py-4 text-center">
                  <p className="text-sm font-semibold text-slate-700">Tap a date</p>
                  <p className="mt-1 text-xs text-on-surface-variant">
                    to see check-in and check-out times for that day.
                  </p>
                </div>
              )}
            </section>
          </div>
        </div>
      )}

      {/* Day list */}
      {!error && (
        <section className="mt-6">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="text-lg font-extrabold text-on-surface">Day by day</h2>
            <div className="flex rounded-xl bg-slate-200/60 p-1">
              {(["all", "present", "absent"] as Filter[]).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={cx(
                    "rounded-lg px-3 py-1.5 text-xs font-bold capitalize transition",
                    filter === f ? "bg-white text-on-surface shadow-sm" : "text-slate-500"
                  )}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          {isLoading ? null : listDays.length === 0 ? (
            <div className="card flex flex-col items-center gap-2 p-10 text-center">
              <CalendarX2 className="h-8 w-8 text-slate-300" />
              <p className="text-sm text-on-surface-variant">Nothing to show for this month.</p>
            </div>
          ) : (
            <div className="card divide-y divide-slate-100 overflow-hidden">
              {listDays.map((d) => (
                <DayRow key={d.date} day={d} onClick={() => setSelected(d.date)} />
              ))}
            </div>
          )}
        </section>
      )}
    </AppShell>
  );
}

function MiniStat({ label, value, className }: { label: string; value: number; className?: string }) {
  return (
    <div>
      <p className={cx("text-2xl font-extrabold leading-none", className)}>{value}</p>
      <p className="mt-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400">{label}</p>
    </div>
  );
}

function DayRow({ day, onClick }: { day: CalendarDay; onClick: () => void }) {
  const meta = STATUS_META[day.status];
  const short = fmtDateShort(day.date);
  const r = day.record;
  return (
    <button onClick={onClick} className="flex w-full items-center gap-4 px-4 py-3.5 text-left transition hover:bg-slate-50 sm:px-5">
      <div
        className={cx(
          "flex h-12 w-12 flex-shrink-0 flex-col items-center justify-center rounded-2xl",
          day.status === "absent" ? "bg-rose-50 text-rose-600" : "bg-slate-50 text-slate-700"
        )}
      >
        <span className="text-base font-extrabold leading-none">{short.day}</span>
        <span className="mt-0.5 text-[10px] font-bold uppercase">{short.weekday}</span>
      </div>
      <div className="min-w-0 flex-1">
        {r ? (
          <p className="text-sm font-semibold text-on-surface">
            {fmtTime(checkInOf(r))} <span className="text-slate-300">→</span> {fmtTime(r.checkOutAt) ?? "—"}
          </p>
        ) : (
          <p className="text-sm font-semibold text-slate-500">No attendance recorded</p>
        )}
        <p className="truncate text-xs text-on-surface-variant">
          {r?.checkOutAt ? `Worked ${duration(checkInOf(r), r.checkOutAt)}` : r?.remarks || `${short.month} ${short.day}`}
        </p>
      </div>
      <Badge tone={meta.tone}>{meta.label}</Badge>
    </button>
  );
}

function DayDetail({ day }: { day: CalendarDay }) {
  const meta = STATUS_META[day.status];
  const r = day.record;
  return (
    <div className="animate-fade-up">
      <div className="mb-4 flex items-start justify-between gap-2">
        <p className="text-sm font-bold text-on-surface">{fmtDateLong(day.date)}</p>
        <Badge tone={meta.tone}>{meta.label}</Badge>
      </div>
      {r ? (
        <div className="space-y-3">
          <DetailLine icon={LogIn} label="Check-in" value={fmtTime(checkInOf(r))} tone="text-emerald-600 bg-emerald-50" />
          <DetailLine icon={LogOut} label="Check-out" value={fmtTime(r.checkOutAt) ?? "Not recorded"} tone="text-rose-600 bg-rose-50" />
          <DetailLine icon={Clock} label="Duration" value={duration(checkInOf(r), r.checkOutAt) ?? "—"} tone="text-primary bg-primary-50" />
          {r.remarks && (
            <DetailLine icon={MessageSquareText} label="Remark" value={r.remarks} tone="text-amber-600 bg-amber-50" />
          )}
        </div>
      ) : (
        <p className="text-sm text-on-surface-variant">
          {day.status === "absent"
            ? "You didn't check in on this day."
            : day.status === "off"
              ? "Weekly off — no attendance needed."
              : day.status === "pending"
                ? "You haven't checked in yet today."
                : "No record."}
        </p>
      )}
    </div>
  );
}

function DetailLine({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: typeof Clock;
  label: string;
  value: string | null;
  tone: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className={cx("flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl", tone)}>
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">{label}</p>
        <p className="break-words text-sm font-bold text-on-surface">{value}</p>
      </div>
    </div>
  );
}
