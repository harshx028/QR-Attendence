import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { AlertCircle, Mail, UserRound } from "lucide-react";
import useAuth from "../../hooks/useAuth";
import AuthLayout from "../../components/AuthLayout";
import PasswordInput from "../../components/PasswordInput";
import { Button } from "../../components/ui";

type SignupCreds = { fullName: string; email: string; password: string };

export default function Signup() {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const { register, handleSubmit, formState: { errors } } = useForm<SignupCreds>();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onSubmit = async (data: SignupCreds) => {
    setErrorMsg(null);
    setIsSubmitting(true);
    try {
      const res = await signup(data);
      if (res.success) navigate("/", { replace: true });
      else setErrorMsg(res.message);
    } catch {
      setErrorMsg("An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthLayout title="Create your account" subtitle="Get started with your company account.">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="label">Full name</label>
          <div className="relative">
            <UserRound className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              autoComplete="name"
              placeholder="e.g. Harsh Mishra"
              className="input input-icon"
              {...register("fullName", { required: "Full name is required" })}
            />
          </div>
          {errors.fullName && <p className="mt-1.5 text-xs font-medium text-error">{errors.fullName.message}</p>}
        </div>

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
            autoComplete="new-password"
            placeholder="At least 6 characters"
            {...register("password", {
              required: "Password is required",
              minLength: { value: 6, message: "Password must be at least 6 characters" },
            })}
          />
          {errors.password && <p className="mt-1.5 text-xs font-medium text-error">{errors.password.message}</p>}
        </div>

        {errorMsg && (
          <div className="flex items-center gap-2 rounded-xl bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
            <AlertCircle className="h-4 w-4 flex-shrink-0" /> {errorMsg}
          </div>
        )}

        <Button type="submit" size="lg" loading={isSubmitting} className="w-full">
          Create account
        </Button>
      </form>

      <p className="mt-8 text-center text-sm text-on-surface-variant">
        Already have an account?{" "}
        <Link to="/auth/login" className="font-bold text-primary hover:underline">
          Sign in
        </Link>
      </p>
    </AuthLayout>
  );
}
