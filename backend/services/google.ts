import { google, sheets_v4 } from "googleapis";
import path from "path";
import fs from "fs";
import dotenv from "dotenv";

dotenv.config();

/**
 * Google Sheet layout: one tab per month, ONE ROW per person per day.
 * A check-in appends the row; the matching check-out fills in the check-out
 * columns of that same row (found by User ID / Phone + Date).
 */

export interface SaveToSheetData {
  userId: string;
  fullName?: string;
  email?: string;
  eventType: "CHECK-IN" | "CHECK-OUT";
  eventTime: Date;
  /** For CHECK-OUT: when the user checked in (used for the duration column). */
  checkInTime?: Date | null;
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
  remarks?: string | null;
  eventType: "CHECK-IN" | "CHECK-OUT";
  eventTime: Date;
  /** For CHECK-OUT: when the guest checked in (used for the duration column). */
  checkInTime?: Date | null;
  lat?: number | null;
  lng?: number | null;
}

type Sheets = sheets_v4.Sheets;

export const getAuthAndSheets = () => {
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

// ---------- formatting helpers ----------

export const getMonthTabName = (date: Date = new Date()): string =>
  date.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  }); // e.g. "October 2026"

export const guestTabName = (date: Date = new Date()) => `Guests - ${getMonthTabName(date)}`;

const istDate = (d: Date) => d.toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });

const istTime = (d: Date) =>
  d.toLocaleTimeString("en-IN", {
    timeZone: "Asia/Kolkata",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

export const mapsLink = (lat?: number | null, lng?: number | null): string => {
  if (lat == null || lng == null) return "N/A";
  return `=HYPERLINK("https://maps.google.com/?q=${lat},${lng}","📍 View Location")`;
};

export const durationText = (from?: Date | null, to?: Date | null): string => {
  if (!from || !to) return "";
  const mins = Math.max(0, Math.round((to.getTime() - from.getTime()) / 60000));
  return `${Math.floor(mins / 60)}h ${String(mins % 60).padStart(2, "0")}m`;
};

/** A1 range for a tab, quoted so names with spaces/dashes are safe. */
export const rng = (tab: string, a1: string) => `'${tab.replace(/'/g, "''")}'!${a1}`;

export const colLetter = (n: number) => String.fromCharCode(64 + n); // 1 -> A (fine up to Z)

/** Normalise a Date cell read back from the sheet (text or date serial) to YYYY-MM-DD. */
export const cellToDate = (v: unknown): string => {
  if (typeof v === "number") {
    const ms = Math.round((v - 25569) * 86400 * 1000); // Sheets epoch 1899-12-30
    return new Date(ms).toISOString().slice(0, 10);
  }
  return String(v ?? "").trim();
};

// ---------- layouts ----------

export const HEADERS = [
  "Full Name",
  "Email",
  "User ID",
  "Date",
  "Check-in Time (IST)",
  "Check-in Location",
  "Check-out Time (IST)",
  "Check-out Location",
  "Duration",
  "Remarks",
];
// 1-based column positions used for lookups/updates
const S = { key: 3, date: 4, checkOut: 7 } as const;

export const GUEST_HEADERS = [
  "Full Name",
  "Phone",
  "Email",
  "Address",
  "Purpose",
  "Date",
  "Check-in Time (IST)",
  "Check-in Location",
  "Check-out Time (IST)",
  "Check-out Location",
  "Duration",
  "Remarks",
];
const G = { key: 2, date: 6, checkOut: 9 } as const;

// ---------- tab management ----------

const formatHeader = async (sheets: Sheets, spreadsheetId: string, sheetId: number, cols: number) => {
  await sheets.spreadsheets.batchUpdate({
    spreadsheetId,
    requestBody: {
      requests: [
        {
          repeatCell: {
            range: { sheetId, startRowIndex: 0, endRowIndex: 1, startColumnIndex: 0, endColumnIndex: cols },
            cell: {
              userEnteredFormat: {
                textFormat: { bold: true, foregroundColor: { red: 1, green: 1, blue: 1 } },
                backgroundColor: { red: 0.31, green: 0.27, blue: 0.9 },
              },
            },
            fields: "userEnteredFormat(textFormat,backgroundColor)",
          },
        },
        {
          updateSheetProperties: {
            properties: { sheetId, gridProperties: { frozenRowCount: 1 } },
            fields: "gridProperties.frozenRowCount",
          },
        },
      ],
    },
  });
};

/**
 * Make sure `tabName` exists with `headers`. If a tab with that name exists but
 * uses the old one-row-per-event layout, it is renamed to "<name> (old format)"
 * and a fresh tab is created, so old rows never get mixed with the new layout.
 */
export const ensureTab = async (sheets: Sheets, spreadsheetId: string, tabName: string, headers: string[]) => {
  const meta = await sheets.spreadsheets.get({ spreadsheetId });
  const tab = (meta.data.sheets || []).find((s) => s.properties?.title === tabName);

  if (tab) {
    const head = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: rng(tabName, `A1:${colLetter(headers.length)}1`),
    });
    const current = (head.data.values?.[0] || []).map(String);
    if (current.join("|") === headers.join("|")) return;

    if (current.length === 0) {
      // Empty tab: just write the header.
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: rng(tabName, `A1:${colLetter(headers.length)}1`),
        valueInputOption: "RAW",
        requestBody: { values: [headers] },
      });
      await formatHeader(sheets, spreadsheetId, tab.properties!.sheetId!, headers.length);
      return;
    }

    let archived = `${tabName} (old format)`;
    const titles = new Set((meta.data.sheets || []).map((s) => s.properties?.title));
    for (let i = 2; titles.has(archived); i++) archived = `${tabName} (old format ${i})`;
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: {
        requests: [
          {
            updateSheetProperties: {
              properties: { sheetId: tab.properties!.sheetId!, title: archived },
              fields: "title",
            },
          },
        ],
      },
    });
    console.log(`[SHEET] Renamed old-layout tab "${tabName}" -> "${archived}"`);
  }

  const added = await sheets.spreadsheets.batchUpdate({
    spreadsheetId,
    requestBody: { requests: [{ addSheet: { properties: { title: tabName } } }] },
  });
  const sheetId = added.data.replies?.[0]?.addSheet?.properties?.sheetId ?? 0;

  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: rng(tabName, `A1:${colLetter(headers.length)}1`),
    valueInputOption: "RAW",
    requestBody: { values: [headers] },
  });
  await formatHeader(sheets, spreadsheetId, sheetId, headers.length);

  console.log(`[SHEET] Created tab "${tabName}" with headers`);
};

