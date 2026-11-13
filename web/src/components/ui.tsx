import { ButtonHTMLAttributes, ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

export function cx(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

export function Spinner({ className = "w-6 h-6", light = false }: { className?: string; light?: boolean }) {
  return (
    <span
      className={cx(
        "inline-block rounded-full border-[3px] animate-spin",
        light ? "border-white/40 border-t-white" : "border-primary/20 border-t-primary",
        className
      )}
    />
  );
}

type Variant = "primary" | "danger" | "success" | "outline" | "ghost" | "white";

const variants: Record<Variant, string> = {
  primary: "bg-primary text-white hover:bg-primary-700 shadow-lift",
  danger: "bg-rose-600 text-white hover:bg-rose-700 shadow-[0_10px_30px_-10px_rgba(225,29,72,0.5)]",
  success: "bg-emerald-600 text-white hover:bg-emerald-700 shadow-[0_10px_30px_-10px_rgba(5,150,105,0.5)]",
  outline: "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-300",
  ghost: "text-slate-600 hover:bg-slate-100",
  white: "bg-white text-primary-700 hover:bg-primary-50 shadow-lg",
};

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  loading?: boolean;
  icon?: LucideIcon;
  size?: "md" | "lg";
};

export function Button({
  variant = "primary",
  loading,
  icon: Icon,
  size = "md",
  className,
  children,
  disabled,
  ...rest
}: ButtonProps) {
  return (
    <button
      disabled={disabled || loading}
      className={cx(
        "inline-flex items-center justify-center gap-2 rounded-2xl font-bold transition active:scale-[0.98] disabled:opacity-60 disabled:active:scale-100",
        size === "lg" ? "px-6 py-4 text-base" : "px-5 py-3 text-sm",
        variants[variant],
        className
      )}
      {...rest}
    >
      {loading ? (
        <Spinner className="w-5 h-5" light={variant !== "outline" && variant !== "ghost" && variant !== "white"} />
      ) : (
        <>
          {Icon && <Icon className="w-5 h-5" strokeWidth={2.25} />}
          {children}
        </>
      )}
    </button>
  );
}

type Tone = "green" | "red" | "amber" | "slate" | "indigo";
const tones: Record<Tone, string> = {
  green: "bg-emerald-50 text-emerald-700 ring-emerald-600/15",
  red: "bg-rose-50 text-rose-700 ring-rose-600/15",
  amber: "bg-amber-50 text-amber-700 ring-amber-600/20",
  slate: "bg-slate-100 text-slate-600 ring-slate-500/10",
  indigo: "bg-primary-50 text-primary-700 ring-primary-600/15",
};

export function Badge({ tone = "slate", children, className }: { tone?: Tone; children: ReactNode; className?: string }) {
  return (
    <span
      className={cx(
        "inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-bold ring-1 ring-inset",
        tones[tone],
        className
      )}
    >
      {children}
    </span>
  );
}

export function Avatar({ name, className = "w-11 h-11 text-sm" }: { name?: string | null; className?: string }) {
  const initials =
    (name || "?")
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0])
      .join("")
      .toUpperCase() || "?";
  return (
    <div
      className={cx(
        "flex flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary-400 to-violet-600 font-bold text-white",
        className
      )}
    >
      {initials}
    </div>
  );
}

export function StatusIcon({
  icon: Icon,
  tone,
}: {
  icon: LucideIcon;
  tone: "green" | "red" | "amber" | "indigo";
}) {
  const ring = {
    green: "bg-emerald-100 text-emerald-600 ring-emerald-50",
    red: "bg-rose-100 text-rose-600 ring-rose-50",
    amber: "bg-amber-100 text-amber-600 ring-amber-50",
    indigo: "bg-primary-100 text-primary-600 ring-primary-50",
  }[tone];
  return (
    <div className={cx("flex h-20 w-20 items-center justify-center rounded-full ring-8 animate-pop", ring)}>
      <Icon className="h-9 w-9" strokeWidth={2.5} />
    </div>
  );
}

/** Centered single-card layout used by the scan-result / remark / guest pages. */
export function CenteredCard({ children }: { children: ReactNode }) {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-canvas px-4 py-10 pt-safe">
      <div className="pointer-events-none absolute -top-40 left-1/2 h-96 w-[48rem] -translate-x-1/2 rounded-full bg-primary-200/50 blur-3xl" />
      <div className="card relative w-full max-w-sm p-8 animate-fade-up">{children}</div>
    </div>
  );
}
