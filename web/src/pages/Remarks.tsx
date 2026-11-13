import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, MessageSquareText, ScanLine } from "lucide-react";
import { Button, CenteredCard, StatusIcon, cx } from "../components/ui";

const QUICK = ["Traffic delay", "Doctor's appointment", "Field visit", "Working from site"];

export default function Remarks() {
  const navigate = useNavigate();
  const [remarks, setRemarks] = useState("");

  const proceed = (skip = false) => {
    navigate("/scan_qr", { state: { remarks: skip ? "" : remarks.trim() } });
  };

  return (
    <CenteredCard>
      <button
        onClick={() => navigate(-1)}
        className="absolute left-4 top-4 flex h-9 w-9 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
        aria-label="Back"
      >
        <ArrowLeft className="h-5 w-5" />
      </button>
      <div className="flex flex-col items-center gap-4 text-center">
        <StatusIcon icon={MessageSquareText} tone="amber" />
        <div>
          <h1 className="text-2xl font-extrabold text-on-surface">Add a remark?</h1>
          <p className="mt-1 text-sm text-on-surface-variant">
            Running late or have something to note? It's optional.
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-2">
          {QUICK.map((q) => (
            <button
              key={q}
              type="button"
              onClick={() => setRemarks(q)}
              className={cx(
                "rounded-full border px-3 py-1.5 text-xs font-semibold transition",
                remarks === q
                  ? "border-primary bg-primary-50 text-primary-700"
                  : "border-slate-200 text-slate-600 hover:border-slate-300"
              )}
            >
              {q}
            </button>
          ))}
        </div>

        <textarea
          className="input resize-none text-sm"
          placeholder="Write a remark…"
          rows={3}
          value={remarks}
          onChange={(e) => setRemarks(e.target.value)}
        />

        <Button size="lg" icon={ScanLine} className="w-full" onClick={() => proceed(false)}>
          {remarks.trim() ? "Save & scan QR" : "Scan QR"}
        </Button>
        {remarks.trim() && (
          <Button variant="ghost" onClick={() => proceed(true)}>
            Skip remark
          </Button>
        )}
      </div>
    </CenteredCard>
  );
}
