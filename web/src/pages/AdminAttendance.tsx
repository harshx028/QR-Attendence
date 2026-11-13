import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Clock,
  LogIn,
  LogOut,
  MessageSquareText,
  Search,
  Users,
} from "lucide-react";
import useAuth from "../hooks/useAuth";
import { getAllUsers, AppUser } from "../api/user.api";
import useUserMonthAttendance from "../hooks/useUserMonthAttendance";
import AppShell from "../components/AppShell";
import AttendanceCalendar, { Legend } from "../components/AttendanceCalendar";
import ProgressRing from "../components/ProgressRing";
import { Avatar, Badge, Spinner, cx } from "../components/ui";
import {
  CalendarDay,
  STATUS_META,
  checkInOf,
  duration,
  fmtDateLong,
  fmtTime,
  monthKey,
  monthLabel,
  shiftMonth,
  todayIST,
} from "../lib/attendance";

export default function AdminAttendance() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [selectedUser, setSelectedUser] = useState<AppUser | null>(null);

  useEffect(() => {
    if (user?.role !== "ADMIN") navigate("/", { replace: true });
  }, [user, navigate]);

  if (selectedUser) {
    return (
      <UserCalendar
        selectedUser={selectedUser}
        onBack={() => setSelectedUser(null)}
      />
    );
  }

  return <PeopleList onSelect={setSelectedUser} />;
}

// ─── People List ─────────────────────────────────────────────────────────────

function PeopleList({ onSelect }: { onSelect: (u: AppUser) => void }) {
  const [users, setUsers] = useState<AppUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");

  const load = useCallback(async () => {
    setIsLoading(true);
    setError("");
    const res = await getAllUsers();
    if (res?.success) setUsers(res.users || []);
    else setError("Failed to load team members.");
    setIsLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return users;
    return users.filter(
      (u) =>
        u.fullName.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q)
    );
  }, [users, query]);

  return (
    <AppShell
      title="Team"
      subtitle="Select a person to view their attendance calendar."
    >
      {/* Search */}
      <div className="relative mb-5">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
        <input
          className="input input-icon w-full"
          placeholder="Search by name or email"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Spinner className="h-8 w-8" />
        </div>
      ) : error ? (
        <div className="card p-8 text-center">
          <p className="text-sm font-semibold text-rose-600">{error}</p>
          <button onClick={load} className="mt-3 text-sm font-bold text-primary">
            Try again
          </button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="card flex flex-col items-center gap-2 p-12 text-center">
          <Users className="h-8 w-8 text-slate-300" />
          <p className="text-sm text-on-surface-variant">No team members found.</p>
        </div>
      ) : (
        <div className="card divide-y divide-slate-100 overflow-hidden">
          {filtered.map((u) => (
            <button
              key={u.id}
              onClick={() => onSelect(u)}
              className="flex w-full items-center gap-4 px-4 py-3.5 text-left transition hover:bg-slate-50 sm:px-5"
            >
              <Avatar name={u.fullName} className="h-11 w-11 text-sm" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-on-surface">{u.fullName}</p>
                <p className="truncate text-xs text-on-surface-variant">{u.email}</p>
              </div>
              <ChevronRight className="h-5 w-5 flex-shrink-0 text-slate-300" />
            </button>
          ))}
        </div>
      )}
    </AppShell>
  );
}

// ─── User Calendar ────────────────────────────────────────────────────────────

function UserCalendar({
  selectedUser,
  onBack,
}: {
  selectedUser: AppUser;
  onBack: () => void;
}) {
  const [month, setMonth] = useState(() => monthKey(todayIST()));
  const [selected, setSelected] = useState<string | null>(null);

  const { days, summary, today, joinedOn, isLoading, error, reload } =
    useUserMonthAttendance(selectedUser.id, month);

  const currentMonth = monthKey(today);
  const canGoNext = month < currentMonth;
  const canGoPrev = !joinedOn || month > monthKey(joinedOn);

  const changeMonth = (delta: number) => {
    setMonth((m) => shiftMonth(m, delta));
    setSelected(null);
  };

  const selectedDay = days.find((d) => d.date === selected) ?? null;

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
      <p className="min-w-[9.5rem] text-center text-sm font-bold text-on-surface">
        {monthLabel(month)}
      </p>
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

  const backBtn = (
    <button
      onClick={onBack}
      className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-600 shadow-sm transition hover:bg-slate-50"
    >
      <ArrowLeft className="h-4 w-4" /> All members
    </button>
  );

  return (
    <AppShell
      title={selectedUser.fullName}
      subtitle={selectedUser.email}
      actions={
        <div className="flex items-center gap-3">
          {backBtn}
          {monthNav}
        </div>
      }
    >
      {/* Mobile back + month nav */}
      <div className="mb-4 flex flex-col gap-3 lg:hidden">
        {backBtn}
        <div className="flex justify-center">{monthNav}</div>
      </div>

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
    </AppShell>
  );
}

// ─── Shared subcomponents ────────────────────────────────────────────────────

function MiniStat({ label, value, className }: { label: string; value: number; className?: string }) {
  return (
    <div>
      <p className={cx("text-2xl font-extrabold leading-none", className)}>{value}</p>
      <p className="mt-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400">{label}</p>
    </div>
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
          <DetailLine
            icon={LogIn}
            label="Check-in"
            value={fmtTime(checkInOf(r))}
            tone="text-emerald-600 bg-emerald-50"
          />
          <DetailLine
            icon={LogOut}
            label="Check-out"
            value={fmtTime(r.checkOutAt) ?? "Not recorded"}
            tone="text-rose-600 bg-rose-50"
          />
          <DetailLine
            icon={Clock}
            label="Duration"
            value={duration(checkInOf(r), r.checkOutAt) ?? "—"}
            tone="text-primary bg-primary-50"
          />
          {r.remarks && (
            <DetailLine
              icon={MessageSquareText}
              label="Remark"
              value={r.remarks}
              tone="text-amber-600 bg-amber-50"
            />
          )}
        </div>
      ) : (
        <p className="text-sm text-on-surface-variant">
          {day.status === "absent"
            ? "No attendance recorded for this day."
            : day.status === "off"
              ? "Weekly off — no attendance needed."
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