/** Find the last row (1-based) whose key column + date column match. */
const findRow = async (
  sheets: Sheets,
  spreadsheetId: string,
  tabName: string,
  keyCol: number,
  dateCol: number,
  key: string,
  date: string
): Promise<number | null> => {
  const first = Math.min(keyCol, dateCol);
  const last = Math.max(keyCol, dateCol);
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: rng(tabName, `${colLetter(first)}:${colLetter(last)}`),
    valueRenderOption: "UNFORMATTED_VALUE",
  });
  const rows = res.data.values || [];
  for (let i = rows.length - 1; i >= 1; i--) {
    const r = rows[i];
    const cellKey = String(r[keyCol - first] ?? "").trim().replace(/^'/, "");
    if (cellKey === key && cellToDate(r[dateCol - first]) === date) {
      return i + 1;
    }
  }
  return null;
};

/** Shared check-in / check-out upsert. */
const upsertDayRow = async (opts: {
  tabName: string;
  headers: string[];
  layout: { key: number; date: number; checkOut: number };
  key: string;
  date: string;
  eventType: "CHECK-IN" | "CHECK-OUT";
  /** Full row to append on check-in (or when no check-in row exists). */
  buildRow: () => (string | number)[];
  /** [check-out time, check-out location, duration] */
  checkOutCells: string[];
}) => {
  const { sheets, spreadsheetId } = getAuthAndSheets();
  await ensureTab(sheets, spreadsheetId, opts.tabName, opts.headers);
  const lastCol = colLetter(opts.headers.length);

  if (opts.eventType === "CHECK-OUT") {
    const row = await findRow(
      sheets,
      spreadsheetId,
      opts.tabName,
      opts.layout.key,
      opts.layout.date,
      opts.key,
      opts.date
    );
    if (row) {
      const start = colLetter(opts.layout.checkOut);
      const end = colLetter(opts.layout.checkOut + opts.checkOutCells.length - 1);
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: rng(opts.tabName, `${start}${row}:${end}${row}`),
        valueInputOption: "USER_ENTERED",
        requestBody: { values: [opts.checkOutCells] },
      });
      return `updated row ${row}`;
    }
    // No check-in row (e.g. the check-in write failed) — fall through and append a full row.
  }

  // Write at an explicit row starting in column A. (values.append guesses where
  // the "table" is and can shift the row sideways if stray cells exist.)
  const row = await nextFreeRow(sheets, spreadsheetId, opts.tabName, lastCol);
  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: rng(opts.tabName, `A${row}:${lastCol}${row}`),
    valueInputOption: "USER_ENTERED",
    requestBody: { values: [opts.buildRow()] },
  });
  return `added row ${row}`;
};

/** First row below the last row that has anything in columns A..lastCol (never row 1). */
const nextFreeRow = async (sheets: Sheets, spreadsheetId: string, tabName: string, lastCol: string) => {
  const res = await sheets.spreadsheets.values.get({ spreadsheetId, range: rng(tabName, `A:${lastCol}`) });
  const rows = res.data.values || [];
  let last = rows.length;
  while (last > 1 && !(rows[last - 1] || []).some((v) => String(v ?? "").trim() !== "")) last--;
  return Math.max(2, last + 1);
};

// ---------- public API ----------

