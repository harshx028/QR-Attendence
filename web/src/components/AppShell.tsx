import { ReactNode } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { CalendarDays, Home, LogOut, Users } from "lucide-react";
import useAuth from "../hooks/useAuth";
import { Avatar, cx } from "./ui";

type NavItem = { to: string; label: string; icon: typeof Home; adminOnly?: boolean };

const NAV: NavItem[] = [
  { to: "/", label: "Home", icon: Home },
  { to: "/attendence/history", label: "My Attendance", icon: CalendarDays },
  { to: "/attendence/all", label: "Team", icon: Users, adminOnly: true },
];

export default function AppShell({
  title,
  subtitle,
  actions,
  children,
}: {
  title?: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const items = NAV.filter((n) => !n.adminOnly || user?.role === "ADMIN");

  const handleLogout = async () => {
    if (!confirm("Are you sure you want to sign out?")) return;
    await logout();
    navigate("/auth/login", { replace: true });
  };

  return (
    <div className="min-h-screen bg-canvas">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-slate-200/70 bg-white px-4 py-6 lg:flex">
        <div className="flex items-center gap-3 px-2">
          <img src="/logo.png" alt="" className="h-10 w-10 rounded-xl" />
          <div>
            <p className="text-sm font-extrabold leading-tight text-on-surface">Mark Attendance</p>
            <p className="text-xs text-on-surface-variant">Durga Foundation</p>
          </div>
        </div>

        <nav className="mt-8 flex flex-1 flex-col gap-1">
          {items.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end
              className={({ isActive }) =>
                cx(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition",
                  isActive
                    ? "bg-primary-50 text-primary-700"
                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
                )
              }
            >
              <Icon className="h-5 w-5" />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-3 rounded-2xl bg-slate-50 p-3">
          <Avatar name={user?.fullName} className="h-10 w-10 text-sm" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold text-on-surface">{user?.fullName}</p>
            <p className="truncate text-xs text-on-surface-variant">{user?.email}</p>
          </div>
          <button
            onClick={handleLogout}
            title="Sign out"
            className="rounded-lg p-2 text-slate-400 transition hover:bg-white hover:text-rose-600"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </aside>

      {/* Mobile top bar */}
      <header className="sticky top-0 z-20 border-b border-slate-200/60 bg-canvas/85 backdrop-blur pt-safe lg:hidden">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2.5">
            <img src="/logo.png" alt="" className="h-8 w-8 rounded-lg" />
            <p className="text-base font-extrabold text-on-surface">{title || "Mark Attendance"}</p>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 rounded-full py-1 pl-1 pr-3 text-xs font-semibold text-slate-500 transition hover:bg-white"
          >
            <Avatar name={user?.fullName} className="h-8 w-8 text-xs" />
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </header>

      <main className="pb-28 lg:pb-12 lg:pl-64">
        <div className="mx-auto max-w-5xl px-4 pt-5 sm:px-6 lg:px-10 lg:pt-10">
          {(title || actions) && (
            <div className="mb-6 hidden items-end justify-between gap-4 lg:flex">
              <div>
                <h1 className="text-3xl font-extrabold tracking-tight text-on-surface">{title}</h1>
                {subtitle && <p className="mt-1 text-sm text-on-surface-variant">{subtitle}</p>}
              </div>
              {actions}
            </div>
          )}
          {children}
        </div>
      </main>

      {/* Mobile bottom nav */}
      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200/70 bg-white/95 backdrop-blur pb-safe lg:hidden">
        <div className="mx-auto flex max-w-md justify-around px-2">
          {items.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end
              className={({ isActive }) =>
                cx(
                  "flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] font-bold transition",
                  isActive ? "text-primary" : "text-slate-400"
                )
              }
            >
              {({ isActive }) => (
                <>
                  <span
                    className={cx(
                      "flex h-8 w-14 items-center justify-center rounded-full transition",
                      isActive && "bg-primary-50"
                    )}
                  >
                    <Icon className="h-5 w-5" strokeWidth={isActive ? 2.5 : 2} />
                  </span>
                  {label}
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}
