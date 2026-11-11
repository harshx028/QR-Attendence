import { useEffect, useRef } from "react";
import { Html5Qrcode } from "html5-qrcode";

interface QrScannerProps {
  onScan: (data: string) => void;
}

export default function QrScanner({ onScan }: QrScannerProps) {
  const scannedRef = useRef(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);

  useEffect(() => {
    const scanner = new Html5Qrcode("qr-reader");
    scannerRef.current = scanner;

    scanner
      .start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decodedText) => {
          if (scannedRef.current) return;
          scannedRef.current = true;
          scanner.stop().catch(() => {});
          onScan(decodedText);
        },
        () => {}
      )
      .catch((err) => console.error("QR scanner start failed:", err));

    return () => {
      scanner.stop().catch(() => {});
    };
  }, [onScan]);

  return (
    <div className="flex flex-col items-center gap-4">
      <div
        id="qr-reader"
        className="w-72 h-72 rounded-2xl overflow-hidden border-2 border-outline"
      />
      <p className="text-sm text-on-surface-variant font-medium">
        Position the QR code within the frame
      </p>
    </div>
  );
}
