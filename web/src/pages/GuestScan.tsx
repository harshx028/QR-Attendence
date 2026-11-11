import { useNavigate, useLocation } from "react-router-dom";
import QrScanner from "../components/QrScanner";

export default function GuestScan() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const guestName: string = state?.guestName ?? "";
  const guestPhone: string = state?.guestPhone ?? "";

  const handleScan = (data: string) => {
    navigate("/guest/confirm", {
      state: { token: data, guestName, guestPhone },
      replace: true,
    });
  };

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center gap-6 px-6">
      <p className="text-white font-bold text-base">{guestName}</p>
      <QrScanner onScan={handleScan} />
      <button
        onClick={() => navigate("/guest")}
        className="text-sm text-slate-400 font-semibold hover:text-white transition"
      >
        ← Back
      </button>
    </div>
  );
}
