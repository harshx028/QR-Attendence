import { useNavigate, useRouteError } from "react-router-dom";
import { Home, RotateCw, TriangleAlert } from "lucide-react";
import { Button, CenteredCard, StatusIcon } from "./ui";

/** Shown instead of React Router's developer error page when a screen crashes. */
export default function RouteError() {
  const error = useRouteError() as any;
  const navigate = useNavigate();
  const detail = error?.message || error?.statusText || String(error ?? "");
  console.error("Route error:", error);

  return (
    <CenteredCard>
      <div className="flex flex-col items-center gap-4 text-center">
        <StatusIcon icon={TriangleAlert} tone="amber" />
        <div>
          <h1 className="text-2xl font-extrabold text-on-surface">Something went wrong</h1>
          <p className="mt-1 text-sm text-on-surface-variant">
            This screen ran into a problem. Your attendance data is safe.
          </p>
        </div>
        {detail && (
          <p className="w-full break-words rounded-xl bg-slate-50 px-3 py-2 font-mono text-xs text-slate-500">
            {detail}
          </p>
        )}
        <Button size="lg" icon={Home} className="mt-2 w-full" onClick={() => navigate("/", { replace: true })}>
          Go to home
        </Button>
        <Button variant="ghost" icon={RotateCw} onClick={() => window.location.reload()}>
          Reload app
        </Button>
      </div>
    </CenteredCard>
  );
}
