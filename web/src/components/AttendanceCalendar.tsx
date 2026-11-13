import { CalendarDay, STATUS_META, DayStatus } from "../lib/attendance";
import { cx } from "./ui";

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export const LEGEND: DayStatus[] = ["present", "incomplete", "absent", "off"];

export default function AttendanceCalendar({
  days,
  selected,
  onSelect,
}: {
  days: CalendarDay[];
  selected?: string | null;
  onSelect?: (day: CalendarDay) => void;
}) {
  // Monday-first grid: leading blanks before the 1st.
  const lead = days.length ? (days[0].weekday + 6) % 7 : 0;

  return (
    <div>
      <div className="mb-2 grid grid-cols-7 gap-1.5 sm:gap-2">
        {WEEKDAYS.map((w) => (
          <div key={w} className="text-center text-[11px] font-bold uppercase tracking-wider text-slate-400">
            {w}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
        {Array.from({ length: lead }).map((_, i) => (
          <div key={`b${i}`} />
        ))}
        {days.map((d) => {
          const meta = STATUS_META[d.status];
          const clickable = d.status !== "future" && d.status !== "before-join";
          return (
            <button
              key={d.date}
              type="button"
              disabled={!clickable}
              onClick={() => onSelect?.(d)}
              title={`${d.date} · ${meta.label}`}
              className={cx(
                "relative flex aspect-square items-center justify-center rounded-xl text-sm font-bold transition sm:rounded-2xl sm:text-base",
                meta.cell,
                clickable && "hover:scale-105 active:scale-95",
                selected === d.date && "outline outline-2 outline-offset-2 outline-slate-800"
              )}
            >
              {d.day}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function Legend() {
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-2">
      {LEGEND.map((s) => (
        <span key={s} className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
          <span className={cx("h-2.5 w-2.5 rounded-full", STATUS_META[s].dot)} />
          {STATUS_META[s].label}
        </span>
      ))}
    </div>
  );
}
