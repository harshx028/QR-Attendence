import { Request, Response, NextFunction } from "express";
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
    return res.json({
      token: tokenRecord.value,
      updatedAt: tokenRecord.updatedAt.toISOString(),
    });
  } catch (error) {
    console.error("Error fetching QR data:", error);
    res.status(500).json({ error: "Internal server error" });
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
    .subtitle { color: #64748B; margin: 0 0 28px; }
    #qr-canvas { border: 12px solid #EEF2FF; border-radius: 24px; display: block; margin: 0 auto 20px; }
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
    <canvas id="qr-canvas"></canvas>
    <div class="timer-row">
      <span class="timer-label">Next refresh in</span>
      <span id="timer" class="timer-high">—</span>
    </div>
    <div id="status"></div>
    <div class="footer" id="updated-at">Last updated: ${updatedAt}</div>
    <a class="logout" href="/attendance/qr/logout">Sign out</a>
  </div>

  <script src="https://cdn.jsdelivr.net/npm/qrcode@1.5.3/build/qrcode.min.js"></script>
  <script>
    var currentToken = ${JSON.stringify(tokenRecord.value)};
    var updatedAtMs  = ${updatedAtMs};
    var canvas       = document.getElementById('qr-canvas');
    var timerEl      = document.getElementById('timer');
    var statusEl     = document.getElementById('status');
    var updatedAtEl  = document.getElementById('updated-at');

    function renderQR(token) {
      QRCode.toCanvas(canvas, token, {
        width: 360, margin: 2,
        color: { dark: '#4F46E5', light: '#FFFFFF' }
      }, function(err) { if (err) console.error(err); });
    }

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
          renderQR(data.token);
          updatedAtEl.textContent = 'Last updated: ' +
            new Date(data.updatedAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
        }
        if (statusEl.style.display !== 'none') statusEl.style.display = 'none';
      } catch (err) {
        statusEl.textContent = '⚠ Connection lost — retrying…';
        statusEl.style.display = 'block';
      }
    }

    renderQR(currentToken);
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
