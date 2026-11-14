import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { CheckCheck, LogIn, LogOut, Phone, ScanLine, UserRound, XCircle } from "lucide-react";
import { markGuestAttendance } from "../api/attendance.api";
import { getLocation } from "../lib/permissions";
import { Avatar, Button, CenteredCard, StatusIcon } from "../components/ui";

type Status = "confirm" | "submitting" | "success" | "done" | "error";

export default function GuestConfirm() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const token: string = state?.token ?? "";
  const guestName: string = state?.guestName ?? "";
  const guestPhone: string = state?.guestPhone ?? "";

  const [status, setStatus] = useState<Status>("confirm");
  const [eventType, setEventType] = useState<"CHECK-IN" | "CHECK-OUT">("CHECK-IN");
  const [message, setMessage] = useState("");

  const handleMark = async () => {
    if (!token) {
      setStatus("error");
      setMessage("No QR code detected. Please scan again.");
      return;
    }
    setStatus("submitting");
    const { lat, lng } = await getLocation();
    const res = await markGuestAttendance({ token, fullName: guestName, phone: guestPhone, lat, lng });

    if (res?.success) {
      setEventType(res.eventType);
      setStatus("success");
      setMessage(res.message || "Recorded successfully.");
    } else if (res?.message?.includes("already checked in and checked out")) {
      setStatus("done");
      setMessage(res.message);
    } else {
      setStatus("error");
      setMessage(res?.message || "Failed to record attendance.");
    }
  };

  const scanAgain = () => navigate("/guest/scan", { state: { guestName, guestPhone }, replace: true });
  const finish = () => navigate("/auth/login", { replace: true });

  return (
    <CenteredCard>
      <div className="flex flex-col items-center gap-4 text-center">
        {(status === "confirm" || status === "submitting") && (
          <>
            <StatusIcon icon={UserRound} tone="indigo" />
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">Guest check-in / out</p>
              <h1 className="mt-1 text-2xl font-extrabold text-on-surface">Confirm your visit</h1>
            </div>
            <div className="flex w-full items-center gap-3 rounded-2xl bg-slate-50 p-4 text-left">
              <Avatar name={guestName} />
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-on-surface">{guestName}</p>
                <p className="flex items-center gap-1 text-xs text-on-surface-variant">
                  <Phone className="h-3 w-3" /> {guestPhone}
                </p>
              </div>
            </div>
            <Button size="lg" className="mt-1 w-full" loading={status === "submitting"} onClick={handleMark}>
              Confirm
            </Button>
            <Button variant="ghost" icon={ScanLine} disabled={status === "submitting"} onClick={scanAgain}>
              Scan a different code
            </Button>
          </>
        )}

        {status === "success" && (
          <>
            <StatusIcon icon={eventType === "CHECK-IN" ? LogIn : LogOut} tone={eventType === "CHECK-IN" ? "green" : "red"} />
            <h1 className="text-2xl font-extrabold text-on-surface">
              {eventType === "CHECK-IN" ? "Welcome in!" : "Thanks for visiting!"}
            </h1>
            <p className="text-sm text-on-surface-variant">{message}</p>
            <Button size="lg" className="mt-2 w-full" onClick={finish}>
              Done
            </Button>
          </>
        )}

        {status === "done" && (
          <>
            <StatusIcon icon={CheckCheck} tone="indigo" />
            <h1 className="text-2xl font-extrabold text-on-surface">All done today</h1>
            <p className="text-sm text-on-surface-variant">{message}</p>
            <Button size="lg" className="mt-2 w-full" onClick={finish}>
              Done
            </Button>
          </>
        )}

        {status === "error" && (
          <>
            <StatusIcon icon={XCircle} tone="red" />
            <h1 className="text-2xl font-extrabold text-on-surface">Something went wrong</h1>
            <p className="text-sm text-on-surface-variant">{message}</p>
            <Button size="lg" icon={ScanLine} className="mt-2 w-full" onClick={scanAgain}>
              Try again
            </Button>
          </>
        )}
      </div>
    </CenteredCard>
  );
}
