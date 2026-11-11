import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Capacitor } from "@capacitor/core";
import useAuth from "../hooks/useAuth";
import { getTodayStatus, getMyAttendance, Attendance, TodayStatus } from "../api/attendance.api";

const isNative = Capacitor.isNativePlatform();

function fmtTime(iso: string | null) {
  if (!iso) return null;
  return new Date(iso).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [todayStatus, setTodayStatus] = useState<TodayStatus | null>(null);
  const [attendances, setAttendances] = useState<Attendance[]>([]);

  const load = useCallback(async () => {
    setIsLoading(true);
    const [status, history] = await Promise.all([getTodayStatus(), getMyAttendance()]);
    if (status) setTodayStatus(status);
    if (history?.success) setAttendances(history.attendances || []);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleLogout = async () => {
    if (!confirm("Are you sure you want to sign out?")) return;
    await logout();
    navigate("/auth/login", { replace: true });
  };

  const now = new Date();
  const thisMonth = now.getMonth();
  const thisYear = now.getFullYear();

  const presentDates = new Set(
    attendances
      .filter((a) => {
        const d = new Date(a.markedAt || a.checkInAt || a.date);
        return d.getMonth() === thisMonth && d.getFullYear() === thisYear;
      })
      .map((a) => a.date || new Date(a.markedAt).toDateString())
  );
  const presentCount = presentDates.size;
  const daysElapsed = now.getDate();
  const absentCount = Math.max(daysElapsed - presentCount, 0);
  const performancePct = daysElapsed > 0 ? Math.round((presentCount / daysElapsed) * 100) : 0;

  const checkedIn = todayStatus?.checkedIn ?? false;
  const checkedOut = todayStatus?.checkedOut ?? false;
  const checkInAt = todayStatus?.attendance?.checkInAt ?? todayStatus?.attendance?.markedAt ?? null;
  const checkOutAt = todayStatus?.attendance?.checkOutAt ?? null;

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-lg mx-auto px-4 pb-10 pt-4">
        {/* Header */}
        <div className="flex justify-between items-center mt-2 mb-1">
          <div>
            <p className="text-sm text-on-surface-variant font-medium">Good morning,</p>
            <p className="text-2xl font-extrabold text-on-surface">{user?.fullName || "there"}</p>
          </div>
          <button
            onClick={handleLogout}
            className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-white font-bold text-base"
          >
            {user?.fullName?.slice(0, 2)?.toUpperCase() || "?"}
          </button>
        </div>
        <p className="text-sm text-on-surface-variant mb-6">
          {now.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}
        </p>

        {/* Today's status card */}
        <div className="bg-white border border-outline rounded-3xl p-6 shadow-sm mb-6">
          {isLoading ? (
            <div className="flex justify-center py-4">
              <span className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : checkedIn && checkedOut ? (
            <div className="flex flex-col items-center gap-3">
              <span className="bg-green-100 text-green-700 text-xs font-bold px-4 py-1 rounded-full">
                ✓ Complete
              </span>
              <p className="text-sm font-semibold text-on-surface-variant">Attendance Complete</p>
              <div className="flex items-center gap-6 mt-1">
                <div className="text-center">
                  <p className="text-xs font-bold text-green-600 tracking-widest">IN</p>
                  <p className="text-xl font-black text-on-surface">{fmtTime(checkInAt)}</p>
                </div>
                <div className="w-px h-8 bg-outline" />
                <div className="text-center">
                  <p className="text-xs font-bold text-red-600 tracking-widest">OUT</p>
                  <p className="text-xl font-black text-on-surface">{fmtTime(checkOutAt)}</p>
                </div>
              </div>
            </div>
          ) : checkedIn ? (
            <div className="flex flex-col items-center gap-3">
              <span className="bg-yellow-100 text-yellow-700 text-xs font-bold px-4 py-1 rounded-full">
                ↓ Checked In
              </span>
              <p className="text-sm font-semibold text-on-surface-variant">
                You're checked in since {fmtTime(checkInAt)}
              </p>
              {isNative && (
                <button
                  onClick={() => navigate("/scan_qr")}
                  className="mt-3 w-full bg-red-600 text-white font-black text-lg py-3 rounded-full shadow-md hover:bg-red-700 transition"
                >
                  Scan to Check Out
                </button>
              )}
              {!isNative && (
                <p className="text-xs text-on-surface-variant text-center mt-2">
                  Use the mobile app to scan QR and check out.
                </p>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3">
              <p className="text-sm font-semibold text-on-surface-variant">Not checked in today</p>
              <p className="text-xs text-on-surface-variant text-center">
                {isNative
                  ? "Scan the office QR code to mark your attendance."
                  : "Use the mobile app to scan the QR code and mark attendance."}
              </p>
              {isNative && (
                <button
                  onClick={() => navigate("/attendence/remarks")}
                  className="mt-3 w-full bg-primary text-white font-black text-lg py-3 rounded-full shadow-md hover:bg-indigo-700 transition"
                >
                  Scan to Check In
                </button>
              )}
            </div>
          )}
        </div>

        {/* Monthly stats */}
        <p className="text-lg font-black text-on-surface mb-3">Monthly Overview</p>
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-blue-50 rounded-2xl p-4 flex flex-col items-center">
            <div className="w-8 h-8 bg-blue-200 rounded-lg flex items-center justify-center text-lg mb-2">📅</div>
            <p className="text-2xl font-black text-on-surface">{String(presentCount).padStart(2, "0")}</p>
            <p className="text-xs text-on-surface-variant font-medium">Present</p>
          </div>
          <div className="bg-red-50 rounded-2xl p-4 flex flex-col items-center">
            <div className="w-8 h-8 bg-red-200 rounded-lg flex items-center justify-center text-lg mb-2">✘</div>
            <p className="text-2xl font-black text-on-surface">{String(absentCount).padStart(2, "0")}</p>
            <p className="text-xs text-on-surface-variant font-medium">Absent</p>
          </div>
        </div>

        {/* Performance */}
        <div className="bg-gray-50 rounded-2xl p-4 mb-6">
          <div className="flex justify-between items-center mb-2">
            <p className="text-sm font-bold text-on-surface">Performance</p>
            <p className="text-sm font-black text-primary">{performancePct}%</p>
          </div>
          <div className="h-2 bg-gray-200 rounded-full mb-2">
            <div
              className="h-full bg-primary rounded-full transition-all"
              style={{ width: `${performancePct}%` }}
            />
          </div>
          <p className="text-xs text-on-surface-variant">
            Based on {presentCount} of {daysElapsed} days this month.
          </p>
        </div>

        {/* Attendance history */}
        <p className="text-lg font-black text-on-surface mb-3">Attendance History</p>
        {attendances.length === 0 ? (
          <p className="text-sm text-on-surface-variant text-center py-6">No records yet.</p>
        ) : (
          <div className="space-y-2">
            {attendances.slice(0, 30).map((a) => (
              <div
                key={a.id}
                className="border border-outline rounded-xl px-4 py-3 flex justify-between items-center"
              >
                <p className="text-sm font-semibold text-on-surface">
                  {fmtDate(a.date || a.markedAt)}
                </p>
                <div className="flex gap-2">
                  <span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-0.5 rounded-full">
                    IN {fmtTime(a.checkInAt || a.markedAt)}
                  </span>
                  {a.checkOutAt ? (
                    <span className="bg-red-100 text-red-700 text-xs font-bold px-2 py-0.5 rounded-full">
                      OUT {fmtTime(a.checkOutAt)}
                    </span>
                  ) : (
                    <span className="bg-gray-100 text-gray-500 text-xs font-bold px-2 py-0.5 rounded-full">
                      No out
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Admin button */}
        {user?.role === "ADMIN" && (
          <button
            onClick={() => navigate("/attendence/all")}
            className="mt-6 w-full border-2 border-primary text-primary font-black text-base py-3 rounded-full hover:bg-primary-container transition"
          >
            View Team Attendance
          </button>
        )}

        {/* Sign out */}
        <button
          onClick={handleLogout}
          className="mt-3 w-full border border-outline text-on-surface-variant font-semibold text-sm py-3 rounded-full hover:bg-gray-50 transition"
        >
          Sign Out
        </button>
      </div>
    </div>
  );
}
