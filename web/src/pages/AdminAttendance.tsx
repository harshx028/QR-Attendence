import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import useAuth from "../hooks/useAuth";
import { getAllAttendance, Attendance } from "../api/attendance.api";

function fmtTime(iso: string | null) {
  if (!iso) return null;
  return new Date(iso).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}

export default function AdminAttendance() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [records, setRecords] = useState<Attendance[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [date, setDate] = useState("");
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setIsLoading(true);
    setError("");
    const res = await getAllAttendance(date || undefined);
    if (res?.success) {
      setRecords(res.attendances || []);
    } else {
      setError("Failed to load attendance records.");
    }
    setIsLoading(false);
  }, [date]);

  useEffect(() => {
    if (user?.role !== "ADMIN") {
      navigate("/", { replace: true });
      return;
    }
    load();
  }, [user, load, navigate]);

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-2xl mx-auto px-4 pb-10 pt-4">
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => navigate("/")}
            className="text-on-surface-variant hover:text-on-surface font-semibold text-sm"
          >
            ← Back
          </button>
          <h1 className="text-xl font-black text-on-surface">Team Attendance</h1>
        </div>

        {/* Date filter */}
        <div className="flex gap-3 mb-6">
          <input
            type="date"
            className="border border-outline rounded-lg px-3 py-2 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
          <button
            onClick={load}
            className="bg-primary text-white font-bold text-sm px-4 py-2 rounded-lg hover:bg-indigo-700 transition"
          >
            Filter
          </button>
          {date && (
            <button
              onClick={() => setDate("")}
              className="text-on-surface-variant text-sm font-medium hover:text-on-surface"
            >
              Clear
            </button>
          )}
        </div>

        {isLoading ? (
          <div className="flex justify-center py-10">
            <span className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : error ? (
          <p className="text-error text-center text-sm">{error}</p>
        ) : records.length === 0 ? (
          <p className="text-on-surface-variant text-center text-sm py-10">No records found.</p>
        ) : (
          <div className="space-y-3">
            {records.map((r) => (
              <div
                key={r.id}
                className="border border-outline rounded-2xl px-4 py-3 flex items-center gap-3"
              >
                <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                  {r.user?.fullName?.slice(0, 2)?.toUpperCase() || "?"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-on-surface truncate">
                    {r.user?.fullName || "Unknown"}
                  </p>
                  <p className="text-xs text-on-surface-variant truncate">{r.user?.email}</p>
                  <p className="text-xs text-on-surface-variant">{r.date}</p>
                </div>
                <div className="flex flex-col gap-1 items-end">
                  <span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-0.5 rounded-full whitespace-nowrap">
                    IN {fmtTime(r.checkInAt || r.markedAt)}
                  </span>
                  {r.checkOutAt ? (
                    <span className="bg-red-100 text-red-700 text-xs font-bold px-2 py-0.5 rounded-full whitespace-nowrap">
                      OUT {fmtTime(r.checkOutAt)}
                    </span>
                  ) : (
                    <span className="bg-gray-100 text-gray-500 text-xs font-bold px-2 py-0.5 rounded-full whitespace-nowrap">
                      No out
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
