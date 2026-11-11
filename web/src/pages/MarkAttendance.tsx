import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { markAttendance, getTodayStatus } from "../api/attendance.api";

type Status = "checking" | "confirm_checkin" | "confirm_checkout" | "success" | "done" | "error";

function getLocation(): Promise<{ lat: number | null; lng: number | null }> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) return resolve({ lat: null, lng: null });
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => resolve({ lat: null, lng: null }),
      { timeout: 5000 }
    );
  });
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

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4">
      <div className="w-full max-w-sm bg-white border border-outline rounded-3xl p-8 shadow-sm">
        <div className="flex flex-col items-center gap-4">

          {status === "checking" && (
            <span className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          )}

          {(status === "confirm_checkin" || status === "confirm_checkout") && (
            <>
              <span
                className={`text-xs font-bold px-4 py-1 rounded-full tracking-widest ${
                  isCheckout
                    ? "bg-red-100 text-red-700"
                    : "bg-green-100 text-green-700"
                }`}
              >
                {isCheckout ? "CHECK-OUT" : "CHECK-IN"}
              </span>
              <h1 className="text-xl font-black text-on-surface text-center">
                {isCheckout ? "Confirm Check-Out" : "Confirm Check-In"}
              </h1>
              <p className="text-sm text-on-surface-variant text-center">
                {isCheckout
                  ? "Tap below to record your check-out time and location."
                  : "Tap below to record your check-in time and location."}
              </p>
              {!isCheckout && remarks && (
                <div className="w-full bg-yellow-50 rounded-xl p-3">
                  <p className="text-xs font-bold text-yellow-800 mb-1">Remark</p>
                  <p className="text-sm text-yellow-700">{remarks}</p>
                </div>
              )}
              <button
                onClick={handleMark}
                disabled={isSubmitting}
                className={`w-full text-white font-black py-3 rounded-full shadow-md transition disabled:opacity-70 flex items-center justify-center ${
                  isCheckout ? "bg-red-600 hover:bg-red-700" : "bg-primary hover:bg-indigo-700"
                }`}
              >
                {isSubmitting ? (
                  <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : isCheckout ? (
                  "Check Out"
                ) : (
                  "Check In"
                )}
              </button>
              <button
                onClick={() => navigate("/scan_qr", { replace: true })}
                disabled={isSubmitting}
                className="text-sm text-primary font-bold hover:underline"
              >
                Scan a different code
              </button>
            </>
          )}

          {status === "success" && (
            <>
              <div
                className={`w-14 h-14 rounded-full flex items-center justify-center ${
                  eventType === "CHECK-IN" ? "bg-green-100" : "bg-red-100"
                }`}
              >
                <span
                  className={`text-xl font-black ${
                    eventType === "CHECK-IN" ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {eventType === "CHECK-IN" ? "↓" : "↑"}
                </span>
              </div>
              <h1 className="text-xl font-black text-on-surface">
                {eventType === "CHECK-IN" ? "Checked In!" : "Checked Out!"}
              </h1>
              <p className="text-sm text-on-surface-variant text-center">{message}</p>
              <button
                onClick={() => navigate("/", { replace: true })}
                className="w-full bg-primary text-white font-black py-3 rounded-full hover:bg-indigo-700 transition"
              >
                Go to Dashboard
              </button>
            </>
          )}

          {status === "done" && (
            <>
              <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center">
                <span className="text-xl font-black text-green-600">✓</span>
              </div>
              <h1 className="text-xl font-black text-on-surface">All Done Today</h1>
              <p className="text-sm text-on-surface-variant text-center">{message}</p>
              <button
                onClick={() => navigate("/", { replace: true })}
                className="w-full bg-primary text-white font-black py-3 rounded-full hover:bg-indigo-700 transition"
              >
                Go to Dashboard
              </button>
            </>
          )}

          {status === "error" && (
            <>
              <h1 className="text-xl font-black text-error text-center">Something went wrong</h1>
              <p className="text-sm text-on-surface-variant text-center">{message}</p>
              <button
                onClick={() => navigate("/scan_qr", { replace: true })}
                className="w-full bg-primary text-white font-black py-3 rounded-full hover:bg-indigo-700 transition"
              >
                Try Again
              </button>
              <button
                onClick={() => navigate("/", { replace: true })}
                className="text-sm text-primary font-bold hover:underline"
              >
                Go to Dashboard
              </button>
            </>
          )}

        </div>
      </div>
    </div>
  );
}
