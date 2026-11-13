import { ReactNode, useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { ArrowLeft, CameraOff } from "lucide-react";

interface QrScannerProps {
  onScan: (data: string) => void;
}

export default function QrScanner({ onScan }: QrScannerProps) {
  const scannedRef = useRef(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
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
  }, [onScan]);

  return (
    <div className="relative mx-auto aspect-square w-full max-w-[18rem]">
      <div id="qr-reader" className="h-full w-full overflow-hidden rounded-[2rem] bg-slate-900" />

      {failed ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-[2rem] bg-slate-900 p-6 text-center">
          <CameraOff className="h-10 w-10 text-slate-500" />
          <p className="text-sm font-semibold text-slate-300">Camera unavailable</p>
          <p className="text-xs text-slate-500">Allow camera permission for this app and try again.</p>
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
