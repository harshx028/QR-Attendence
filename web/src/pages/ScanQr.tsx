import { useNavigate, useLocation } from "react-router-dom";
import QrScanner from "../components/QrScanner";

export default function ScanQr() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const remarks: string = state?.remarks ?? "";

  const handleScan = (data: string) => {
    navigate("/attendence/mark", { state: { token: data, remarks }, replace: true });
  };

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center gap-6 px-6">
      <QrScanner onScan={handleScan} />
      <button
        onClick={() => navigate(-1)}
        className="text-sm text-slate-400 font-semibold hover:text-white transition"
      >
        ← Back
      </button>
    </div>
  );
}
