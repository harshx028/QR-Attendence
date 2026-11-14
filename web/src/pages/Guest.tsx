import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Capacitor } from "@capacitor/core";
import { useForm } from "react-hook-form";
import { AlertCircle, ArrowLeft, CheckCircle2, Mail, MapPin, Phone, ScanLine, UserRound } from "lucide-react";
import AuthLayout from "../components/AuthLayout";
import { Button, StatusIcon } from "../components/ui";
import { submitGuestEntry, GuestEntry } from "../api/attendance.api";

const isNative = Capacitor.isNativePlatform();

const PURPOSES = [
  "Attending Event / Programme",
  "Meeting / Appointment",
  "Training / Workshop",
  "Volunteering",
  "Enquiry",
  "Donation / Support",
  "Other",
];

export default function Guest() {
  return isNative ? <GuestScanStart /> : <GuestEntryForm />;
}

function BackToLogin() {
  return (
    <Link
      to="/auth/login"
      className="mt-6 flex items-center justify-center gap-1.5 text-sm font-semibold text-on-surface-variant hover:text-on-surface"
    >
      <ArrowLeft className="h-4 w-4" /> Back to sign in
    </Link>
  );
}

function Field({ label, error, required, children }: { label: string; error?: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="label">
        {label} {required && <span className="text-rose-500">*</span>}
      </label>
      {children}
      {error && <p className="mt-1.5 text-xs font-medium text-error">{error}</p>}
    </div>
  );
}

const iconCls = "pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400";

/** Mobile app: collect name + phone, then scan the kiosk QR. */
function GuestScanStart() {
  const navigate = useNavigate();
  const { register, handleSubmit, setValue, formState: { errors } } = useForm<{ fullName: string; phone: string }>();

  const onSubmit = (d: { fullName: string; phone: string }) =>
    navigate("/guest/scan", { state: { guestName: d.fullName.trim(), guestPhone: d.phone.trim() } });

  return (
    <AuthLayout title="Guest check-in" subtitle="Tell us who you are, then scan the office QR code.">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Field label="Full name" error={errors.fullName?.message}>
          <div className="relative">
            <UserRound className={iconCls} />
            <input className="input input-icon" placeholder="Your full name" {...register("fullName", { required: "Name is required", validate: (v) => !!v.trim() || "Name is required" })} />
          </div>
        </Field>
        <Field label="Phone number" error={errors.phone?.message}>
          <div className="relative">
            <Phone className={iconCls} />
            <input
              type="tel"
              inputMode="numeric"
              maxLength={10}
              className="input input-icon"
              placeholder="10-digit mobile number"
              {...register("phone", {
                required: "Phone number is required",
                pattern: { value: /^\d{10}$/, message: "Enter a valid 10-digit phone number" },
                onChange: (e) => setValue("phone", e.target.value.replace(/\D/g, "")),
              })}
            />
          </div>
        </Field>
        <Button type="submit" size="lg" icon={ScanLine} className="w-full">
          Proceed to scan QR
        </Button>
      </form>
      <BackToLogin />
    </AuthLayout>
  );
}

/** Website: full visitor form, saved directly (no QR scan). */
function GuestEntryForm() {
  const { register, handleSubmit, setValue, reset, formState: { errors, isSubmitting } } = useForm<GuestEntry>();
  const [errorMsg, setErrorMsg] = useState("");
  const [doneName, setDoneName] = useState<string | null>(null);

  const onSubmit = async (data: GuestEntry) => {
    setErrorMsg("");
    const res = await submitGuestEntry(data);
    if (res.success) {
      setDoneName(data.fullName.trim());
      reset();
    } else {
      setErrorMsg(res.message || "Couldn't save your entry. Please try again.");
    }
  };

  if (doneName) {
    return (
      <AuthLayout title="You're all set" subtitle="Thanks for visiting Durga Foundation.">
        <div className="flex flex-col items-center gap-4 rounded-3xl bg-emerald-50/60 p-8 text-center">
          <StatusIcon icon={CheckCircle2} tone="green" />
          <p className="text-lg font-extrabold text-on-surface">Welcome, {doneName}!</p>
          <p className="text-sm text-on-surface-variant">Your visit has been recorded.</p>
        </div>
        <Button variant="outline" size="lg" className="mt-6 w-full" onClick={() => setDoneName(null)}>
          Add another visitor
        </Button>
        <BackToLogin />
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Guest entry" subtitle="Fill in your details to register your visit.">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Field label="Full name" required error={errors.fullName?.message}>
          <div className="relative">
            <UserRound className={iconCls} />
            <input className="input input-icon" placeholder="e.g. Ramesh Kumar" autoComplete="name" {...register("fullName", { required: "Name is required", validate: (v) => !!v.trim() || "Name is required" })} />
          </div>
        </Field>

        <Field label="Phone number" required error={errors.phone?.message}>
          <div className="relative">
            <Phone className={iconCls} />
            <input
              type="tel"
              inputMode="numeric"
              maxLength={10}
              autoComplete="tel"
              className="input input-icon"
              placeholder="10-digit mobile number"
              {...register("phone", {
                required: "Phone number is required",
                pattern: { value: /^\d{10}$/, message: "Enter a valid 10-digit phone number" },
                onChange: (e) => setValue("phone", e.target.value.replace(/\D/g, "")),
              })}
            />
          </div>
        </Field>

        <Field label="Email address" error={errors.email?.message}>
          <div className="relative">
            <Mail className={iconCls} />
            <input
              type="email"
              autoComplete="email"
              className="input input-icon"
              placeholder="e.g. ramesh@example.com"
              {...register("email", { pattern: { value: /^$|\S+@\S+\.\S+/, message: "Invalid email" } })}
            />
          </div>
        </Field>

        <Field label="Address">
          <div className="relative">
            <MapPin className="pointer-events-none absolute left-4 top-3.5 h-5 w-5 text-slate-400" />
            <textarea rows={2} className="input input-icon resize-none" placeholder="House no., street, city, PIN" {...register("address")} />
          </div>
        </Field>

        <Field label="Purpose of visit" required error={errors.purpose?.message}>
          <select className="input" defaultValue="" {...register("purpose", { required: "Please choose a purpose" })}>
            <option value="" disabled>
              Select purpose
            </option>
            {PURPOSES.map((p) => (
              <option key={p}>{p}</option>
            ))}
          </select>
        </Field>

        <Field label="Remarks">
          <textarea rows={2} className="input resize-none" placeholder="Anything else we should know?" {...register("remarks")} />
        </Field>

        {errorMsg && (
          <div className="flex items-center gap-2 rounded-xl bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
            <AlertCircle className="h-4 w-4 flex-shrink-0" /> {errorMsg}
          </div>
        )}

        <Button type="submit" size="lg" loading={isSubmitting} className="w-full">
          Submit
        </Button>
      </form>
      <BackToLogin />
    </AuthLayout>
  );
}
