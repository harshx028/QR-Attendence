import { Request, Response } from "express";
import QRCode from "qrcode";
import prisma from "../services/prismaClient";

export const renderQRPage = async (req: Request, res: Response) => {
  try {
    // Fetch the latest token
    const tokenRecord = await prisma.attendanceToken.findUnique({
      where: { name: "attendance token" },
    });

    if (!tokenRecord) {

      return res.status(404).send("Attendance token not found. Please wait for the cron job to run.");
    }

    const token = tokenRecord.value;
    const updatedAt = tokenRecord.updatedAt.toLocaleString();

    // Generate QR code Data URI
    // The content of the QR code is just the token string
    const qrDataUri = await QRCode.toDataURL(token, {
      width: 400,
      margin: 2,
      color: {
        dark: "#4F46E5", // Matching our premium theme
        light: "#FFFFFF",
      },
    });

    // Render simple HTML
    const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Attendance QR Kiosk</title>
          <style>
              body {
                  font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
                  display: flex;
                  flex-direction: column;
                  align-items: center;
                  justify-content: center;
                  height: 100vh;
                  margin: 0;
                  background-color: #F8FAFC;
                  color: #0F172A;
              }
              .card {
                  background: white;
                  padding: 40px;
                  border-radius: 32px;
                  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
                  text-align: center;
                  max-width: 500px;
              }
              h1 { margin-bottom: 8px; font-weight: 800; letter-spacing: -0.5px; }
              p { color: #64748B; margin-bottom: 32px; }
              img { 
                  border: 12px solid #EEF2FF;
                  border-radius: 24px;
                  margin-bottom: 24px;
              }
              .footer {
                  font-size: 12px;
                  color: #94A3B8;
                  margin-top: 24px;
              }
              .refresh-hint {
                  font-size: 14px;
                  color: #4F46E5;
                  font-weight: 600;
              }
          </style>
          <!-- Auto refresh every 30 seconds to show latest token -->
          <meta http-equiv="refresh" content="30">
      </head>
      <body>
          <div class="card">
              <h1>Scan for Attendance</h1>
              <p>Position the QR code within the app's scanner</p>
              <img src="${qrDataUri}" alt="Attendance QR Code">
              <div class="refresh-hint">Token refreshes every minute</div>
              <div class="footer">Last updated: ${updatedAt}</div>
          </div>
      </body>
      </html>
    `;

    res.send(html);
  } catch (error) {
    console.error("Error rendering QR page:", error);
    res.status(500).send("Internal Server Error");
  }
};
