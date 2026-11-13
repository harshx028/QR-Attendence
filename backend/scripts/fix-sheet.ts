/**
 * Fix the existing Google Sheet entries: convert every tab that still uses the
 * old one-row-per-event layout (separate CHECK-IN / CHECK-OUT rows) into the new
 * one-row-per-day layout (check-in + check-out + both locations + duration).
 *
 * Works from the sheet itself, so it also keeps rows that are not in the database.
 *
 *   npm run fix-sheet -- --dry-run   # show what would change, write nothing
 *   npm run fix-sheet                # apply
 *
 * Safety: old tabs are never deleted. "November 2026" in the old layout is
 * renamed to "November 2026 (old format)" and a new "November 2026" is written.
 * If a new-layout tab already exists (because the server already started writing
 * the new layout), its rows are kept and the old rows are merged in.
 */
import "dotenv/config";
import {
  GUEST_HEADERS,
  HEADERS,
  cellToDate,
  getAuthAndSheets,
  rewriteTab,
  rng,
} from "../services/google.ts";

const DRY_RUN = process.argv.includes("--dry-run");

type Kind = "staff" | "guest";
type Cell = string | number;

const OLD_STAFF = ["Full Name", "Email", "User ID", "Date", "Event", "Time (IST)", "Location", "Remarks"];
const OLD_GUEST = ["Full Name", "Phone", "Email", "Address", "Purpose", "Date", "Event", "Time (IST)", "Location"];

const sameHeaders = (a: string[], b: string[]) =>
  b.every((h, i) => String(a[i] ?? "").trim() === h);

const baseName = (title: string) => title.replace(/ \(old format(?: \d+)?\)$/, "");

// ---------- time helpers ----------

/** Seconds since midnight from a time cell (sheet serial number or text like "13/11/2026, 9:05:12 am"). */
const toSeconds = (v: Cell | undefined): number | null => {
  if (v === undefined || v === "") return null;
  if (typeof v === "number") return Math.round((v % 1) * 86400) % 86400;
  const m = String(v).match(/(\d{1,2}):(\d{2})(?::(\d{2}))?\s*([ap])?\.?\s*m?\.?/i);
  if (!m) return null;
  let h = Number(m[1]);
  const ap = m[4]?.toLowerCase();
  if (ap === "p" && h < 12) h += 12;
  if (ap === "a" && h === 12) h = 0;
  return h * 3600 + Number(m[2]) * 60 + Number(m[3] ?? 0);
};

/** Same format the server writes: "09:05:12 am". */
const clock = (secs: number | null): string => {
  if (secs == null) return "";
  const h24 = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  const p = (n: number) => String(n).padStart(2, "0");
  return `${p(h12)}:${p(m)}:${p(s)} ${h24 < 12 ? "am" : "pm"}`;
};

const durationFromSecs = (a: number | null, b: number | null): string => {
  if (a == null || b == null || b < a) return "";
  const mins = Math.round((b - a) / 60);
  return `${Math.floor(mins / 60)}h ${String(mins % 60).padStart(2, "0")}m`;
};

/** A location cell read with FORMULA rendering: keep hyperlink formulas, blank out empties. */
const loc = (v: Cell | undefined): string => (v === undefined || v === "" ? "" : String(v));

// ---------- conversion ----------

type DayRow = { key: string; date: string; inSecs: number | null; cells: Cell[] };

type Group = {
  info: Cell[]; // identity columns (name, email, id / phone, address, purpose)
  date: string;
  inSecs: number | null;
  inLoc: string;
  outSecs: number | null;
  outLoc: string;
  remarks: string;
};

