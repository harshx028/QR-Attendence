import { Request, Response, NextFunction } from "express";
import QRCode from "qrcode";
import jwt from "jsonwebtoken";
import argon2 from "argon2";
import prisma from "../services/prismaClient";

const JWT_SECRET = process.env.JWT_SECRET || "your_highly_secure_secret_key";
const COOKIE_NAME = "qr_session";
const COOKIE_MAX_AGE = 8 * 60 * 60 * 1000; // 8 hours

const baseStyle = `
  <style>
    *, *::before, *::after { box-sizing: border-box; }
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      min-height: 100vh; margin: 0; background: #F8FAFC; color: #0F172A;
    }
    .card {
      background: white; padding: 40px; border-radius: 32px;
      box-shadow: 0 20px 25px -5px rgba(0,0,0,.1), 0 10px 10px -5px rgba(0,0,0,.04);
      text-align: center; width: 100%; max-width: 420px;
    }
    h1 { margin: 0 0 8px; font-weight: 800; letter-spacing: -.5px; font-size: 1.6rem; }
    p  { color: #64748B; margin: 0 0 28px; }
    input {
      width: 100%; padding: 12px 16px; border: 1.5px solid #E2E8F0;
      border-radius: 12px; font-size: 15px; outline: none; margin-bottom: 12px;
      transition: border-color .2s;
    }
    input:focus { border-color: #4F46E5; }
    button {
      width: 100%; padding: 13px; background: #4F46E5; color: white;
      border: none; border-radius: 12px; font-size: 15px; font-weight: 600;
      cursor: pointer; transition: background .2s;
    }
    button:hover { background: #4338CA; }
    .error { color: #DC2626; background: #FEF2F2; border: 1px solid #FECACA;
      border-radius: 10px; padding: 10px 14px; margin-bottom: 16px; font-size: 14px; }
    .footer { font-size: 12px; color: #94A3B8; margin-top: 20px; }
  </style>
`;

