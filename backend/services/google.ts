import { google } from "googleapis";
import path from "path";
import fs from "fs";
import dotenv from "dotenv";

dotenv.config();

export interface SaveToSheetData {
  userId: string;
  fullName?: string;
  email?: string;
  eventType: "CHECK-IN" | "CHECK-OUT";
  eventTime: Date;
  lat?: number | null;
  lng?: number | null;
  remarks?: string | null;
}

export interface SaveGuestToSheetData {
  fullName: string;
  phone: string;
  email?: string | null;
  address?: string | null;
  purpose?: string | null;
  eventType: "CHECK-IN" | "CHECK-OUT";
  eventTime: Date;
  lat?: number | null;
  lng?: number | null;
}

const getAuthAndSheets = () => {
  const keyFile = path.resolve(
    path.dirname(new URL(import.meta.url).pathname),
    "../credentials/service-account.json"
  );

  if (!fs.existsSync(keyFile)) {
    throw new Error(
      "Service account credentials file not found. Place service-account.json in backend/credentials/"
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

const getMonthTabName = (date: Date = new Date()): string =>
  date.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  }); // e.g. "October 2026"

const mapsLink = (lat?: number | null, lng?: number | null): string => {
  if (lat == null || lng == null) return "N/A";
  return `=HYPERLINK("https://maps.google.com/?q=${lat},${lng}","📍 View Location")`;
};

const HEADERS = ["Full Name", "Email", "User ID", "Date", "Event", "Time (IST)", "Location", "Remarks"];
const GUEST_HEADERS = ["Full Name", "Phone", "Email", "Address", "Purpose", "Date", "Event", "Time (IST)", "Location"];

const ensureTabExists = async (
  sheets: ReturnType<typeof google.sheets>,
  spreadsheetId: string,
  tabName: string,
  headers: string[]
) => {
  const meta = await sheets.spreadsheets.get({ spreadsheetId });
  const existing = (meta.data.sheets || []).map((s) => s.properties?.title);

  if (existing.includes(tabName)) return;

  await sheets.spreadsheets.batchUpdate({
    spreadsheetId,
    requestBody: {
      requests: [{ addSheet: { properties: { title: tabName } } }],
    },
  });

  const endCol = String.fromCharCode(64 + headers.length);
  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: `${tabName}!A1:${endCol}1`,
    valueInputOption: "USER_ENTERED",
    requestBody: { values: [headers] },
  });

  console.log(`[SHEET] Created tab "${tabName}" with headers`);
};

export const saveToSheet = async (data: SaveToSheetData) => {
  try {
    const { sheets, spreadsheetId } = getAuthAndSheets();
    const tabName = getMonthTabName(data.eventTime);

    await ensureTabExists(sheets, spreadsheetId, tabName, HEADERS);

    const dateStr = data.eventTime.toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
    const timeIST = data.eventTime.toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });

    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: `${tabName}!A:H`,
      valueInputOption: "USER_ENTERED",
      insertDataOption: "INSERT_ROWS",
      requestBody: {
        values: [[
          data.fullName || "",
          data.email || "",
          data.userId || "",
          dateStr,
          data.eventType,
          timeIST,
          mapsLink(data.lat, data.lng),
          data.remarks || "",
        ]],
      },
    });

    console.log(`[SHEET] ${data.eventType} logged to tab "${tabName}"`);
  } catch (error: any) {
    console.error("[SHEET] Error saving to Google Sheet:", error.message);
    throw error;
  }
};

export const saveGuestToSheet = async (data: SaveGuestToSheetData) => {
  try {
    const { sheets, spreadsheetId } = getAuthAndSheets();
    const tabName = `Guests - ${getMonthTabName(data.eventTime)}`;

    await ensureTabExists(sheets, spreadsheetId, tabName, GUEST_HEADERS);

    const dateStr = data.eventTime.toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
    const timeIST = data.eventTime.toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });

    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: `${tabName}!A:I`,
      valueInputOption: "USER_ENTERED",
      insertDataOption: "INSERT_ROWS",
      requestBody: {
        values: [[
          data.fullName,
          data.phone,
          data.email || "",
          data.address || "",
          data.purpose || "",
          dateStr,
          data.eventType,
          timeIST,
          mapsLink(data.lat, data.lng),
        ]],
      },
    });

    console.log(`[SHEET] Guest ${data.eventType} logged to tab "${tabName}"`);
  } catch (error: any) {
    console.error("[SHEET] Error saving guest to Google Sheet:", error.message);
    throw error;
  }
};
