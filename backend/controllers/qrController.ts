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
      width: 400,
      margin: 2,
      color: { dark: "#4F46E5", light: "#FFFFFF" },
    });

    const updatedAt = tokenRecord.updatedAt.toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });

    res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Attendance QR Kiosk</title>
  <meta http-equiv="refresh" content="30">
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
      text-align: center; max-width: 500px;
    }
    h1 { margin-bottom: 8px; font-weight: 800; letter-spacing: -.5px; }
    p  { color: #64748B; margin-bottom: 32px; }
    img { border: 12px solid #EEF2FF; border-radius: 24px; margin-bottom: 24px; }
    .footer { font-size: 12px; color: #94A3B8; margin-top: 24px; }
    .refresh-hint { font-size: 14px; color: #4F46E5; font-weight: 600; }
    .logout { display: inline-block; margin-top: 16px; font-size: 13px; color: #94A3B8;
      text-decoration: none; }
    .logout:hover { color: #64748B; }
  </style>
</head>
<body>
  <div class="card">
    <h1>Scan for Attendance</h1>
    <p>Position the QR code within the app's scanner</p>
    <img src="${qrDataUri}" alt="Attendance QR Code">
    <div class="refresh-hint">Token refreshes every minute</div>
    <div class="footer">Last updated: ${updatedAt}</div>
    <a class="logout" href="/attendance/qr/logout">Sign out</a>
  </div>
</body>
</html>`);
  } catch (error) {
    console.error("Error rendering QR page:", error);
    res.status(500).send("Internal Server Error");
  }
};