const convertOld = (kind: Kind, rows: Cell[][]): DayRow[] => {
  // Column indexes in the OLD layouts
  const c =
    kind === "staff"
      ? { key: 2, date: 3, event: 4, time: 5, loc: 6, remarks: 7, info: [0, 1, 2] }
      : { key: 1, date: 5, event: 6, time: 7, loc: 8, remarks: -1, info: [0, 1, 2, 3, 4] };

  const groups = new Map<string, Group>();
  for (const r of rows) {
    const key = String(r[c.key] ?? "").trim().replace(/^'/, "");
    const date = cellToDate(r[c.date]);
    if (!key || !date) continue;
    const id = `${key}|${date}`;
    const g =
      groups.get(id) ??
      ({ info: c.info.map((i) => r[i] ?? ""), date, inSecs: null, inLoc: "", outSecs: null, outLoc: "", remarks: "" } as Group);
    const event = String(r[c.event] ?? "").toUpperCase();
    const secs = toSeconds(r[c.time]);
    if (event.includes("OUT")) {
      // keep the latest check-out
      if (g.outSecs == null || (secs != null && secs >= g.outSecs)) {
        g.outSecs = secs;
        g.outLoc = loc(r[c.loc]);
      }
    } else {
      // keep the earliest check-in
      if (g.inSecs == null || (secs != null && secs < g.inSecs)) {
        g.inSecs = secs;
        g.inLoc = loc(r[c.loc]);
      }
      if (c.remarks >= 0 && r[c.remarks]) g.remarks = String(r[c.remarks]);
    }
    groups.set(id, g);
  }

  return [...groups.entries()].map(([id, g]) => {
    const key = id.split("|")[0];
    const info = [...g.info];
    if (kind === "guest") info[1] = `'${key}`; // keep phone as text
    const cells: Cell[] = [
      ...info,
      g.date,
      clock(g.inSecs),
      g.inLoc,
      clock(g.outSecs),
      g.outLoc,
      durationFromSecs(g.inSecs, g.outSecs),
      g.remarks,
    ];
    return { key, date: g.date, inSecs: g.inSecs, cells };
  });
};

/** Rows already in the NEW layout, normalised so they can be written back unchanged. */
const readNew = (kind: Kind, rows: Cell[][]): DayRow[] => {
  const width = kind === "staff" ? HEADERS.length : GUEST_HEADERS.length;
  const c = kind === "staff" ? { key: 2, date: 3, in: 4, out: 6 } : { key: 1, date: 5, in: 6, out: 8 };
  return rows
    .filter((r) => r.some((v) => v !== ""))
    .map((r) => {
      const cells = Array.from({ length: width }, (_, i) => r[i] ?? "");
      const key = String(cells[c.key]).trim().replace(/^'/, "");
      const date = cellToDate(cells[c.date]);
      const inSecs = toSeconds(cells[c.in]);
      cells[c.date] = date;
      cells[c.in] = clock(inSecs) || String(cells[c.in]);
      const outSecs = toSeconds(cells[c.out]);
      if (outSecs != null) cells[c.out] = clock(outSecs);
      if (kind === "guest") cells[c.key] = `'${key}`;
      return { key, date, inSecs, cells };
    });
};

// ---------- main ----------

const main = async () => {
  const { sheets, spreadsheetId } = getAuthAndSheets();
  const meta = await sheets.spreadsheets.get({ spreadsheetId });
  const titles = (meta.data.sheets || []).map((s) => s.properties!.title!);

  const read = async (title: string) => {
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: rng(title, "A:Z"),
      valueRenderOption: "FORMULA", // keeps =HYPERLINK(...) and raw date/time values
    });
    return (res.data.values || []) as Cell[][];
  };

  // Group every tab by the month tab it belongs to.
  type Target = { kind: Kind; oldTabs: { title: string; rows: Cell[][] }[]; newRows: Cell[][] };
  const targets = new Map<string, Target>();

  for (const title of titles) {
    const all = await read(title);
    const head = (all[0] || []).map(String);
    const body = all.slice(1);
    let kind: Kind | null = null;
    let isOld = false;
    if (sameHeaders(head, OLD_STAFF)) [kind, isOld] = ["staff", true];
    else if (sameHeaders(head, OLD_GUEST)) [kind, isOld] = ["guest", true];
    else if (sameHeaders(head, HEADERS)) kind = "staff";
    else if (sameHeaders(head, GUEST_HEADERS)) kind = "guest";
    if (!kind) {
      console.log(`· skipping "${title}" (unrecognised layout)`);
      continue;
    }

    const name = baseName(title);
    const t = targets.get(name) ?? { kind, oldTabs: [], newRows: [] };
    if (isOld) t.oldTabs.push({ title, rows: body });
    else if (title === name) t.newRows = body;
    targets.set(name, t);
  }

  let changed = 0;
  for (const [name, t] of targets) {
    if (t.oldTabs.length === 0) continue; // already fully in the new layout
    changed++;

    const existing = readNew(t.kind, t.newRows);
    const have = new Set(existing.map((r) => `${r.key}|${r.date}`));
    const converted = t.oldTabs.flatMap((o) => convertOld(t.kind, o.rows));
    const added = converted.filter((r) => !have.has(`${r.key}|${r.date}`));

    // Only archived "(old format)" tabs left and nothing new to merge → already fixed.
    if (added.length === 0 && !t.oldTabs.some((o) => o.title === name)) {
      changed--;
      console.log(`· "${name}" already fixed`);
      continue;
    }

    const merged = [...existing, ...added].sort(
      (a, b) => a.date.localeCompare(b.date) || (a.inSecs ?? 0) - (b.inSecs ?? 0)
    );

    const oldEventRows = t.oldTabs.reduce((n, o) => n + o.rows.length, 0);
    console.log(
      `\n▶ "${name}" (${t.kind}): ${oldEventRows} old event rows from ${t.oldTabs
        .map((o) => `"${o.title}"`)
        .join(", ")} → ${converted.length} day rows` +
        (existing.length ? `; kept ${existing.length} existing new-layout rows, added ${added.length}` : "") +
        ` → ${merged.length} rows total`
    );
    for (const r of merged.slice(0, 3)) console.log("   ", JSON.stringify(r.cells));
    if (merged.length > 3) console.log(`    … ${merged.length - 3} more`);

    if (!DRY_RUN) {
      // rewriteTab archives an old-layout tab with this name, then writes the new tab.
      await rewriteTab(name, t.kind === "staff" ? HEADERS : GUEST_HEADERS, merged.map((r) => r.cells));
      console.log(`  ✔ written`);
    }
  }

  if (!changed) console.log("Nothing to fix — every tab already uses the new layout.");
  else if (DRY_RUN) console.log(`\nDry run: ${changed} tab(s) would be fixed. Run without --dry-run to apply.`);
  else console.log(`\nDone: ${changed} tab(s) fixed. Old tabs were kept with an "(old format)" suffix.`);
};

main().catch((e) => {
  console.error("Fix failed:", e.message);
  process.exitCode = 1;
});