export const showLoginPage = (req: Request, res: Response) => {
  const error = req.query.error ? decodeURIComponent(req.query.error as string) : null;
  res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>QR Kiosk — Login</title>
  ${baseStyle}
</head>
<body>
  <div class="card">
    <h1>QR Kiosk</h1>
    <p>Sign in to display the attendance QR code</p>
    ${error ? `<div class="error">${error}</div>` : ""}
    <form method="POST" action="/attendance/qr/login">
      <input type="email" name="email" placeholder="Email address" required autocomplete="email" />
      <input type="password" name="password" placeholder="Password" required autocomplete="current-password" />
      <button type="submit">Sign In</button>
    </form>
    <div class="footer">Durga Foundation · Attendance System</div>
  </div>
</body>
</html>`);
};

export const processLogin = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.redirect("/attendance/qr/login?error=Email+and+password+are+required");
  }

  try {
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user || !(await argon2.verify(user.password, password))) {
      return res.redirect(
        "/attendance/qr/login?error=" + encodeURIComponent("Invalid email or password")
      );
    }

    if (user.role !== "QR_KIOSK") {
      return res.redirect(
        "/attendance/qr/login?error=" + encodeURIComponent("This account is not authorised to access the QR kiosk")
      );
    }

    const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, {
      expiresIn: "8h",
    });

    res.cookie(COOKIE_NAME, token, {
      httpOnly: true,
      maxAge: COOKIE_MAX_AGE,
      sameSite: "lax",
    });

    res.redirect("/attendance/qr");
  } catch (error) {
    console.error("QR login error:", error);
    res.redirect(
      "/attendance/qr/login?error=" + encodeURIComponent("Something went wrong, please try again")
    );
  }
};

export const logoutKiosk = (req: Request, res: Response) => {
  res.clearCookie(COOKIE_NAME);
  res.redirect("/attendance/qr/login");
};

export const authenticateKiosk = (req: Request, res: Response, next: NextFunction) => {
  const token = (req as any).cookies?.[COOKIE_NAME];
  if (!token) return res.redirect("/attendance/qr/login");

  try {
    jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.clearCookie(COOKIE_NAME);
    res.redirect("/attendance/qr/login?error=" + encodeURIComponent("Session expired, please sign in again"));
  }
};

export const getQRData = async (req: Request, res: Response) => {
  try {
    const tokenRecord = await prisma.attendanceToken.findUnique({
      where: { name: "attendance token" },
    });
    if (!tokenRecord) {
      return res.status(404).json({ error: "Token not found" });
    }
    const qrDataUri = await QRCode.toDataURL(tokenRecord.value, {
      width: 360,
      margin: 2,
      color: { dark: "#4F46E5", light: "#FFFFFF" },
    });
    return res.json({
      token: tokenRecord.value,
      updatedAt: tokenRecord.updatedAt.toISOString(),
      qrDataUri,
    });
  } catch (error) {
    console.error("Error fetching QR data:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const showEntryPage = (req: Request, res: Response) => {
  const success = req.query.success === "1";
  const name = req.query.name ? decodeURIComponent(req.query.name as string) : "";
  const error = req.query.error ? decodeURIComponent(req.query.error as string) : null;

  res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Guest Entry — Durga Foundation</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      min-height: 100vh; margin: 0; background: #F8FAFC; color: #0F172A;
    }
    .page {
      display: flex; flex-direction: column; align-items: center;
      padding: 24px 16px 48px;
    }
    .header { text-align: center; margin-bottom: 20px; width: 100%; max-width: 500px; }
    .header .logo {
      font-size: 11px; font-weight: 700; letter-spacing: 1.5px;
      text-transform: uppercase; color: #4F46E5; margin-bottom: 4px;
    }
    .header h1 { margin: 0 0 4px; font-size: 1.5rem; font-weight: 800; letter-spacing: -.5px; }
    .header p { color: #64748B; margin: 0; font-size: 14px; }
    .card {
      background: white; padding: 24px; border-radius: 20px; width: 100%; max-width: 500px;
      box-shadow: 0 1px 3px rgba(0,0,0,.08), 0 4px 16px rgba(0,0,0,.06);
    }
    .success-banner {
      background: #F0FDF4; border: 1.5px solid #86EFAC; border-radius: 14px;
      padding: 20px; text-align: center;
    }
    .success-banner .icon { font-size: 2rem; margin-bottom: 6px; }
    .success-banner h2 { margin: 0 0 4px; font-size: 1rem; color: #15803D; }
    .success-banner p { margin: 0; color: #166534; font-size: 14px; }
    .error-banner {
      background: #FEF2F2; border: 1.5px solid #FECACA; border-radius: 10px;
      padding: 11px 14px; margin-bottom: 18px; color: #DC2626; font-size: 14px;
    }
    .section-label {
      font-size: 10px; font-weight: 700; letter-spacing: 1.2px; text-transform: uppercase;
      color: #94A3B8; margin: 20px 0 10px;
    }
    .section-label:first-of-type { margin-top: 0; }
    .divider { border: none; border-top: 1px solid #F1F5F9; margin: 4px 0 16px; }
    .field { display: flex; flex-direction: column; gap: 4px; margin-bottom: 12px; }
    .field label { font-size: 13px; font-weight: 600; color: #374151; }
    .field label .req { color: #EF4444; margin-left: 2px; }
    .field input, .field select, .field textarea {
      width: 100%; padding: 11px 13px; border: 1.5px solid #E2E8F0; border-radius: 10px;
      font-size: 15px; font-family: inherit; outline: none; color: #0F172A;
      background: #FAFAFA; transition: border-color .15s, background .15s;
      -webkit-appearance: none; appearance: none;
    }
    .field input:focus, .field select:focus, .field textarea:focus {
      border-color: #4F46E5; background: #fff;
    }
    .field textarea { resize: vertical; min-height: 72px; line-height: 1.5; }
    .field select {
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2364748B' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E");
      background-repeat: no-repeat; background-position: right 13px center; padding-right: 36px;
    }
    .submit-btn {
      width: 100%; padding: 13px; background: #4F46E5; color: white;
      border: none; border-radius: 11px; font-size: 15px; font-weight: 700;
      cursor: pointer; margin-top: 6px; letter-spacing: .2px;
      transition: background .15s;
    }
    .submit-btn:hover { background: #4338CA; }
    .submit-btn:disabled { background: #A5B4FC; cursor: not-allowed; }
    .new-entry-btn {
      display: block; width: 100%; padding: 12px; background: white; margin-top: 10px;
      color: #4F46E5; border: 1.5px solid #C7D2FE; border-radius: 11px;
      font-size: 15px; font-weight: 600; text-align: center; text-decoration: none;
      transition: background .15s;
    }
    .new-entry-btn:hover { background: #EEF2FF; }
    .footer { text-align: center; font-size: 12px; color: #94A3B8; margin-top: 16px; }
  </style>
</head>
<body>
  <div class="page">
    <div class="header">
      <div class="logo">Durga Foundation</div>
      <h1>Guest Entry</h1>
      <p>Fill in your details to register your visit</p>
    </div>

    <div class="card">
      ${success ? `
      <div class="success-banner">
        <div class="icon">✅</div>
        <h2>Entry Recorded!</h2>
        <p>Welcome, <strong>${name}</strong>. Your attendance has been saved.</p>
      </div>
      <a href="/attendance/entry" class="new-entry-btn">+ Register Another Entry</a>
      ` : `
      ${error ? `<div class="error-banner">⚠ ${error}</div>` : ""}
      <form method="POST" action="/attendance/entry" id="entry-form">
        <div class="section-label">Personal Information</div>
        <div class="field">
          <label>Full Name <span class="req">*</span></label>
          <input type="text" name="fullName" placeholder="e.g. Ramesh Kumar" required autocomplete="name" />
        </div>
        <div class="field">
          <label>Phone Number <span class="req">*</span></label>
          <input type="tel" name="phone" placeholder="e.g. 9876543210" required autocomplete="tel"
            pattern="[6-9][0-9]{9}" title="Enter a valid 10-digit Indian mobile number" />
        </div>
        <div class="field">
          <label>Email Address</label>
          <input type="email" name="email" placeholder="e.g. ramesh@example.com" autocomplete="email" />
        </div>

        <hr class="divider">
        <div class="section-label">Address</div>
        <div class="field">
          <label>Full Address</label>
          <textarea name="address" placeholder="House no., street, city, state, PIN code" rows="3"></textarea>
        </div>

        <hr class="divider">
        <div class="section-label">Visit Details</div>
        <div class="field">
          <label>Purpose of Visit <span class="req">*</span></label>
          <select name="purpose" required>
            <option value="">— Select Purpose —</option>
            <option>Attending Event / Programme</option>
            <option>Meeting / Appointment</option>
            <option>Training / Workshop</option>
            <option>Volunteering</option>
            <option>Enquiry</option>
            <option>Donation / Support</option>
            <option>Other</option>
          </select>
        </div>
        <div class="field">
          <label>Additional Remarks</label>
          <textarea name="remarks" placeholder="Any additional information…" rows="2"></textarea>
        </div>

        <button type="submit" class="submit-btn" id="submit-btn">Register Entry</button>
      </form>
      `}
    </div>
    <div class="footer">Durga Foundation · Attendance System</div>
  </div>

  <script>
    var form = document.getElementById('entry-form');
    var btn  = document.getElementById('submit-btn');
    if (form) {
      form.addEventListener('submit', function() {
        if (btn) { btn.disabled = true; btn.textContent = 'Saving…'; }
      });
    }
  </script>
</body>
</html>`);
};

