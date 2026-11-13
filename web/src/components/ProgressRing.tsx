export default function ProgressRing({
  value,
  size = 96,
  stroke = 10,
  light = false,
}: {
  value: number;
  size?: number;
  stroke?: number;
  light?: boolean;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={stroke}
          className={light ? "stroke-white/20" : "stroke-slate-100"}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c - (pct / 100) * c}
          className={light ? "stroke-white" : "stroke-primary"}
          style={{ transition: "stroke-dashoffset 0.8s ease" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`text-xl font-extrabold leading-none ${light ? "text-white" : "text-on-surface"}`}>
          {pct}%
        </span>
        <span className={`mt-0.5 text-[10px] font-semibold uppercase ${light ? "text-white/70" : "text-slate-400"}`}>
          present
        </span>
      </div>
    </div>
  );
}
