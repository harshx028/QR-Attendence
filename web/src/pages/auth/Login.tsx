import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import useAuth from "../../hooks/useAuth";

type LoginCreds = { email: string; password: string };

export default function Login() {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { register, handleSubmit, formState: { errors } } = useForm<LoginCreds>();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (isAuthenticated) {
    navigate("/", { replace: true });
    return null;
  }

  const onSubmit = async (data: LoginCreds) => {
    setErrorMsg(null);
    setIsSubmitting(true);
    try {
      const res = await login(data);
      if (res.success) {
        navigate("/", { replace: true });
      } else {
        setErrorMsg(res.message);
      }
    } catch {
      setErrorMsg("An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <img src="/logo.png" alt="Logo" className="w-20 h-20 mb-2" />
          <p className="text-sm text-on-surface-variant font-medium">Simplify your workday</p>
        </div>

        <h1 className="text-2xl font-extrabold text-on-surface mb-1">Sign In</h1>
        <p className="text-sm text-on-surface-variant mb-6">Welcome back! Please enter your details.</p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-on-surface mb-1">Email address</label>
            <input
              type="email"
              autoComplete="email"
              placeholder="yourname@company.com"
              className="w-full border border-outline rounded-lg px-4 py-3 text-on-surface text-base focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              {...register("email", {
                required: "Email is required",
                pattern: { value: /\S+@\S+\.\S+/, message: "Invalid email format" },
              })}
            />
            {errors.email && <p className="text-error text-xs mt-1">{errors.email.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-semibold text-on-surface mb-1">Password</label>
            <input
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              className="w-full border border-outline rounded-lg px-4 py-3 text-on-surface text-base focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              {...register("password", { required: "Password is required" })}
            />
            {errors.password && <p className="text-error text-xs mt-1">{errors.password.message}</p>}
          </div>

          {errorMsg && (
            <p className="text-error text-sm text-center font-semibold">{errorMsg}</p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-primary text-white font-bold text-base py-3 rounded-lg hover:bg-indigo-700 transition disabled:opacity-70 flex items-center justify-center"
          >
            {isSubmitting ? (
              <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              "Sign In"
            )}
          </button>
        </form>

        <Link
          to="/guest"
          className="mt-3 w-full border border-outline text-on-surface-variant font-semibold text-sm py-3 rounded-lg hover:bg-gray-50 transition flex items-center justify-center"
        >
          Continue without login
        </Link>

        <p className="text-center text-sm text-on-surface-variant mt-8">
          New to the platform?{" "}
          <Link to="/auth/signup" className="text-primary font-bold">
            Create account
          </Link>
        </p>
      </div>
    </div>
  );
}
