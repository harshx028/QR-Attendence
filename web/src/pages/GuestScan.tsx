import { useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import QrScanner, { ScanLayout } from "../components/QrScanner";

export default function GuestScan() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const guestName: string = state?.guestName ?? "";
  const guestPhone: string = state?.guestPhone ?? "";

  const handleScan = useCallback(
    (data: string) =>
      navigate("/guest/confirm", { state: { token: data, guestName, guestPhone }, replace: true }),
    [navigate, guestName, guestPhone]
  );

  return (
    <ScanLayout
      title="Scan office QR"
      subtitle={
        <>
          Checking in as <span className="font-semibold text-white">{guestName}</span>
        </>
      }
      onBack={() => navigate("/guest")}
    >
      <QrScanner onScan={handleScan} />
    </ScanLayout>
  );
}
