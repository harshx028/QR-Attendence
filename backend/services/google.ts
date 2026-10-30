import { google } from "googleapis";
import path from "path";
import fs from "fs";
import dotenv from "dotenv";

dotenv.config();

interface SaveToSheetData {
  userId: string;
  fullName?: string;
  email?: string;
  markedAt?: Date;
  [key: string]: any;
}

const getAuthAndSheets = () => {
  const keyFile = path.resolve(
    path.dirname(new URL(import.meta.url).pathname),
    "../credentials/service-account.json"
  );

  if (!fs.existsSync(keyFile)) {
    throw new Error(
      "Service account credentials file not found. Please place service-account.json in backend/credentials/"
    );
  }

  const auth = new google.auth.GoogleAuth({
    keyFile,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });

  const sheets = google.sheets({ version: "v4", auth });
  const spreadsheetId = process.env.GOOGLE_SHEET_ID;

  if (!spreadsheetId) {
    throw new Error("GOOGLE_SHEET_ID is not defined in environment variables");
  }

  return { sheets, spreadsheetId };
};

export const saveToSheet = async (attendanceData: SaveToSheetData) => {
  try {
    const { sheets, spreadsheetId } = getAuthAndSheets();
    const markedAt = attendanceData.markedAt || new Date();
    const dateStr = markedAt.toISOString().split("T")[0]; // YYYY-MM-DD

    const values = [
      [
        attendanceData.fullName || "",
        attendanceData.email || "",
        attendanceData.userId || "",
        dateStr,
        markedAt.toISOString(),
        markedAt.toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }),
      ],
    ];

    const response = await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: "Attendance!A:F",
      valueInputOption: "USER_ENTERED",
      insertDataOption: "INSERT_ROWS",
      requestBody: {
        values,
      },
    });

    console.log("[SHEET] Attendance saved to Google Sheet successfully");
    return { success: true, response: response.data };
  } catch (error: any) {
    console.error("[SHEET] Error saving to Google Sheet:", error.message);
    throw error;
  }
};

export const getAllAttendanceFromSheet = async (date?: string) => {
  try {
    const { sheets, spreadsheetId } = getAuthAndSheets();
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: "Attendance!A:F",
    });

    const rows = response.data.values || [];
    if (rows.length === 0) return [];

    // Skip header if present
    const dataRows = rows[0].some((cell: any) => String(cell).toLowerCase().includes("name") || String(cell).toLowerCase().includes("email") || String(cell).toLowerCase().includes("date"))
      ? rows.slice(1)
      : rows;

    let attendances: any[] = dataRows
      .filter((row: any) => row && row.length > 0)
      .map((row: any) => {
        const markedAtStr = row[5] || row[4] || row[3] || "";
        const markedAt = markedAtStr ? new Date(row[5] || row[4] || row[3]) : new Date();
        return {
          user: {
            fullName: row[0] || "",
            email: row[1] || "",
            id: row[2] || "",
          },
          userId: row[2] || "",
          date: row[3] || markedAt.toISOString().split("T")[0],
          markedAt,
          markedAtIso: row[4] || row[5] || markedAt.toISOString(),
        };
      });

    if (date) {
      const targetDate = new Date(date);
      attendances = attendances.filter((att) => {
        const attDate = new Date(att.markedAt);
        return (
          attDate.getFullYear() === targetDate.getFullYear() &&
          attDate.getMonth() === targetDate.getMonth() &&
          attDate.getDate() === targetDate.getDate()
        );
      });
    }

    // Sort by markedAt desc
    attendances.sort((a, b) => new Date(b.markedAt).getTime() - new Date(a.markedAt).getTime());
    return attendances;
  } catch (error: any) {
    console.error("[SHEET] Error reading from Google Sheet:", error.message);
    throw error;
  }
};

export const getMyAttendanceFromSheet = async (userId: string, email?: string) => {
  try {
    const all = await getAllAttendanceFromSheet();
    const filtered = all.filter((att) => {
      if (userId && att.userId === userId) return true;
      if (email && att.user?.email === email) return true;
      return false;
    });
    // Limit to 90 like original
    return filtered.slice(0, 90);
  } catch (error: any) {
    console.error("[SHEET] Error reading user attendance from Google Sheet:", error.message);
    throw error;
  }
};

export const getTodayStatusFromSheet = async (userId: string, email?: string) => {
  try {
    const today = new Date();
    const todayStr = today.toISOString().split("T")[0];
    const all = await getAllAttendanceFromSheet(todayStr);
    const attendance = all.find((att) => {
      if (userId && att.userId === userId) return true;
      if (email && att.user?.email === email) return true;
      return false;
    });
    return attendance || null;
  } catch (error: any) {
    console.error("[SHEET] Error reading today status from Google Sheet:", error.message);
    throw error;
  }
};

export default { saveToSheet, getAllAttendanceFromSheet, getMyAttendanceFromSheet, getTodayStatusFromSheet };
