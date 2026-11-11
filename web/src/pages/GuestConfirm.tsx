import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { markGuestAttendance } from "../api/attendance.api";

type Status = "confirm" | "submitting" | "success" | "done" | "error";

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

  const scanAgain = () =>
    navigate("/guest/scan", { state: { guestName, guestPhone }, replace: true });

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4">
      <div className="w-full max-w-sm bg-white border border-outline rounded-3xl p-8 shadow-sm">
        <div className="flex flex-col items-center gap-4">

          {(status === "confirm" || status === "submitting") && (
            <>
              <span className="bg-green-100 text-green-700 text-xs font-bold px-4 py-1 rounded-full tracking-widest">
                CHECK-IN / CHECK-OUT
              </span>
              <h1 className="text-xl font-black text-on-surface">Confirm Attendance</h1>
              <p className="text-sm text-on-surface-variant text-center">
                Scanning as <strong className="text-on-surface">{guestName}</strong>
                <br />Phone: {guestPhone}
              </p>
              <button
                onClick={handleMark}
                disabled={status === "submitting"}
                className="w-full bg-primary text-white font-black py-3 rounded-full hover:bg-indigo-700 transition disabled:opacity-70 flex items-center justify-center"
              >
                {status === "submitting" ? (
                  <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  "Confirm"
                )}
              </button>
              <button
                onClick={scanAgain}
                disabled={status === "submitting"}
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
                onClick={() => navigate("/auth/login", { replace: true })}
                className="w-full bg-primary text-white font-black py-3 rounded-full hover:bg-indigo-700 transition"
              >
                Done
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
                onClick={() => navigate("/auth/login", { replace: true })}
                className="w-full bg-primary text-white font-black py-3 rounded-full hover:bg-indigo-700 transition"
              >
                Done
              </button>
            </>
          )}

          {status === "error" && (
            <>
              <h1 className="text-xl font-black text-error text-center">Something went wrong</h1>
              <p className="text-sm text-on-surface-variant text-center">{message}</p>
              <button
                onClick={scanAgain}
                className="w-full bg-primary text-white font-black py-3 rounded-full hover:bg-indigo-700 transition"
              >
                Try Again
              </button>
            </>
          )}

        </div>
      </div>
    </div>
  );
}
