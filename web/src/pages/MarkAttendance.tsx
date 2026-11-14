import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { CheckCheck, LogIn, LogOut, MapPin, MessageSquareText, ScanLine, XCircle } from "lucide-react";
import { markAttendance, getTodayStatus } from "../api/attendance.api";
import { getLocation } from "../lib/permissions";
import { Button, CenteredCard, Spinner, StatusIcon } from "../components/ui";

type Status = "checking" | "confirm_checkin" | "confirm_checkout" | "success" | "done" | "error";

function nowLabel() {
  return new Date().toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", hour12: true });
}

export default function MarkAttendance() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const token: string = state?.token ?? "";
  const remarks: string = state?.remarks ?? "";

  const [status, setStatus] = useState<Status>("checking");
  const [eventType, setEventType] = useState<"CHECK-IN" | "CHECK-OUT">("CHECK-IN");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("No QR code detected. Please scan again.");
      return;
    }
    getTodayStatus().then((res) => {
      if (!res?.success) {
        setStatus("confirm_checkin");
        return;
      }
      if (res.checkedIn && res.checkedOut) {
        setStatus("done");
        setMessage("You have already checked in and checked out for today.");
      } else if (res.checkedIn) {
        setStatus("confirm_checkout");
      } else {
        setStatus("confirm_checkin");
      }
    });
  }, [token]);

  const handleMark = async () => {
    setIsSubmitting(true);
    const { lat, lng } = await getLocation();
    const res = await markAttendance(token, lat, lng, remarks || null);
    setIsSubmitting(false);

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

  const isCheckout = status === "confirm_checkout";
  const goHome = () => navigate("/", { replace: true });

  return (
    <CenteredCard>
      <div className="flex flex-col items-center gap-4 text-center">
        {status === "checking" && (
          <div className="flex flex-col items-center gap-3 py-8">
            <Spinner className="h-10 w-10" />
            <p className="text-sm text-on-surface-variant">Checking today's status…</p>
          </div>
        )}

        {(status === "confirm_checkin" || status === "confirm_checkout") && (
          <>
            <StatusIcon icon={isCheckout ? LogOut : LogIn} tone={isCheckout ? "red" : "green"} />
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">
                {isCheckout ? "Check-out" : "Check-in"} at {nowLabel()}
              </p>
              <h1 className="mt-1 text-2xl font-extrabold text-on-surface">
                {isCheckout ? "Heading out?" : "Ready to start?"}
              </h1>
            </div>
            <p className="flex items-center gap-1.5 text-sm text-on-surface-variant">
              <MapPin className="h-4 w-4" /> Your time and location will be recorded.
            </p>
            {!isCheckout && remarks && (
              <div className="flex w-full items-start gap-2.5 rounded-2xl bg-amber-50 p-3.5 text-left">
                <MessageSquareText className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-600" />
                <p className="text-sm text-amber-800">{remarks}</p>
              </div>
            )}
            <Button
              size="lg"
              variant={isCheckout ? "danger" : "success"}
              icon={isCheckout ? LogOut : LogIn}
              loading={isSubmitting}
              onClick={handleMark}
              className="mt-2 w-full"
            >
              {isCheckout ? "Check out" : "Check in"}
            </Button>
            <Button
              variant="ghost"
              icon={ScanLine}
              disabled={isSubmitting}
              onClick={() => navigate("/scan_qr", { replace: true })}
            >
              Scan a different code
            </Button>
          </>
        )}

        {status === "success" && (
          <>
            <StatusIcon icon={eventType === "CHECK-IN" ? LogIn : LogOut} tone={eventType === "CHECK-IN" ? "green" : "red"} />
            <h1 className="text-2xl font-extrabold text-on-surface">
              {eventType === "CHECK-IN" ? "You're checked in!" : "You're checked out!"}
            </h1>
            <p className="text-sm text-on-surface-variant">{message}</p>
            <Button size="lg" className="mt-2 w-full" onClick={goHome}>
              Go to dashboard
            </Button>
          </>
        )}

        {status === "done" && (
          <>
            <StatusIcon icon={CheckCheck} tone="indigo" />
            <h1 className="text-2xl font-extrabold text-on-surface">All done today</h1>
            <p className="text-sm text-on-surface-variant">{message}</p>
            <Button size="lg" className="mt-2 w-full" onClick={goHome}>
              Go to dashboard
            </Button>
          </>
        )}

        {status === "error" && (
          <>
            <StatusIcon icon={XCircle} tone="red" />
            <h1 className="text-2xl font-extrabold text-on-surface">Something went wrong</h1>
            <p className="text-sm text-on-surface-variant">{message}</p>
            <Button size="lg" icon={ScanLine} className="mt-2 w-full" onClick={() => navigate("/scan_qr", { replace: true })}>
              Try again
            </Button>
            <Button variant="ghost" onClick={goHome}>
              Go to dashboard
            </Button>
          </>
        )}
      </div>
    </CenteredCard>
  );
}
