import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import useAuth from "../../hooks/useAuth";

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
        <div className="flex flex-col items-center mb-8">
          <img src="/logo.png" alt="Logo" className="w-20 h-20 mb-2" />
          <p className="text-sm text-on-surface-variant font-medium">Join the modern workforce</p>
        </div>

        <h1 className="text-2xl font-extrabold text-on-surface mb-1">Create account</h1>
        <p className="text-sm text-on-surface-variant mb-6">Get started with your company account.</p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-on-surface mb-1">Full name</label>
            <input
              type="text"
              autoComplete="name"
              placeholder="e.g. Harsh Mishra"
              className="w-full border border-outline rounded-lg px-4 py-3 text-on-surface text-base focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              {...register("fullName", { required: "Full name is required" })}
            />
            {errors.fullName && <p className="text-error text-xs mt-1">{errors.fullName.message}</p>}
          </div>

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
              autoComplete="new-password"
              placeholder="••••••••"
              className="w-full border border-outline rounded-lg px-4 py-3 text-on-surface text-base focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              {...register("password", {
                required: "Password is required",
                minLength: { value: 6, message: "Password must be at least 6 characters" },
              })}
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
              "Create account"
            )}
          </button>
        </form>

        <p className="text-center text-sm text-on-surface-variant mt-8">
          Already have an account?{" "}
          <Link to="/auth/login" className="text-primary font-bold">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
