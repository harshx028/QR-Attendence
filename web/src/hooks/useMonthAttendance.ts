import { useCallback, useEffect, useMemo, useState } from "react";
import { getMyAttendance, Attendance } from "../api/attendance.api";
import useAuth from "./useAuth";
import { buildMonth, summarize, todayIST, monthKey } from "../lib/attendance";

/** Loads the signed-in user's attendance for one month and derives day statuses. */
export default function useMonthAttendance(month: string) {
  const { user } = useAuth();
  const [records, setRecords] = useState<Attendance[]>([]);
  const [today, setToday] = useState(todayIST());
  const [joinedOn, setJoinedOn] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setIsLoading(true);
    setError("");
    const res = await getMyAttendance(month);
    if (res?.success) {
      // Filter client-side too, in case the server ignores `month`.
      setRecords((res.attendances || []).filter((a) => a.date && monthKey(a.date) === month));
      if (res.today) setToday(res.today);
      setJoinedOn(res.joinedOn ?? null);
    } else {
      setError(res?.message || "Couldn't load your attendance.");
    }
    setIsLoading(false);
  }, [month]);

  useEffect(() => {
    load();
  }, [load]);

  // Fall back to the profile's createdAt so days before the account existed aren't "absent".
  const effectiveJoin =
    joinedOn ??
    (user?.createdAt
      ? new Date(user.createdAt).toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" })
      : null);

  const days = useMemo(() => buildMonth(month, records, today, effectiveJoin), [month, records, today, effectiveJoin]);
  const summary = useMemo(() => summarize(days), [days]);

  return { days, summary, records, today, joinedOn: effectiveJoin, isLoading, error, reload: load };
}
