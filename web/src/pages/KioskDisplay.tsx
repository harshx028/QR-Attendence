import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import QRCode from "qrcode";
import { ArrowLeft, LogOut, Maximize, Minimize, RefreshCw, ScanLine, Smartphone, WifiOff } from "lucide-react";
import useAuth from "../hooks/useAuth";
import { getKioskQr } from "../api/kiosk.api";
import { Spinner, cx } from "../components/ui";

type QrState = { token: string; expiresAt: number; rotationSeconds: number };

const POLL_EVERY_MS = 3_000; // pick up a new code within a few seconds, whatever the timing
const STUCK_AFTER_MS = 150_000; // same code for 2.5 min → the rotation job is probably not running

function useClock() {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(id);
  }, []);
  return now;
}

/** Keep the kiosk screen from sleeping (where the browser supports it). */
function useWakeLock() {
  useEffect(() => {
    let lock: any = null;
    const request = async () => {
      try {
        lock = await (navigator as any).wakeLock?.request("screen");
      } catch {
        /* not supported / not allowed — ignore */
      }
    };
    const onVisible = () => document.visibilityState === "visible" && request();
    request();
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      lock?.release?.().catch?.(() => {});
    };
  }, []);
}

export default function KioskDisplay() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const isAdmin = user?.role === "ADMIN";

  const [qr, setQr] = useState<QrState | null>(null);
  const [svg, setSvg] = useState("");
  const [error, setError] = useState("");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const offsetRef = useRef(0); // serverTime - local time
  const inFlight = useRef(false);
  const lastFetch = useRef(0);
  const currentToken = useRef<string | null>(null);
  const [tokenSince, setTokenSince] = useState(() => Date.now()); // when the current code first appeared
  const now = useClock();
  useWakeLock();

  const fetchQr = useCallback(async () => {
    if (inFlight.current) return;
    inFlight.current = true;
    lastFetch.current = Date.now();
    const res = await getKioskQr();
    inFlight.current = false;

    if (res.success && res.token && res.expiresAt) {
      if (res.serverTime) offsetRef.current = new Date(res.serverTime).getTime() - Date.now();
      const token = res.token;
      if (currentToken.current !== token) {
        currentToken.current = token;
        setTokenSince(Date.now());
      }
      setQr({
        token,
        expiresAt: new Date(res.expiresAt).getTime(),
        rotationSeconds: res.rotationSeconds || 60,
      });
      setError("");
    } else if (res.status === 401) {
      await logout();
      navigate("/auth/login", { replace: true });
    } else {
      setError(res.message || "Can't reach the server");
    }
  }, [logout, navigate]);

  // Render the QR whenever the token changes.
  useEffect(() => {
    if (!qr) return;
    QRCode.toString(qr.token, {
      type: "svg",
      margin: 1,
      errorCorrectionLevel: "H", // leaves room for the logo in the middle
      color: { dark: "#1E1B4B", light: "#FFFFFF" },
    }).then(setSvg);
  }, [qr?.token]);

  // Polling: right after expiry (every second until a new code arrives) + a periodic safety refresh.
  const remainingMs = qr ? qr.expiresAt - (now + offsetRef.current) : 0;
  useEffect(() => {
    const since = Date.now() - lastFetch.current;
    if (!qr || since > POLL_EVERY_MS || (remainingMs <= 0 && since > 1000)) fetchQr();
  }, [now]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const onFs = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", onFs);
    return () => document.removeEventListener("fullscreenchange", onFs);
  }, []);

  const toggleFullscreen = () => {
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    else document.documentElement.requestFullscreen?.().catch(() => {});
  };

  const handleSignOut = async () => {
    if (!confirm("Sign out of the kiosk display?")) return;
    await logout();
    navigate("/auth/login", { replace: true });
  };

  const seconds = Math.max(0, Math.ceil(remainingMs / 1000));
  const pct = qr ? Math.min(100, Math.max(0, (remainingMs / (qr.rotationSeconds * 1000)) * 100)) : 0;
  const refreshing = Boolean(qr) && remainingMs <= 0;
  // Never hide a code the server says is current — it is still valid for scanning.
  const stuck = Boolean(qr) && now - tokenSince > STUCK_AFTER_MS;
  const urgent = seconds <= 10 && !refreshing;

  const clock = new Date(now).toLocaleTimeString("en-IN", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: "Asia/Kolkata",
  });
  const date = new Date(now).toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "Asia/Kolkata",
  });

  return (
    <div className="hero-gradient relative flex min-h-screen flex-col overflow-hidden text-white pt-safe pb-safe">
      <div className="pointer-events-none absolute -right-40 -top-40 h-[32rem] w-[32rem] rounded-full bg-white/10" />
      <div className="pointer-events-none absolute -bottom-48 -left-32 h-[36rem] w-[36rem] rounded-full bg-white/5" />

      {/* Top bar */}
      <header className="relative flex items-center justify-between gap-4 px-5 py-4 sm:px-8 sm:py-6">
        <div className="flex items-center gap-3">
          <img src="/logo.svg" alt="" className="h-10 w-10 rounded-xl shadow-lg ring-2 ring-white/30 sm:h-12 sm:w-12" />
          <div>
            <p className="text-base font-extrabold leading-tight sm:text-lg">Mark Attendance</p>
            <p className="text-xs text-white/70">Durga Foundation</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="mr-2 hidden text-right sm:block">
            <p className="text-2xl font-extrabold tabular-nums leading-none">{clock}</p>
            <p className="mt-1 text-xs text-white/70">{date}</p>
          </div>
          <button
            onClick={toggleFullscreen}
            title={isFullscreen ? "Exit full screen" : "Full screen"}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 transition hover:bg-white/20"
          >
            {isFullscreen ? <Minimize className="h-5 w-5" /> : <Maximize className="h-5 w-5" />}
          </button>
          {isAdmin ? (
            <button
              onClick={() => navigate("/")}
              title="Back to dashboard"
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 transition hover:bg-white/20"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
          ) : (
            <button
              onClick={handleSignOut}
              title="Sign out"
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 transition hover:bg-white/20"
            >
              <LogOut className="h-5 w-5" />
            </button>
          )}
        </div>
      </header>

      {/* Main */}
      <main className="relative flex flex-1 flex-col items-center justify-center gap-8 px-5 pb-8 lg:flex-row lg:gap-20 lg:px-12">
        {/* Instructions */}
        <div className="max-w-md text-center lg:text-left">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-white/60">Attendance</p>
          <h1 className="mt-2 text-3xl font-extrabold leading-tight sm:text-5xl">
            Scan to check in
            <br className="hidden lg:block" /> or check out
          </h1>
          <ol className="mt-8 hidden space-y-4 lg:block">
            {[
              { icon: Smartphone, text: "Open the Mark Attendance app on your phone" },
              { icon: ScanLine, text: "Tap “Scan to Check In” (or Check Out)" },
              { icon: RefreshCw, text: "Point the camera at this code — it changes every minute" },
            ].map(({ icon: Icon, text }, i) => (
              <li key={i} className="flex items-center gap-4">
                <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl bg-white/15">
                  <Icon className="h-5 w-5" />
                </span>
                <span className="text-base text-white/85">{text}</span>
              </li>
            ))}
          </ol>
        </div>

        {/* QR card */}
        <div className="w-full max-w-[min(30rem,82vw,62vh)]">
          <div className="relative rounded-[2rem] bg-white p-5 shadow-2xl shadow-black/30 sm:p-7">
            <div className="relative aspect-square w-full">
              {svg ? (
                <div
                  key={qr?.token}
                  className="h-full w-full animate-pop [&>svg]:h-full [&>svg]:w-full"
                  dangerouslySetInnerHTML={{ __html: svg }}
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center">
                  {error ? (
                    <div className="px-6 text-center">
                      <WifiOff className="mx-auto h-10 w-10 text-slate-300" />
                      <p className="mt-3 text-sm font-semibold text-slate-500">{error}</p>
                    </div>
                  ) : (
                    <Spinner className="h-10 w-10" />
                  )}
                </div>
              )}

              {svg && (
                <div className="absolute left-1/2 top-1/2 flex h-[19%] w-[19%] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-2xl bg-white p-1.5">
                  <img src="/logo.svg" alt="" className="h-full w-full rounded-xl" />
                </div>
              )}

            </div>

            {/* Countdown */}
            <div className="mt-5">
              <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                <div
                  className={cx(
                    "h-full rounded-full transition-[width] duration-300 ease-linear",
                    urgent ? "bg-rose-500" : "bg-primary"
                  )}
                  style={{ width: `${pct}%` }}
                />
              </div>
              <div className="mt-3 flex items-center justify-between text-sm font-semibold text-slate-500">
                <span className="flex items-center gap-1.5">
                  <RefreshCw className={cx("h-4 w-4", refreshing && "animate-spin")} />
                  {refreshing ? "Refreshing…" : "New code in"}
                </span>
                {!refreshing && (
                  <span className={cx("text-xl font-extrabold tabular-nums", urgent ? "text-rose-600" : "text-slate-800")}>
                    0:{String(seconds).padStart(2, "0")}
                  </span>
                )}
              </div>
            </div>
          </div>

          {stuck && !error && (
            <p className="mt-4 text-center text-sm font-semibold text-amber-200">
              This code hasn't changed for a few minutes — it still works, but check the server's
              token rotation.
            </p>
          )}

          {error && qr && (
            <p className="mt-4 flex items-center justify-center gap-2 text-sm font-semibold text-amber-200">
              <WifiOff className="h-4 w-4" /> Connection problem — retrying…
            </p>
          )}

          <p className="mt-4 text-center text-sm font-semibold tabular-nums text-white/80 sm:hidden">
            {clock} · {date}
          </p>
        </div>
      </main>
    </div>
  );
}
