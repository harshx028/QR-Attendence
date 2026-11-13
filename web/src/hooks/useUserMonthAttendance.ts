import { useCallback, useEffect, useMemo, useState } from "react";
import { getUserAttendance, Attendance } from "../api/attendance.api";
import { buildMonth, summarize, todayIST, monthKey } from "../lib/attendance";

export default function useUserMonthAttendance(userId: string, month: string) {
  const [records, setRecords] = useState<Attendance[]>([]);
  const [today, setToday] = useState(todayIST());
  const [joinedOn, setJoinedOn] = useState<string | null>(null);
  const [userName, setUserName] = useState<{ fullName: string; email: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!userId) return;
    setIsLoading(true);
    setError("");
    const res = await getUserAttendance(userId, month);
    if (res?.success) {
      setRecords((res.attendances || []).filter((a) => a.date && monthKey(a.date) === month));
      if (res.today) setToday(res.today);
      setJoinedOn(res.joinedOn ?? null);
      if (res.user) setUserName(res.user);
    } else {
      setError(res?.message || "Couldn't load attendance.");
    }
    setIsLoading(false);
  }, [userId, month]);

  useEffect(() => {
    load();
  }, [load]);

  const days = useMemo(() => buildMonth(month, records, today, joinedOn), [month, records, today, joinedOn]);
  const summary = useMemo(() => summarize(days), [days]);

  return { days, summary, records, today, joinedOn, userName, isLoading, error, reload: load };
}
