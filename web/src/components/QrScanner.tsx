import { ReactNode, useCallback, useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { ArrowLeft, Camera, CameraOff, Settings } from "lucide-react";
import { Capacitor } from "@capacitor/core";
import { ensureCamera, openAppSettings, CameraAccess } from "../lib/permissions";
import { Spinner } from "./ui";

interface QrScannerProps {
  onScan: (data: string) => void;
}

export default function QrScanner({ onScan }: QrScannerProps) {
  const scannedRef = useRef(false);
  const [access, setAccess] = useState<CameraAccess | "checking">("checking");
  const [failed, setFailed] = useState(false);
  const accessRef = useRef(access);
  accessRef.current = access;

  const check = useCallback(async () => {
    setAccess("checking");
    setAccess(await ensureCamera());
  }, []);

  // Ask on mount, and re-check when the user comes back from the Settings app.
  useEffect(() => {
    check();
    const onVisible = () => {
      const a = accessRef.current;
      if (document.visibilityState === "visible" && a !== "granted" && a !== "checking") check();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [check]);

  // Start the camera only once permission is granted.
  useEffect(() => {
    if (access !== "granted") return;
    setFailed(false);
    const scanner = new Html5Qrcode("qr-reader");

    scanner
      .start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decodedText) => {
          if (scannedRef.current) return;
          scannedRef.current = true;
          navigator.vibrate?.(60);
          scanner.stop().catch(() => {});
          onScan(decodedText);
        },
        () => {}
      )
      .catch((err) => {
        console.error("QR scanner start failed:", err);
        setFailed(true);
      });

    return () => {
      scanner.stop().catch(() => {});
    };
  }, [onScan, access]);

  if (access !== "granted") {
    return <PermissionPanel access={access} onRetry={check} />;
  }

  return (
    <div className="relative mx-auto aspect-square w-full max-w-[18rem]">
      <div id="qr-reader" className="h-full w-full overflow-hidden rounded-[2rem] bg-slate-900" />

      {failed ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-[2rem] bg-slate-900 p-6 text-center">
          <CameraOff className="h-10 w-10 text-slate-500" />
          <p className="text-sm font-semibold text-slate-300">Couldn't start the camera</p>
          <p className="text-xs text-slate-500">Close other apps using the camera and try again.</p>
          <button onClick={check} className="mt-1 rounded-full bg-white/10 px-4 py-2 text-xs font-bold text-white hover:bg-white/20">
            Try again
          </button>
        </div>
      ) : (
        <div className="pointer-events-none absolute inset-0">
          {/* corner brackets */}
          {[
            "left-0 top-0 border-l-4 border-t-4 rounded-tl-[2rem]",
            "right-0 top-0 border-r-4 border-t-4 rounded-tr-[2rem]",
            "left-0 bottom-0 border-l-4 border-b-4 rounded-bl-[2rem]",
            "right-0 bottom-0 border-r-4 border-b-4 rounded-br-[2rem]",
          ].map((c) => (
            <span key={c} className={`absolute h-14 w-14 border-primary-300 ${c}`} />
          ))}
          <span className="absolute left-[8%] right-[8%] h-0.5 animate-scanline rounded-full bg-primary-300 shadow-[0_0_16px_4px_rgba(165,180,252,0.6)]" />
        </div>
      )}
    </div>
  );
}

function PermissionPanel({ access, onRetry }: { access: CameraAccess | "checking"; onRetry: () => void }) {
  const isNative = Capacitor.isNativePlatform();

  if (access === "checking") {
    return (
      <div className="mx-auto flex aspect-square w-full max-w-[18rem] flex-col items-center justify-center gap-3 rounded-[2rem] bg-slate-900">
        <Spinner className="h-8 w-8" light />
        <p className="text-sm font-semibold text-slate-400">Asking for camera access…</p>
      </div>
    );
  }

  const blocked = access === "blocked";
  const unavailable = access === "unavailable";

  return (
    <div className="mx-auto flex w-full max-w-[18rem] flex-col items-center gap-4 rounded-[2rem] bg-slate-900 p-6 text-center">
      <span className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/20 text-primary-300 ring-8 ring-primary/10">
        {unavailable ? <CameraOff className="h-7 w-7" /> : <Camera className="h-7 w-7" />}
      </span>
      <div>
        <p className="text-base font-extrabold text-white">
          {unavailable ? "No camera found" : "Camera access needed"}
        </p>
        <p className="mt-1.5 text-sm text-slate-400">
          {unavailable
            ? "This device doesn't have a camera the app can use."
            : blocked
              ? isNative
                ? "Camera permission is turned off. Open Settings → Permissions → Camera and choose Allow."
                : "Camera is blocked for this site. Allow it from the camera icon in your browser's address bar, then try again."
              : "We need your camera to scan the office QR code."}
        </p>
      </div>

      {!unavailable && (
        <div className="flex w-full flex-col gap-2">
          {blocked && isNative ? (
            <>
              <button
                onClick={() => openAppSettings()}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-bold text-primary-700"
              >
                <Settings className="h-4 w-4" /> Open Settings
              </button>
              <button onClick={onRetry} className="w-full rounded-2xl px-4 py-2.5 text-sm font-semibold text-slate-300 hover:bg-white/10">
                I've allowed it
              </button>
            </>
          ) : (
            <button
              onClick={onRetry}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-bold text-primary-700"
            >
              <Camera className="h-4 w-4" /> {blocked ? "Try again" : "Allow camera"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

/** Full-screen dark layout wrapping the scanner. */
export function ScanLayout({
  title,
  subtitle,
  onBack,
  children,
}: {
  title: string;
  subtitle?: ReactNode;
  onBack: () => void;
  children: ReactNode;
}) {
  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-slate-950 text-white pt-safe pb-safe">
      <div className="pointer-events-none absolute -top-32 left-1/2 h-80 w-[40rem] -translate-x-1/2 rounded-full bg-primary/30 blur-3xl" />
      <div className="relative flex items-center gap-3 px-4 py-4">
        <button
          onClick={onBack}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 transition hover:bg-white/20"
          aria-label="Back"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
      </div>
      <div className="relative flex flex-1 flex-col items-center justify-center gap-8 px-6 pb-16">
        <div className="text-center">
          <h1 className="text-2xl font-extrabold">{title}</h1>
          {subtitle && <p className="mt-1.5 text-sm text-slate-400">{subtitle}</p>}
        </div>
        {children}
        <p className="text-xs font-medium text-slate-500">Hold steady — it scans automatically</p>
      </div>
    </div>
  );
}