export const processEntryForm = async (req: Request, res: Response) => {
  try {
    const { fullName, phone, email, address, purpose, remarks } = req.body;

    if (!fullName?.trim() || !phone?.trim() || !purpose?.trim()) {
      return res.redirect(
        "/attendance/entry?error=" + encodeURIComponent("Please fill in all required fields")
      );
    }

    const phoneTrimmed = phone.trim().replace(/\D/g, "").slice(-10);
    if (phoneTrimmed.length !== 10) {
      return res.redirect(
        "/attendance/entry?error=" + encodeURIComponent("Please enter a valid 10-digit phone number")
      );
    }

    const today = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
    const now = new Date();

    const existing = await prisma.guestAttendance.findFirst({
      where: { phone: phoneTrimmed, date: today },
    });

    if (existing) {
      return res.redirect(
        "/attendance/entry?error=" + encodeURIComponent(
          `An entry for phone ${phoneTrimmed} already exists today. Contact the admin if this is an error.`
        )
      );
    }

    await prisma.guestAttendance.create({
      data: {
        fullName: fullName.trim(),
        phone: phoneTrimmed,
        email: email?.trim() || null,
        address: address || null,
        purpose: purpose.trim(),
        date: today,
        markedAt: now,
        remarks: remarks?.trim() || null,
      },
    });

    const { saveGuestToSheet } = await import("../services/google.ts");
    saveGuestToSheet({
      fullName: fullName.trim(),
      phone: phoneTrimmed,
      email: email?.trim() || null,
      address: address || null,
      purpose: purpose.trim(),
      remarks: remarks?.trim() || null,
      eventType: "CHECK-IN",
      eventTime: now,
    }).catch((e: Error) => console.error("[SHEET] Failed to log manual entry:", e.message));

    return res.redirect(
      "/attendance/entry?success=1&name=" + encodeURIComponent(fullName.trim())
    );
  } catch (error) {
    console.error("Entry form error:", error);
    return res.redirect(
      "/attendance/entry?error=" + encodeURIComponent("Something went wrong, please try again")
    );
  }
};

