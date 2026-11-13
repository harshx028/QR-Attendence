import { useEffect, useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { CalendarDays, LogIn, LogOut, RefreshCw, Search, Users, X } from "lucide-react";
import useAuth from "../hooks/useAuth";
import { getAllAttendance, Attendance } from "../api/attendance.api";
import AppShell from "../components/AppShell";
import { Avatar, Badge, Spinner, cx } from "../components/ui";
import { checkInOf, duration, fmtDateShort, fmtTime, todayIST } from "../lib/attendance";

export default function AdminAttendance() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [records, setRecords] = useState<Attendance[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [date, setDate] = useState(todayIST());
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setIsLoading(true);
    setError("");
    const res = await getAllAttendance(date || undefined);
    if (res?.success) setRecords(res.attendances || []);
    else setError("Failed to load attendance records.");
    setIsLoading(false);
  }, [date]);

  useEffect(() => {
    if (user?.role !== "ADMIN") {
      navigate("/", { replace: true });
      return;
    }
    load();
  }, [user, load, navigate]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return records;
    return records.filter(
      (r) => r.user?.fullName?.toLowerCase().includes(q) || r.user?.email?.toLowerCase().includes(q)
    );
  }, [records, query]);

  const checkedOut = records.filter((r) => r.checkOutAt).length;

  return (
    <AppShell
      title="Team Attendance"
      subtitle={date ? `Records for ${date}` : "Most recent records across all days"}
      actions={
        <button
          onClick={load}
          className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-600 shadow-sm transition hover:bg-slate-50"
        >
          <RefreshCw className={cx("h-4 w-4", isLoading && "animate-spin")} /> Refresh
        </button>
      }
    >
      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 sm:gap-4">
        <Stat icon={Users} label="Records" value={records.length} tone="bg-primary-50 text-primary" />
        <Stat icon={LogIn} label="Still in" value={records.length - checkedOut} tone="bg-amber-50 text-amber-600" />
        <Stat icon={LogOut} label="Checked out" value={checkedOut} tone="bg-emerald-50 text-emerald-600" />
      </div>

      {/* Filters */}
      <div className="mt-5 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
          <input
            className="input input-icon"
            placeholder="Search by name or email"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <div className="relative flex-1 sm:flex-none">
            <CalendarDays className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
            <input
              type="date"
              className="input input-icon sm:w-52"
              value={date}
              max={todayIST()}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
          {date && (
            <button
              onClick={() => setDate("")}
              title="Show all days"
              className="flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-500 shadow-sm hover:bg-slate-50"
            >
              <X className="h-4 w-4" /> All
            </button>
          )}
        </div>
      </div>

      {/* List */}
      <div className="mt-5">
        {isLoading ? (
          <div className="flex justify-center py-16">
            <Spinner className="h-8 w-8" />
          </div>
        ) : error ? (
          <div className="card p-8 text-center text-sm font-semibold text-rose-600">{error}</div>
        ) : filtered.length === 0 ? (
          <div className="card flex flex-col items-center gap-2 p-12 text-center">
            <Users className="h-8 w-8 text-slate-300" />
            <p className="text-sm text-on-surface-variant">No records found.</p>
          </div>
        ) : (
          <div className="card divide-y divide-slate-100 overflow-hidden">
            {filtered.map((r) => {
              const s = r.date ? fmtDateShort(r.date) : null;
              return (
                <div key={r.id} className="flex items-center gap-3 px-4 py-3.5 sm:gap-4 sm:px-5">
                  <Avatar name={r.user?.fullName} className="h-11 w-11 text-sm" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-on-surface">{r.user?.fullName || "Unknown"}</p>
                    <p className="truncate text-xs text-on-surface-variant">
                      {r.user?.email}
                      {!date && s && ` · ${s.day} ${s.month}`}
                    </p>
                    {r.remarks && <p className="mt-0.5 truncate text-xs italic text-amber-700">“{r.remarks}”</p>}
                  </div>
                  <div className="flex flex-col items-end gap-1 sm:flex-row sm:items-center sm:gap-2">
                    <Badge tone="green">
                      <LogIn className="h-3 w-3" /> {fmtTime(checkInOf(r))}
                    </Badge>
                    {r.checkOutAt ? (
                      <Badge tone="red">
                        <LogOut className="h-3 w-3" /> {fmtTime(r.checkOutAt)}
                      </Badge>
                    ) : (
                      <Badge tone="slate">No out</Badge>
                    )}
                    {r.checkOutAt && (
                      <span className="hidden text-xs font-semibold text-slate-400 md:inline">
                        {duration(checkInOf(r), r.checkOutAt)}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AppShell>
  );
}

function Stat({ icon: Icon, label, value, tone }: { icon: typeof Users; label: string; value: number; tone: string }) {
  return (
    <div className="card flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:gap-4">
      <span className={cx("flex h-10 w-10 items-center justify-center rounded-xl", tone)}>
        <Icon className="h-5 w-5" />
      </span>
      <div>
        <p className="text-2xl font-extrabold leading-none text-on-surface">{value}</p>
        <p className="mt-1 text-xs font-semibold text-on-surface-variant">{label}</p>
      </div>
    </div>
  );
}
