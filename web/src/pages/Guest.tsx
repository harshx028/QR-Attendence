import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Capacitor } from "@capacitor/core";
import { ArrowLeft, Phone, ScanLine, UserRound } from "lucide-react";
import AuthLayout from "../components/AuthLayout";
import { Button } from "../components/ui";

const isNative = Capacitor.isNativePlatform();
const BACKEND_GUEST_FORM = "https://attendence.durga-foundation.org/attendance/entry";

export default function Guest() {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [errors, setErrors] = useState<{ fullName?: string; phone?: string }>({});

  const validate = () => {
    const e: typeof errors = {};
    if (!fullName.trim()) e.fullName = "Name is required";
    if (!phone.trim()) e.phone = "Phone number is required";
    else if (!/^\d{10}$/.test(phone.trim())) e.phone = "Enter a valid 10-digit phone number";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleProceed = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    if (isNative) {
      navigate("/guest/scan", { state: { guestName: fullName.trim(), guestPhone: phone.trim() } });
    } else {
      window.location.href = BACKEND_GUEST_FORM;
    }
  };

  return (
    <AuthLayout title="Guest check-in" subtitle="Tell us who you are, then scan the office QR code.">
      <form onSubmit={handleProceed} className="space-y-4">
        <div>
          <label className="label">Full name</label>
          <div className="relative">
            <UserRound className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Your full name"
              className="input input-icon"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
          </div>
          {errors.fullName && <p className="mt-1.5 text-xs font-medium text-error">{errors.fullName}</p>}
        </div>

        <div>
          <label className="label">Phone number</label>
          <div className="relative">
            <Phone className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
            <input
              type="tel"
              inputMode="numeric"
              placeholder="10-digit mobile number"
              maxLength={10}
              className="input input-icon"
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
            />
          </div>
          {errors.phone && <p className="mt-1.5 text-xs font-medium text-error">{errors.phone}</p>}
        </div>

        <Button type="submit" size="lg" icon={isNative ? ScanLine : undefined} className="w-full">
          {isNative ? "Proceed to scan QR" : "Go to check-in form"}
        </Button>
      </form>

      <Link
        to="/auth/login"
        className="mt-6 flex items-center justify-center gap-1.5 text-sm font-semibold text-on-surface-variant hover:text-on-surface"
      >
        <ArrowLeft className="h-4 w-4" /> Back to sign in
      </Link>
    </AuthLayout>
  );
}
