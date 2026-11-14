import { createBrowserRouter, RouterProvider, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import RouteError from "./components/RouteError";
import Login from "./pages/auth/Login";
import Signup from "./pages/auth/Signup";
import Dashboard from "./pages/Dashboard";
import Remarks from "./pages/Remarks";
import ScanQr from "./pages/ScanQr";
import MarkAttendance from "./pages/MarkAttendance";
import Guest from "./pages/Guest";
import GuestScan from "./pages/GuestScan";
import GuestConfirm from "./pages/GuestConfirm";
import AdminAttendance from "./pages/AdminAttendance";
import MyAttendance from "./pages/MyAttendance";
import KioskDisplay from "./pages/KioskDisplay";

const router = createBrowserRouter([
  {
    // Any crash inside a page shows RouteError instead of the dev error screen.
    errorElement: <RouteError />,
    children: [
      {
        path: "/",
        element: (
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        ),
      },
      { path: "/auth/login", element: <Login /> },
      { path: "/auth/signup", element: <Signup /> },
      {
        path: "/attendence/remarks",
        element: (
          <ProtectedRoute>
            <Remarks />
          </ProtectedRoute>
        ),
      },
      {
        path: "/scan_qr",
        element: (
          <ProtectedRoute>
            <ScanQr />
          </ProtectedRoute>
        ),
      },
      {
        path: "/attendence/mark",
        element: (
          <ProtectedRoute>
            <MarkAttendance />
          </ProtectedRoute>
        ),
      },
      {
        path: "/attendence/history",
        element: (
          <ProtectedRoute>
            <MyAttendance />
          </ProtectedRoute>
        ),
      },
      {
        path: "/kiosk",
        element: (
          <ProtectedRoute roles={["QR_KIOSK", "ADMIN"]}>
            <KioskDisplay />
          </ProtectedRoute>
        ),
      },
      {
        path: "/attendence/all",
        element: (
          <ProtectedRoute roles={["ADMIN"]}>
            <AdminAttendance />
          </ProtectedRoute>
        ),
      },
      { path: "/guest", element: <Guest /> },
      { path: "/guest/scan", element: <GuestScan /> },
      { path: "/guest/confirm", element: <GuestConfirm /> },
      { path: "*", element: <Navigate to="/" replace /> },
    ],
  },
]);

export default function App() {
  return (
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  );
}
