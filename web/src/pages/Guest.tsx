import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Capacitor } from "@capacitor/core";

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

  const handleProceed = () => {
    if (!validate()) return;
    if (isNative) {
      navigate("/guest/scan", {
        state: { guestName: fullName.trim(), guestPhone: phone.trim() },
      });
    } else {
      window.location.href = BACKEND_GUEST_FORM;
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <img src="/logo.png" alt="Logo" className="w-20 h-20 mb-2" />
          <p className="text-sm text-on-surface-variant font-medium">Guest check-in</p>
        </div>

        <h1 className="text-xl font-black text-on-surface mb-1">Enter your details</h1>
        <p className="text-sm text-on-surface-variant mb-6">
          Please provide your name and phone number to proceed.
        </p>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-on-surface mb-1">Full Name</label>
            <input
              type="text"
              placeholder="Your full name"
              className="w-full border border-outline rounded-lg px-4 py-3 text-on-surface text-base focus:outline-none focus:ring-2 focus:ring-primary"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
            {errors.fullName && <p className="text-error text-xs mt-1">{errors.fullName}</p>}
          </div>

          <div>
            <label className="block text-sm font-semibold text-on-surface mb-1">Phone Number</label>
            <input
              type="tel"
              placeholder="10-digit mobile number"
              maxLength={10}
              className="w-full border border-outline rounded-lg px-4 py-3 text-on-surface text-base focus:outline-none focus:ring-2 focus:ring-primary"
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
            />
            {errors.phone && <p className="text-error text-xs mt-1">{errors.phone}</p>}
          </div>

          <button
            onClick={handleProceed}
            className="w-full bg-primary text-white font-bold py-3 rounded-full hover:bg-indigo-700 transition"
          >
            {isNative ? "Proceed to Scan QR" : "Go to Check-in Form"}
          </button>

          <Link
            to="/auth/login"
            className="block text-center text-sm text-on-surface-variant font-semibold hover:text-on-surface"
          >
            Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
}
