import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { AlertCircle, Mail, UserRound } from "lucide-react";
import useAuth from "../../hooks/useAuth";
import AuthLayout from "../../components/AuthLayout";
import PasswordInput from "../../components/PasswordInput";
import { Button } from "../../components/ui";

type LoginCreds = { email: string; password: string };

export default function Login() {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { register, handleSubmit, formState: { errors } } = useForm<LoginCreds>();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (isAuthenticated) return <Navigate to="/" replace />;

  const onSubmit = async (data: LoginCreds) => {
    setErrorMsg(null);
    setIsSubmitting(true);
    try {
      const res = await login(data);
      if (res.success) navigate("/", { replace: true });
      else setErrorMsg(res.message);
    } catch {
      setErrorMsg("An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthLayout title="Welcome back 👋" subtitle="Sign in to mark and track your attendance.">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="label">Email address</label>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
            <input
              type="email"
              autoComplete="email"
              placeholder="yourname@company.com"
              className="input input-icon"
              {...register("email", {
                required: "Email is required",
                pattern: { value: /\S+@\S+\.\S+/, message: "Invalid email format" },
              })}
            />
          </div>
          {errors.email && <p className="mt-1.5 text-xs font-medium text-error">{errors.email.message}</p>}
        </div>

        <div>
          <label className="label">Password</label>
          <PasswordInput
            autoComplete="current-password"
            placeholder="••••••••"
            {...register("password", { required: "Password is required" })}
          />
          {errors.password && <p className="mt-1.5 text-xs font-medium text-error">{errors.password.message}</p>}
        </div>

        {errorMsg && (
          <div className="flex items-center gap-2 rounded-xl bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
            <AlertCircle className="h-4 w-4 flex-shrink-0" /> {errorMsg}
          </div>
        )}

        <Button type="submit" size="lg" loading={isSubmitting} className="w-full">
          Sign in
        </Button>
      </form>

      <div className="my-6 flex items-center gap-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
        <span className="h-px flex-1 bg-slate-200" /> or <span className="h-px flex-1 bg-slate-200" />
      </div>

      <Link
        to="/guest"
        className="flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3.5 text-sm font-bold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
      >
        <UserRound className="h-5 w-5" /> Continue as guest
      </Link>

      <p className="mt-8 text-center text-sm text-on-surface-variant">
        New here?{" "}
        <Link to="/auth/signup" className="font-bold text-primary hover:underline">
          Create an account
        </Link>
      </p>
    </AuthLayout>
  );
}
