import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Remarks() {
  const navigate = useNavigate();
  const [remarks, setRemarks] = useState("");

  const proceed = (skip = false) => {
    navigate("/scan_qr", { state: { remarks: skip ? "" : remarks.trim() } });
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4">
      <div className="w-full max-w-sm bg-white border border-outline rounded-3xl p-8 shadow-sm">
        <div className="flex flex-col items-center gap-4">
          <span className="bg-green-100 text-green-700 text-xs font-bold px-4 py-1 rounded-full tracking-widest">
            CHECK-IN
          </span>
          <h1 className="text-xl font-black text-on-surface text-center">Add a Remark</h1>
          <p className="text-sm text-on-surface-variant text-center">
            Running late or have something to note? Add an optional remark before scanning.
          </p>

          <div className="w-full">
            <label className="block text-sm font-semibold text-on-surface mb-1">
              Remark (optional)
            </label>
            <textarea
              className="w-full border border-outline rounded-lg px-4 py-3 text-on-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none"
              placeholder="e.g. Traffic delay, Doctor's appointment…"
              rows={4}
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
            />
          </div>

          <button
            onClick={() => proceed(false)}
            className="w-full bg-primary text-white font-bold py-3 rounded-full hover:bg-indigo-700 transition shadow-md"
          >
            Proceed to Scan
          </button>
          <button
            onClick={() => proceed(true)}
            className="text-sm text-on-surface-variant font-semibold hover:text-on-surface transition"
          >
            Skip — no remark
          </button>
          <button
            onClick={() => navigate(-1)}
            className="text-sm text-on-surface-variant font-medium hover:text-on-surface transition"
          >
            ← Back
          </button>
        </div>
      </div>
    </div>
  );
}