export const saveToSheet = async (data: SaveToSheetData) => {
  try {
    const isOut = data.eventType === "CHECK-OUT";
    const date = istDate(isOut && data.checkInTime ? data.checkInTime : data.eventTime);
    const tabName = getMonthTabName(isOut && data.checkInTime ? data.checkInTime : data.eventTime);
    const outCells = isOut
      ? [istTime(data.eventTime), mapsLink(data.lat, data.lng), durationText(data.checkInTime, data.eventTime)]
      : ["", "", ""];

    const result = await upsertDayRow({
      tabName,
      headers: HEADERS,
      layout: S,
      key: data.userId,
      date,
      eventType: data.eventType,
      checkOutCells: outCells,
      buildRow: () => [
        data.fullName || "",
        data.email || "",
        data.userId || "",
        date,
        isOut ? (data.checkInTime ? istTime(data.checkInTime) : "") : istTime(data.eventTime),
        isOut ? "" : mapsLink(data.lat, data.lng),
        ...outCells,
        data.remarks || "",
      ],
    });

    console.log(`[SHEET] ${data.eventType} for ${data.userId} on "${tabName}": ${result}`);
  } catch (error: any) {
    console.error("[SHEET] Error saving to Google Sheet:", error.message);
    throw error;
  }
};

export const saveGuestToSheet = async (data: SaveGuestToSheetData) => {
  try {
    const isOut = data.eventType === "CHECK-OUT";
    const base = isOut && data.checkInTime ? data.checkInTime : data.eventTime;
    const date = istDate(base);
    const tabName = guestTabName(base);
    const outCells = isOut
      ? [istTime(data.eventTime), mapsLink(data.lat, data.lng), durationText(data.checkInTime, data.eventTime)]
      : ["", "", ""];

    const result = await upsertDayRow({
      tabName,
      headers: GUEST_HEADERS,
      layout: G,
      key: data.phone,
      date,
      eventType: data.eventType,
      checkOutCells: outCells,
      buildRow: () => [
        data.fullName,
        // Leading apostrophe keeps the phone as text (no number formatting / lost zeros).
        `'${data.phone}`,
        data.email || "",
        data.address || "",
        data.purpose || "",
        date,
        isOut ? (data.checkInTime ? istTime(data.checkInTime) : "") : istTime(data.eventTime),
        isOut ? "" : mapsLink(data.lat, data.lng),
        ...outCells,
        data.remarks || "",
      ],
    });

    console.log(`[SHEET] Guest ${data.eventType} for ${data.phone} on "${tabName}": ${result}`);
  } catch (error: any) {
    console.error("[SHEET] Error saving guest to Google Sheet:", error.message);
    throw error;
  }
};

// ---------- bulk rebuild (used by scripts/rebuild-sheet.ts) ----------

type DbStaffRecord = {
  userId: string;
  date: string;
  markedAt: Date;
  checkOutAt: Date | null;
  checkInLat: number | null;
  checkInLng: number | null;
  checkOutLat: number | null;
  checkOutLng: number | null;
  remarks: string | null;
  user: { fullName: string; email: string } | null;
};

type DbGuestRecord = {
  fullName: string;
  phone: string;
  email: string | null;
  address: string | null;
  purpose: string | null;
  remarks: string | null;
  date: string;
  markedAt: Date;
  checkOutAt: Date | null;
  checkInLat: number | null;
  checkInLng: number | null;
  checkOutLat: number | null;
  checkOutLng: number | null;
};

export const staffRowFromDb = (r: DbStaffRecord) => [
  r.user?.fullName || "",
  r.user?.email || "",
  r.userId,
  r.date,
  istTime(r.markedAt),
  mapsLink(r.checkInLat, r.checkInLng),
  r.checkOutAt ? istTime(r.checkOutAt) : "",
  r.checkOutAt ? mapsLink(r.checkOutLat, r.checkOutLng) : "",
  durationText(r.markedAt, r.checkOutAt),
  r.remarks || "",
];

export const guestRowFromDb = (r: DbGuestRecord) => [
  r.fullName,
  `'${r.phone}`,
  r.email || "",
  r.address || "",
  r.purpose || "",
  r.date,
  istTime(r.markedAt),
  mapsLink(r.checkInLat, r.checkInLng),
  r.checkOutAt ? istTime(r.checkOutAt) : "",
  r.checkOutAt ? mapsLink(r.checkOutLat, r.checkOutLng) : "",
  durationText(r.markedAt, r.checkOutAt),
  r.remarks || "",
];

/** Replace every data row (row 2 onwards) of `tabName` with `rows`. */
export const rewriteTab = async (tabName: string, headers: string[], rows: (string | number)[][]) => {
  const { sheets, spreadsheetId } = getAuthAndSheets();
  await ensureTab(sheets, spreadsheetId, tabName, headers);
  const lastCol = colLetter(headers.length);
  await sheets.spreadsheets.values.clear({ spreadsheetId, range: rng(tabName, `A2:${lastCol}`) });
  if (rows.length) {
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: rng(tabName, `A2:${lastCol}${rows.length + 1}`),
      valueInputOption: "USER_ENTERED",
      requestBody: { values: rows },
    });
  }
};
