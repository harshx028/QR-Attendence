import { ReactNode } from "react";
import { CalendarCheck2, MapPin, QrCode } from "lucide-react";

const FEATURES = [
  { icon: QrCode, title: "Scan & go", text: "Check in and out with a single QR scan." },
  { icon: CalendarCheck2, title: "Your history", text: "See every present and absent day at a glance." },
  { icon: MapPin, title: "Location aware", text: "Each scan is verified with your location." },
];

export default function AuthLayout({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-white">
      {/* Brand panel (desktop) */}
      <div className="hero-gradient relative hidden w-[46%] flex-col justify-between overflow-hidden p-12 text-white lg:flex">
        <div className="pointer-events-none absolute -right-24 top-24 h-80 w-80 rounded-full bg-white/10" />
        <div className="pointer-events-none absolute -bottom-32 -left-16 h-96 w-96 rounded-full bg-white/5" />
        <div className="relative flex items-center gap-3">
          <img src="/logo.svg" alt="" className="h-11 w-11 rounded-xl shadow-lg ring-2 ring-white/40" />
          <p className="text-lg font-extrabold">Mark Attendance</p>
        </div>
        <div className="relative">
          <h2 className="max-w-md text-4xl font-extrabold leading-tight">
            Attendance that takes one second, not one minute.
          </h2>
          <div className="mt-10 space-y-5">
            {FEATURES.map(({ icon: Icon, title, text }) => (
              <div key={title} className="flex items-start gap-4">
                <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl bg-white/15 backdrop-blur">
                  <Icon className="h-5 w-5" />
                </span>
                <div>
                  <p className="font-bold">{title}</p>
                  <p className="text-sm text-white/75">{text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        <p className="relative text-xs text-white/60">© {new Date().getFullYear()} Durga Foundation</p>
      </div>

      {/* Form side */}
      <div className="flex flex-1 flex-col">
        {/* Mobile brand header */}
        <div className="hero-gradient relative overflow-hidden px-6 pb-20 pt-safe text-white lg:hidden">
          <div className="pointer-events-none absolute -right-12 -top-10 h-44 w-44 rounded-full bg-white/10" />
          <div className="relative flex flex-col items-center pt-10">
            <img src="/logo.svg" alt="" className="h-16 w-16 rounded-2xl shadow-xl ring-4 ring-white/25" />
            <p className="mt-3 text-lg font-extrabold">Mark Attendance</p>
            <p className="text-xs text-white/75">Simplify your workday</p>
          </div>
          {/* Curved bottom edge */}
          <svg
            className="pointer-events-none absolute inset-x-0 -bottom-px h-16 w-full"
            viewBox="0 0 400 64"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <path d="M0 30 C 70 62 150 64 220 38 C 290 12 350 6 400 22 V64 H0 Z" fill="#fff" />
          </svg>
        </div>

        <div className="flex flex-1 items-start justify-center bg-white px-6 pb-10 pt-4 lg:items-center lg:pt-8">
          <div className="w-full max-w-sm animate-fade-up">
            <h1 className="text-2xl font-extrabold tracking-tight text-on-surface sm:text-3xl">{title}</h1>
            <p className="mb-7 mt-1 text-sm text-on-surface-variant">{subtitle}</p>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
