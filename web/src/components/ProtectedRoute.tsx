import { Navigate, useLocation } from "react-router-dom";
import useAuth from "../hooks/useAuth";
import { Spinner } from "./ui";

type Role = "USER" | "ADMIN" | "QR_KIOSK";

/**
 * Requires a signed-in user. `roles` limits the page to those roles.
 * Kiosk display accounts are always sent to /kiosk — they have no other pages.
 */
export default function ProtectedRoute({ children, roles }: { children: React.ReactNode; roles?: Role[] }) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const { pathname } = useLocation();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  if (!isAuthenticated) return <Navigate to="/auth/login" replace />;
  if (user?.role === "QR_KIOSK" && pathname !== "/kiosk") return <Navigate to="/kiosk" replace />;
  if (roles && user && !roles.includes(user.role)) return <Navigate to="/" replace />;
  return <>{children}</>;
}