export const renderQRPage = async (req: Request, res: Response) => {
  try {
    const tokenRecord = await prisma.attendanceToken.findUnique({
      where: { name: "attendance token" },
    });

    if (!tokenRecord) {
      return res
        .status(404)
        .send("Attendance token not found. Please wait for the cron job to run.");
    }

    const qrDataUri = await QRCode.toDataURL(tokenRecord.value, {
      width: 360,
      margin: 2,
      color: { dark: "#4F46E5", light: "#FFFFFF" },
    });

    const updatedAt = tokenRecord.updatedAt.toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });
    const updatedAtMs = tokenRecord.updatedAt.getTime();

    res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Attendance QR Kiosk</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; }
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      height: 100vh; margin: 0; background: #F8FAFC; color: #0F172A;
    }
    .card {
      background: white; padding: 40px; border-radius: 32px;
      box-shadow: 0 20px 25px -5px rgba(0,0,0,.1), 0 10px 10px -5px rgba(0,0,0,.04);
      text-align: center; max-width: 500px; width: 100%;
    }
    h1 { margin: 0 0 8px; font-weight: 800; letter-spacing: -.5px; }
    .subtitle { color: #64748B; margin: 0 0 24px; }
    #qr-img { border: 12px solid #EEF2FF; border-radius: 24px; display: block;
      margin: 0 auto 20px; width: 360px; height: 360px; }
    .timer-row {
      display: flex; align-items: center; justify-content: center; gap: 8px;
      margin-bottom: 8px;
    }
    .timer-label { font-size: 13px; color: #64748B; }
    #timer {
      font-size: 22px; font-weight: 900; letter-spacing: -.5px;
      min-width: 52px; transition: color .4s;
    }
    .timer-high   { color: #4F46E5; }
    .timer-medium { color: #D97706; }
    .timer-low    { color: #DC2626; }
    #status {
      font-size: 13px; color: #B45309; background: #FEF3C7;
      border: 1px solid #FDE68A; border-radius: 8px; padding: 8px 14px;
      margin-bottom: 8px; display: none;
    }
    .footer { font-size: 12px; color: #94A3B8; margin-top: 8px; }
    .logout { display: inline-block; margin-top: 16px; font-size: 13px; color: #94A3B8;
      text-decoration: none; }
    .logout:hover { color: #64748B; }
  </style>
</head>
<body>
  <div class="card">
    <h1>Scan for Attendance</h1>
    <p class="subtitle">Position the QR code within the app's scanner</p>
    <img id="qr-img" src="${qrDataUri}" alt="Attendance QR Code">
    <div class="timer-row">
      <span class="timer-label">Next refresh in</span>
      <span id="timer" class="timer-high">—</span>
    </div>
    <div id="status"></div>
    <div class="footer" id="updated-at">Last updated: ${updatedAt}</div>
    <a class="logout" href="/attendance/qr/logout">Sign out</a>
  </div>

  <script>
    var currentToken = ${JSON.stringify(tokenRecord.value)};
    var updatedAtMs  = ${updatedAtMs};
    var imgEl        = document.getElementById('qr-img');
    var timerEl      = document.getElementById('timer');
    var statusEl     = document.getElementById('status');
    var updatedAtEl  = document.getElementById('updated-at');

    function updateTimer() {
      var elapsed   = (Date.now() - updatedAtMs) / 1000;
      var remaining = Math.max(0, 60 - Math.floor(elapsed));
      timerEl.textContent = remaining + 's';
      timerEl.className = remaining > 20 ? 'timer-high'
                        : remaining > 10 ? 'timer-medium'
                        : 'timer-low';
    }

    async function poll() {
      try {
        var res = await fetch('/attendance/qr/data');
        if (res.status === 401 || res.status === 403) {
          window.location.href = '/attendance/qr/login';
          return;
        }
        var data = await res.json();
        if (data.token && data.token !== currentToken) {
          currentToken = data.token;
          updatedAtMs  = new Date(data.updatedAt).getTime();
          imgEl.src    = data.qrDataUri;
          updatedAtEl.textContent = 'Last updated: ' +
            new Date(data.updatedAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
        }
        if (statusEl.style.display !== 'none') statusEl.style.display = 'none';
      } catch (err) {
        statusEl.textContent = '⚠ Connection lost — retrying…';
        statusEl.style.display = 'block';
      }
    }

    updateTimer();
    setInterval(updateTimer, 1000);
    setInterval(poll, 5000);
  </script>
</body>
</html>`);
  } catch (error) {
    console.error("Error rendering QR page:", error);
    res.status(500).send("Internal Server Error");
  }
};
