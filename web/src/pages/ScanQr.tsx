import { useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import QrScanner, { ScanLayout } from "../components/QrScanner";

export default function ScanQr() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const remarks: string = state?.remarks ?? "";

  const handleScan = useCallback(
    (data: string) => navigate("/attendence/mark", { state: { token: data, remarks }, replace: true }),
    [navigate, remarks]
  );

  return (
    <ScanLayout title="Scan office QR" subtitle="Point your camera at the QR code" onBack={() => navigate(-1)}>
      <QrScanner onScan={handleScan} />
    </ScanLayout>
  );
}
