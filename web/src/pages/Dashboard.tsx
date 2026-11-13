import { useEffect, useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Capacitor } from "@capacitor/core";
import {
  ArrowRight,
  CalendarCheck2,
  CalendarX2,
  CheckCircle2,
  Clock3,
  LogIn,
  LogOut,
  QrCode,
  Smartphone,
  TriangleAlert,
  Users,
} from "lucide-react";
import useAuth from "../hooks/useAuth";
import useMonthAttendance from "../hooks/useMonthAttendance";
import { getTodayStatus, TodayStatus } from "../api/attendance.api";
import AppShell from "../components/AppShell";
import ProgressRing from "../components/ProgressRing";
import { Badge, Button, Spinner, cx } from "../components/ui";
import {
  STATUS_META,
  checkInOf,
  duration,
  fmtDateShort,
  fmtTime,
  monthKey,
  monthLabel,
  todayIST,
} from "../lib/attendance";

const isNative = Capacitor.isNativePlatform();

function greeting() {
  const h = Number(
    new Date().toLocaleString("en-GB", { hour: "numeric", hour12: false, timeZone: "Asia/Kolkata" })
  );
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [statusLoading, setStatusLoading] = useState(true);
  const [todayStatus, setTodayStatus] = useState<TodayStatus | null>(null);
  const month = monthKey(todayIST());
  const { days, summary, isLoading: monthLoading } = useMonthAttendance(month);

  const load = useCallback(async () => {
    setStatusLoading(true);
    setTodayStatus(await getTodayStatus());
    setStatusLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const checkedIn = todayStatus?.checkedIn ?? false;
  const checkedOut = todayStatus?.checkedOut ?? false;
  const checkInAt = todayStatus?.attendance?.checkInAt ?? todayStatus?.attendance?.markedAt ?? null;
  const checkOutAt = todayStatus?.attendance?.checkOutAt ?? null;

  const pastDays = days.filter((d) => d.status !== "future" && d.status !== "before-join");
  const lastWeek = pastDays.slice(-7);
  const recent = pastDays
    .filter((d) => d.record)
    .slice(-5)
    .reverse();

  const firstName = user?.fullName?.split(" ")[0] || "there";
  const dateLabel = new Date().toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "Asia/Kolkata",
  });

  return (
    <AppShell title={`${greeting()}, ${firstName}`} subtitle={dateLabel}>
      {/* Hero / today */}
      <section className="hero-gradient relative overflow-hidden rounded-4xl p-6 text-white shadow-lift sm:p-8 animate-fade-up">
        <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-white/10" />
        <div className="pointer-events-none absolute -bottom-24 right-24 h-48 w-48 rounded-full bg-white/5" />

        <div className="relative">
          <div className="lg:hidden">
            <p className="text-sm font-medium text-white/75">{greeting()},</p>
            <p className="text-2xl font-extrabold">{user?.fullName || "there"}</p>
            <p className="mt-1 text-xs font-medium text-white/70">{dateLabel}</p>
          </div>

          {statusLoading ? (
            <div className="flex justify-center py-10">
              <Spinner className="h-8 w-8" light />
            </div>
          ) : (
            <div className="mt-6 flex flex-col gap-6 lg:mt-0 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-bold backdrop-blur">
                  {checkedIn && checkedOut ? (
                    <>
                      <CheckCircle2 className="h-3.5 w-3.5" /> Day complete
                    </>
                  ) : checkedIn ? (
                    <>
                      <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-300" /> Checked in
                    </>
                  ) : (
                    <>
                      <Clock3 className="h-3.5 w-3.5" /> Not checked in yet
                    </>
                  )}
                </span>

                <div className="mt-4 flex items-stretch gap-4">
                  <TimeBlock label="Check-in" icon={LogIn} value={fmtTime(checkInAt)} />
                  <div className="w-px bg-white/20" />
                  <TimeBlock label="Check-out" icon={LogOut} value={fmtTime(checkOutAt)} />
                  {checkedIn && checkedOut && (
                    <>
                      <div className="w-px bg-white/20" />
                      <TimeBlock label="Worked" icon={Clock3} value={duration(checkInAt, checkOutAt)} />
                    </>
                  )}
                </div>
              </div>

              <div className="lg:w-64">
                {checkedIn && checkedOut ? (
                  <p className="text-sm text-white/80">Great work today! See you tomorrow. 👋</p>
                ) : isNative ? (
                  <Button
                    variant="white"
                    size="lg"
                    icon={QrCode}
                    className="w-full"
                    onClick={() => navigate(checkedIn ? "/scan_qr" : "/attendence/remarks")}
                  >
                    {checkedIn ? "Scan to Check Out" : "Scan to Check In"}
                  </Button>
                ) : (
                  <div className="flex items-start gap-3 rounded-2xl bg-white/10 p-4 text-sm text-white/85 backdrop-blur">
                    <Smartphone className="mt-0.5 h-5 w-5 flex-shrink-0" />
                    Open the mobile app and scan the office QR code to {checkedIn ? "check out" : "check in"}.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Monthly stats */}
      <div className="mt-8 mb-3 flex items-end justify-between">
        <div>
          <h2 className="text-lg font-extrabold text-on-surface">This month</h2>
          <p className="text-xs text-on-surface-variant">{monthLabel(month)}</p>
        </div>
        <Link to="/attendence/history" className="flex items-center gap-1 text-sm font-bold text-primary hover:underline">
          Full calendar <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          <StatTile icon={CalendarCheck2} label="Present" value={summary.present} tone="emerald" loading={monthLoading} />
          <StatTile icon={CalendarX2} label="Absent" value={summary.absent} tone="rose" loading={monthLoading} />
          <StatTile icon={TriangleAlert} label="No check-out" value={summary.incomplete} tone="amber" loading={monthLoading} />
          <div className="card flex items-center justify-center p-3">
            <ProgressRing value={summary.percent} size={84} stroke={9} />
          </div>
        </div>

        {/* Last 7 days strip */}
        <div className="card p-5">
          <p className="mb-4 text-sm font-bold text-on-surface">Last few days</p>
          {monthLoading ? (
            <div className="flex justify-center py-6">
              <Spinner />
            </div>
          ) : (
            <div className="flex justify-between gap-1.5">
              {lastWeek.map((d) => {
                const s = fmtDateShort(d.date);
                return (
                  <Link
                    to="/attendence/history"
                    key={d.date}
                    className="flex flex-1 flex-col items-center gap-2"
                    title={STATUS_META[d.status].label}
                  >
                    <span className="text-[11px] font-bold uppercase text-slate-400">{s.weekday.slice(0, 2)}</span>
                    <span
                      className={cx(
                        "flex aspect-square w-full max-w-[2.75rem] items-center justify-center rounded-xl text-sm font-bold",
                        STATUS_META[d.status].cell
                      )}
                    >
                      {s.day}
                    </span>
                  </Link>
                );
              })}
            </div>
          )}
          <div className="mt-4 flex flex-wrap gap-3 border-t border-slate-100 pt-3">
            {(["present", "absent", "incomplete", "off"] as const).map((s) => (
              <span key={s} className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500">
                <span className={cx("h-2 w-2 rounded-full", STATUS_META[s].dot)} />
                {STATUS_META[s].label}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Recent activity */}
      <h2 className="mt-8 mb-3 text-lg font-extrabold text-on-surface">Recent activity</h2>
      {monthLoading ? null : recent.length === 0 ? (
        <div className="card p-8 text-center text-sm text-on-surface-variant">No check-ins yet this month.</div>
      ) : (
        <div className="card divide-y divide-slate-100 overflow-hidden">
          {recent.map((d) => {
            const r = d.record!;
            const s = fmtDateShort(d.date);
            const meta = STATUS_META[d.status];
            return (
              <div key={d.date} className="flex items-center gap-4 px-4 py-3.5 sm:px-5">
                <div className="flex h-11 w-11 flex-shrink-0 flex-col items-center justify-center rounded-2xl bg-primary-50 text-primary-700">
                  <span className="text-sm font-extrabold leading-none">{s.day}</span>
                  <span className="text-[10px] font-bold uppercase">{s.month}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-on-surface">{s.weekday}</p>
                  <p className="text-xs text-on-surface-variant">
                    {fmtTime(checkInOf(r))} → {fmtTime(r.checkOutAt) ?? "—"}
                  </p>
                </div>
                <Badge tone={meta.tone}>{meta.label}</Badge>
              </div>
            );
          })}
        </div>
      )}

      {user?.role === "ADMIN" && (
        <Link
          to="/attendence/all"
          className="card mt-6 flex items-center gap-4 p-5 transition hover:border-primary-200 lg:hidden"
        >
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary-50 text-primary">
            <Users className="h-5 w-5" />
          </span>
          <div className="flex-1">
            <p className="text-sm font-bold text-on-surface">Team attendance</p>
            <p className="text-xs text-on-surface-variant">See who checked in today</p>
          </div>
          <ArrowRight className="h-5 w-5 text-slate-400" />
        </Link>
      )}
    </AppShell>
  );
}

function TimeBlock({ label, value, icon: Icon }: { label: string; value: string | null; icon: typeof LogIn }) {
  return (
    <div>
      <p className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-white/60">
        <Icon className="h-3.5 w-3.5" /> {label}
      </p>
      <p className="mt-1 text-2xl font-extrabold sm:text-3xl">{value ?? "--:--"}</p>
    </div>
  );
}

function StatTile({
  icon: Icon,
  label,
  value,
  tone,
  loading,
}: {
  icon: typeof LogIn;
  label: string;
  value: number;
  tone: "emerald" | "rose" | "amber";
  loading?: boolean;
}) {
  const t = {
    emerald: "bg-emerald-50 text-emerald-600",
    rose: "bg-rose-50 text-rose-600",
    amber: "bg-amber-50 text-amber-600",
  }[tone];
  return (
    <div className="card p-4">
      <span className={cx("flex h-9 w-9 items-center justify-center rounded-xl", t)}>
        <Icon className="h-[18px] w-[18px]" />
      </span>
      <p className="mt-3 text-3xl font-extrabold leading-none text-on-surface">
        {loading ? "–" : String(value).padStart(2, "0")}
      </p>
      <p className="mt-1 text-xs font-semibold text-on-surface-variant">{label}</p>
    </div>
  );
}
