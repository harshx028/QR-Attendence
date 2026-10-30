import { google } from "googleapis";
import path from "path";
import fs from "fs";
import dotenv from "dotenv";

dotenv.config();

const SHEET_COLUMNS = {
  FULL_NAME: 0,
  EMAIL: 1,
  USER_ID: 2,
  DATE: 3,
  EVENT_TYPE: 4,
  TIME_IST: 5,
  LOCATION: 6,
};

interface SaveToSheetData {
  userId: string;
  fullName?: string;
  email?: string;
  eventType: "CHECK-IN" | "CHECK-OUT";
  eventTime: Date;
  lat?: number | null;
  lng?: number | null;
}

const SHEET_TAB = process.env.GOOGLE_SHEET_TAB || "Attendance";

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

const mapsLink = (lat: number | null | undefined, lng: number | null | undefined): string => {
  if (lat == null || lng == null) return "N/A";
  return `=HYPERLINK("https://maps.google.com/?q=${lat},${lng}","📍 View Location")`;
};

export const saveToSheet = async (data: SaveToSheetData) => {
  try {
    const { sheets, spreadsheetId } = getAuthAndSheets();
    const dateStr = data.eventTime.toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
    const timeIST = data.eventTime.toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });

    const values = [
      [
        data.fullName || "",
        data.email || "",
        data.userId || "",
        dateStr,
        data.eventType,
        timeIST,
        mapsLink(data.lat, data.lng),
      ],
    ];

    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: `${SHEET_TAB}!A:G`,
      valueInputOption: "USER_ENTERED",
      insertDataOption: "INSERT_ROWS",
      requestBody: { values },
    });

    console.log(`[SHEET] ${data.eventType} saved to Google Sheet`);
  } catch (error: any) {
    console.error("[SHEET] Error saving to Google Sheet:", error.message);
    throw error;
  }
};

interface ParsedRow {
  fullName: string;
  email: string;
  userId: string;
  date: string;
  eventType: "CHECK-IN" | "CHECK-OUT" | "LEGACY";
  eventTime: Date;
  lat: number | null;
  lng: number | null;
}

const parseRow = (row: any[]): ParsedRow | null => {
  if (!row || row.length < 4) return null;

  const isNewFormat = row[4] === "CHECK-IN" || row[4] === "CHECK-OUT";

  if (isNewFormat) {
    return {
      fullName: row[SHEET_COLUMNS.FULL_NAME] || "",
      email: row[SHEET_COLUMNS.EMAIL] || "",
      userId: row[SHEET_COLUMNS.USER_ID] || "",
      date: row[SHEET_COLUMNS.DATE] || "",
      eventType: row[SHEET_COLUMNS.EVENT_TYPE] as "CHECK-IN" | "CHECK-OUT",
      eventTime: new Date(row[SHEET_COLUMNS.TIME_IST] || row[SHEET_COLUMNS.DATE]),
      lat: null,
      lng: null,
    };
  }

  // Legacy format: Name | Email | UserID | Date | ISO | IST
  const markedAt = new Date(row[5] || row[4] || row[3] || "");
  return {
    fullName: row[0] || "",
    email: row[1] || "",
    userId: row[2] || "",
    date: row[3] || markedAt.toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" }),
    eventType: "LEGACY",
    eventTime: markedAt,
    lat: null,
    lng: null,
  };
};

const getRawRows = async (): Promise<ParsedRow[]> => {
  const { sheets, spreadsheetId } = getAuthAndSheets();
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `${SHEET_TAB}!A:G`,
  });

  const rows = response.data.values || [];
  if (rows.length === 0) return [];

  const dataRows = rows[0].some((cell: any) =>
    ["name", "email", "type", "event"].includes(String(cell).toLowerCase())
  )
    ? rows.slice(1)
    : rows;

  return dataRows.map(parseRow).filter(Boolean) as ParsedRow[];
};

type DayRecord = {
  userId: string;
  date: string;
  user: { fullName: string; email: string; id: string };
  markedAt: Date;
  checkInAt: Date;
  checkOutAt: Date | null;
};

const groupByDay = (rows: ParsedRow[]): DayRecord[] => {
  const map: Record<string, DayRecord> = {};

  for (const row of rows) {
    const key = `${row.userId}__${row.date}`;
    if (!map[key]) {
      map[key] = {
        userId: row.userId,
        date: row.date,
        user: { fullName: row.fullName, email: row.email, id: row.userId },
        markedAt: row.eventTime,
        checkInAt: row.eventTime,
        checkOutAt: null,
      };
    }
    if (row.eventType === "CHECK-IN" || row.eventType === "LEGACY") {
      map[key].markedAt = row.eventTime;
      map[key].checkInAt = row.eventTime;
    } else if (row.eventType === "CHECK-OUT") {
      map[key].checkOutAt = row.eventTime;
    }
  }

  return Object.values(map).sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
};

export const getAllAttendanceFromSheet = async (date?: string) => {
  try {
    let rows = await getRawRows();
    if (date) {
      const target = new Date(date).toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
      rows = rows.filter((r) => r.date === target);
    }
    const grouped = groupByDay(rows);
    return grouped.slice(0, 500);
  } catch (error: any) {
    console.error("[SHEET] Error reading from Google Sheet:", error.message);
    throw error;
  }
};

export const getMyAttendanceFromSheet = async (userId: string, email?: string) => {
  try {
    const rows = await getRawRows();
    const filtered = rows.filter(
      (r) => (userId && r.userId === userId) || (email && r.email === email)
    );
    return groupByDay(filtered).slice(0, 90);
  } catch (error: any) {
    console.error("[SHEET] Error reading user attendance from Google Sheet:", error.message);
    throw error;
  }
};

export const getTodayStatusFromSheet = async (userId: string, email?: string) => {
  try {
    const today = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
    const rows = await getRawRows();
    const todayRows = rows.filter(
      (r) =>
        r.date === today &&
        ((userId && r.userId === userId) || (email && r.email === email))
    );

    if (todayRows.length === 0) return null;

    const checkIn = todayRows.find((r) => r.eventType === "CHECK-IN" || r.eventType === "LEGACY");
    const checkOut = todayRows.find((r) => r.eventType === "CHECK-OUT");

    if (!checkIn) return null;

    return {
      date: today,
      markedAt: checkIn.eventTime,
      checkInAt: checkIn.eventTime,
      checkOutAt: checkOut?.eventTime || null,
    };
  } catch (error: any) {
    console.error("[SHEET] Error reading today status from Google Sheet:", error.message);
    throw error;
  }
};

export default {
  saveToSheet,
  getAllAttendanceFromSheet,
  getMyAttendanceFromSheet,
  getTodayStatusFromSheet,
};
