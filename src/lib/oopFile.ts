// Order-of-play workbook helpers.
//
// Parses the organizers' hand-seeded draw workbook (`OOP … .xlsx`) back into
// team assignments, and rebuilds a pixel-faithful copy (draw sheets + the
// session/court "Order Of Play" grid) from the computed plan.
//
// `exceljs` is only pulled in via dynamic import inside each entry point so it
// never lands in the server bundle.

import type {
  OopPlan,
  OopSettings,
  OopSlotEntry,
  RegistrationTeam,
  Tournament,
} from "@/lib/tuwagaApi";

export type { OopPlan, OopSlotEntry };

// ---- Shared label helpers (mirror the backend) ----------------------------

export function categoryDisplayLabel(category: string): string {
  for (const separator of [" — ", " - "]) {
    const index = category.indexOf(separator);
    if (index >= 0) {
      const first = category.slice(0, index).trim();
      const second = category.slice(index + separator.length).trim();
      return `${second} ${first}`;
    }
  }
  return category;
}

export function categorySheetName(category: string): string {
  return category.replace(/\s*[—–-]\s*/g, " ").trim();
}

export function groupLetter(group: string | null | undefined): string {
  if (!group) return "";
  const segment = group.includes("·")
    ? (group.split("·").pop() ?? group)
    : group;
  return segment.replace(/^Group\s+/i, "").trim();
}

function categoryFill(category: string): string {
  const c = category.toLowerCase();
  if (c.includes("women") || c.includes("ladies") || c.includes("female")) {
    return "FFB4A7D6";
  }
  if (c.includes("men") || c.includes("male")) {
    return "FFCFE2F3";
  }
  return "FFC6E0B4";
}

// Palette pulled straight from the reference workbook.
const COLORS = {
  headerOrange: "FFE69138",
  timeGrey: "FFEFEFEF",
  drawHeaderGrey: "FFD9D9D9",
  scoreGrey: "FFF8F9FA",
  white: "FFFFFFFF",
  eventYellow: "FFFFD966",
  drawTitle: "FFE46C0A",
  black: "FF000000",
};

async function loadExcel() {
  const mod = (await import("exceljs")) as unknown as {
    default?: { Workbook: new () => ExcelWorkbook };
    Workbook: new () => ExcelWorkbook;
  };
  const ns = mod.default ?? mod;
  return ns;
}

// Minimal structural types so we don't fight exceljs' loose typings.
type ExcelWorkbook = {
  addWorksheet(name: string): ExcelWorksheet;
  removeWorksheet(id: string): void;
  getWorksheet(name: string): ExcelWorksheet | undefined;
  worksheets: ExcelWorksheet[];
  xlsx: {
    load(data: ArrayBuffer): Promise<void>;
    writeBuffer(): Promise<ArrayBuffer>;
  };
};
type ExcelWorksheet = {
  name: string;
  id: string;
  getColumn(col: number): { width?: number };
  getRow(row: number): {
    height?: number;
    getCell(col: number): ExcelCell;
  };
  getCell(ref: string): ExcelCell;
  mergeCells(range: string): void;
  actualRowCount: number;
};
type ExcelCell = {
  value: unknown;
  font: Record<string, unknown>;
  fill: Record<string, unknown>;
  alignment: Record<string, unknown>;
  border: Record<string, unknown>;
  numFmt: string;
};

function cellText(value: unknown): string {
  if (value == null) return "";
  if (typeof value === "string") return value;
  if (typeof value === "number") return String(value);
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "object" && "result" in (value as object)) {
    return cellText((value as { result: unknown }).result);
  }
  if (typeof value === "object" && "text" in (value as object)) {
    return cellText((value as { text: unknown }).text);
  }
  return String(value);
}

// ---- Parsing the imported draw workbook -----------------------------------

export type ParsedDrawRow = {
  sheetName: string;
  no: number;
  player1: string;
  player2: string;
  group: string;
};

export type ParsedDrawWorkbook = {
  rows: ParsedDrawRow[];
  sheetNames: string[];
};

const OOP_SHEET_RE = /order\s*of\s*play/i;

export async function parseDrawWorkbook(
  file: File,
): Promise<ParsedDrawWorkbook> {
  const Excel = await loadExcel();
  const workbook = new Excel.Workbook();
  await workbook.xlsx.load(await file.arrayBuffer());

  const rows: ParsedDrawRow[] = [];
  const sheetNames: string[] = [];

  for (const sheet of workbook.worksheets) {
    if (OOP_SHEET_RE.test(sheet.name)) continue;
    sheetNames.push(sheet.name);
    // Grid starts at row 12: No. | Player 1 | Player 2 | GROUP (cols B..E).
    for (let r = 12; r <= sheet.actualRowCount + 12; r++) {
      const row = sheet.getRow(r);
      const no = row.getCell(2).value;
      const player1 = cellText(row.getCell(3).value).trim();
      const player2 = cellText(row.getCell(4).value).trim();
      const group = groupLetter(cellText(row.getCell(5).value));
      if (no == null && !player1 && !player2) break;
      const noNumber =
        typeof no === "number" ? no : Number.parseInt(cellText(no), 10);
      if (!player1 || Number.isNaN(noNumber)) continue;
      rows.push({
        sheetName: sheet.name,
        no: noNumber,
        player1,
        player2,
        group,
      });
    }
  }

  return { rows, sheetNames };
}

// ---- Matching parsed rows onto registered teams ---------------------------

export type DrawAssignment = {
  teamId: string;
  group: string;
  seed: number;
  displayName: string;
};

export type DrawMatchResult = {
  assignments: DrawAssignment[];
  warnings: string[];
  unmatched: ParsedDrawRow[];
  byCategory: Record<string, number>;
};

function normName(s: string): string {
  return s.toUpperCase().replace(/\s+/g, " ").trim();
}
function tokens(s: string): string[] {
  return normName(s).split(" ").filter(Boolean);
}
function tokenEq(a: string, b: string): boolean {
  if (a === b) return true;
  const strip = (t: string) => (t.endsWith(".") ? t.slice(0, -1) : t);
  const aa = strip(a);
  const bb = strip(b);
  if (!aa || !bb) return false;
  if (aa.length === 1) return bb.startsWith(aa);
  if (bb.length === 1) return aa.startsWith(bb);
  return false;
}
function namesMatch(a: string, b: string): boolean {
  const ta = tokens(a);
  const tb = tokens(b);
  if (ta.length === 0 || tb.length === 0) return false;
  if (ta.length !== tb.length) return false;
  return ta.every((t, i) => tokenEq(t, tb[i]));
}

function teamNames(team: RegistrationTeam): [string, string] {
  return [normName(team.player), normName(team.partner ?? "")];
}

export function matchToTeams(
  parsed: ParsedDrawWorkbook,
  teams: RegistrationTeam[],
): DrawMatchResult {
  const warnings: string[] = [];
  const assignments: DrawAssignment[] = [];
  const unmatched: ParsedDrawRow[] = [];
  const byCategory: Record<string, number> = {};
  const usedTeamIds = new Set<string>();
  const usedSeeds = new Set<string>();

  for (const row of parsed.rows) {
    const p1 = normName(row.player1);
    const p2 = normName(row.player2);
    const candidates = teams.filter((t) => !usedTeamIds.has(t.id));

    // 1) Exact pair match (either column order).
    let team =
      candidates.find((t) => {
        const [tp, tpa] = teamNames(t);
        return (p1 === tp && p2 === tpa) || (p1 === tpa && p2 === tp);
      }) ?? null;
    let loose = false;

    // 2) Loose pair match allowing abbreviations ("H." vs "HENDRAWAN").
    if (!team) {
      team =
        candidates.find((t) => {
          const [tp, tpa] = teamNames(t);
          return (
            (namesMatch(p1, tp) && namesMatch(p2, tpa)) ||
            (namesMatch(p1, tpa) && namesMatch(p2, tp))
          );
        }) ?? null;
      if (team) {
        loose = true;
        warnings.push(
          `Fuzzy name match: "${row.player1} / ${row.player2}" → ${team.player} / ${team.partner ?? "—"}`,
        );
      }
    }

    // 3) Fallback: match on player 1 only (flags a partner mismatch).
    if (!team && p1) {
      const single = candidates.filter(
        (t) => namesMatch(p1, t.player) || namesMatch(p1, t.partner ?? ""),
      );
      if (single.length === 1) {
        team = single[0];
        warnings.push(
          `Partner mismatch: sheet has "${row.player1} / ${row.player2 || "—"}" but registered as "${team.player} / ${team.partner ?? "—"}"`,
        );
      } else if (single.length > 1) {
        warnings.push(
          `Ambiguous player "${row.player1}" (${single.length} candidates) — left unmatched`,
        );
      }
    }

    if (!team) {
      unmatched.push(row);
      continue;
    }

    const seedKey = `${team.category}#${row.no}`;
    if (usedSeeds.has(seedKey)) {
      warnings.push(
        `Duplicate No. ${row.no} in ${team.category} ("${row.player1}")`,
      );
    }
    usedSeeds.add(seedKey);
    usedTeamIds.add(team.id);
    byCategory[team.category] = (byCategory[team.category] ?? 0) + 1;
    assignments.push({
      teamId: team.id,
      group: row.group,
      seed: row.no,
      displayName: team.player,
    });
    void loose;
  }

  for (const team of teams) {
    if (!usedTeamIds.has(team.id) && (team.group || team.seed != null)) {
      warnings.push(
        `Registered team not present in the file: ${team.player} / ${team.partner ?? "—"}`,
      );
    }
  }

  return { assignments, warnings, unmatched, byCategory };
}

// ---- Building the export workbook -----------------------------------------

function setBorders(cell: ExcelCell, style = "thin") {
  const side = { style };
  cell.border = { left: side, right: side, top: side, bottom: side };
}

function solid(cell: ExcelCell, argb: string) {
  cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb } };
}

function buildDrawSheet(
  Excel: Awaited<ReturnType<typeof loadExcel>>,
  workbook: ExcelWorkbook,
  category: string,
  rows: Array<{ no: number; player1: string; player2: string; group: string }>,
) {
  const ws = workbook.addWorksheet(categorySheetName(category));
  ws.getColumn(3).width = 38.91;
  ws.getColumn(4).width = 31.54;
  ws.getColumn(5).width = 11.63;
  ws.getRow(9).height = 15;

  ws.mergeCells("B10:E10");
  const title = ws.getCell("B10");
  title.value = categoryDisplayLabel(category).toUpperCase();
  title.font = { size: 14, bold: true, color: { argb: COLORS.white } };
  solid(title, COLORS.drawTitle);
  title.alignment = {
    horizontal: "center",
    vertical: "middle",
    wrapText: true,
  };
  setBorders(title, "medium");
  ws.getRow(10).height = 19;

  const headers = ["No.", "Player 1", "Player 2", "GROUP"];
  headers.forEach((label, i) => {
    const cell = ws.getRow(11).getCell(2 + i);
    cell.value = label;
    cell.font = { size: 14, bold: true, color: { argb: COLORS.black } };
    solid(cell, COLORS.drawHeaderGrey);
    cell.alignment = {
      horizontal: "center",
      vertical: "middle",
      wrapText: true,
    };
    setBorders(cell, "medium");
  });
  ws.getRow(11).height = 20;

  rows.forEach((row, index) => {
    const r = 12 + index;
    ws.getRow(r).height = 20;
    const values = [row.no, row.player1, row.player2, row.group];
    values.forEach((value, i) => {
      const cell = ws.getRow(r).getCell(2 + i);
      cell.value = i === 0 ? value : String(value).toUpperCase();
      cell.font = { size: 12, color: { argb: COLORS.black } };
      solid(cell, COLORS.white);
      cell.alignment = {
        horizontal: "center",
        vertical: "middle",
        wrapText: true,
      };
      setBorders(cell, "medium");
    });
  });
  void Excel;
}

function buildOopSheet(workbook: ExcelWorkbook, plan: OopPlan) {
  const ws = workbook.addWorksheet("Order Of Play");
  const courtCount = Math.max(1, plan.courts);
  const courtLabelCol = (court: number) => 5 + court * 4; // E, I, M, Q …

  // Column widths are applied at the end of the sheet build: exceljs resets
  // the stored width of columns absorbed into a merge, so setting them first
  // would lose them. See the block after the session loop below.
  const lastCol = courtLabelCol(courtCount - 1) + 3; // T for 4 courts

  const colLetter = (col: number) => {
    let n = col;
    let out = "";
    while (n > 0) {
      const rem = (n - 1) % 26;
      out = String.fromCharCode(65 + rem) + out;
      n = Math.floor((n - 1) / 26);
    }
    return out;
  };

  // Row 9 spacer, row 11 title.
  ws.mergeCells(`D9:${colLetter(lastCol)}9`);
  ws.mergeCells(`D11:${colLetter(lastCol)}11`);
  const titleCell = ws.getCell("D11");
  titleCell.value = plan.title;
  titleCell.font = { size: 16, bold: true, color: { argb: COLORS.black } };
  titleCell.alignment = { horizontal: "center", vertical: "middle" };
  ws.getRow(11).height = 22;

  // Row 12 header: TIME + one merged header per court.
  const timeHeader = ws.getRow(12).getCell(4);
  timeHeader.value = "TIME";
  timeHeader.font = { size: 12, bold: true, color: { argb: COLORS.white } };
  solid(timeHeader, COLORS.headerOrange);
  timeHeader.alignment = { horizontal: "center", vertical: "middle" };
  setBorders(timeHeader, "thin");
  for (let court = 0; court < courtCount; court++) {
    const start = courtLabelCol(court);
    ws.mergeCells(`${colLetter(start)}12:${colLetter(start + 3)}12`);
    const cell = ws.getRow(12).getCell(start);
    cell.value = `Court ${court + 1} `;
    cell.font = { size: 12, bold: true, color: { argb: COLORS.white } };
    solid(cell, COLORS.headerOrange);
    cell.alignment = { horizontal: "center", vertical: "middle" };
    setBorders(cell, "thin");
  }

  let row = 13;
  for (const session of plan.sessions) {
    session.slots.forEach((slot, slotIndex) => {
      const labelRow = row;
      const firstSlotOfSession = slotIndex === 0;

      // Time / "Followed by" column.
      const timeCell = ws.getRow(labelRow).getCell(4);
      timeCell.value = firstSlotOfSession ? session.timeLabel : "Followed by";
      timeCell.font = { size: 12, bold: true, color: { argb: COLORS.black } };
      solid(timeCell, COLORS.timeGrey);
      timeCell.alignment = {
        horizontal: "center",
        vertical: "middle",
        wrapText: true,
      };
      setBorders(timeCell, "thin");

      const entries = slot.courts;
      const firstEntry = entries.find((e) => e != null) ?? null;

      if (firstEntry && firstEntry.kind === "event") {
        // Events span the courts for the whole 4-row block.
        const spanAll = firstEntry.span === "allCourts";
        const start = courtLabelCol(0);
        const end = spanAll ? lastCol : courtLabelCol(0) + 3;
        ws.mergeCells(
          `${colLetter(start)}${labelRow}:${colLetter(end)}${labelRow + 3}`,
        );
        const cell = ws.getRow(labelRow).getCell(start);
        cell.value = firstEntry.title;
        cell.font = {
          size: spanAll ? 14 : 15,
          bold: true,
          color: { argb: COLORS.black },
        };
        solid(cell, COLORS.eventYellow);
        cell.alignment = { horizontal: "center", vertical: "middle" };
        if (!spanAll) {
          // The other courts keep their (empty) merged label blocks.
          for (let otherCourt = 1; otherCourt < courtCount; otherCourt++) {
            const other = courtLabelCol(otherCourt);
            ws.mergeCells(
              `${colLetter(other + 1)}${labelRow}:${colLetter(other + 3)}${labelRow}`,
            );
          }
        }
      } else {
        for (let court = 0; court < courtCount; court++) {
          const entry = entries[court];
          const start = courtLabelCol(court);
          // The stage label span occupies the group columns on every court,
          // including courts without a match in this slot.
          ws.mergeCells(
            `${colLetter(start + 1)}${labelRow}:${colLetter(start + 3)}${labelRow}`,
          );
          if (!entry || entry.kind !== "match") {
            // Empty court: keep the merged label span and the grid borders,
            // but leave the cells unfilled. (The reference workbook is
            // inconsistent here — the same partial-slot shape is painted
            // white, category-colored, or left unfilled depending on the
            // slot — so the export uses one clean convention.)
            for (const col of [start, start + 1]) {
              setBorders(ws.getRow(labelRow).getCell(col), "thin");
            }
            continue;
          }
          const fill = categoryFill(entry.category);
          const labelCell = ws.getRow(labelRow).getCell(start);
          labelCell.value = entry.matchLabel;
          labelCell.font = {
            size: 12,
            bold: true,
            color: { argb: COLORS.black },
          };
          solid(labelCell, fill);
          labelCell.alignment = { horizontal: "center", vertical: "middle" };
          setBorders(labelCell, "thin");

          const stageCell = ws.getRow(labelRow).getCell(start + 1);
          stageCell.value = entry.stageLabel;
          stageCell.font = {
            size: 12,
            bold: true,
            color: { argb: COLORS.black },
          };
          solid(stageCell, fill);
          stageCell.alignment = { horizontal: "center", vertical: "middle" };
          setBorders(stageCell, "thin");
        }
      }

      // Score rows (3 blank rows under the label) with a merged slot number.
      const eventSpan =
        firstEntry && firstEntry.kind === "event" ? firstEntry.span : null;
      for (let offset = 1; offset <= 3; offset++) {
        if (offset === 2 && eventSpan !== "allCourts") {
          // The reference merges the group columns of every court except the
          // last one on the middle score row (score-entry spans).
          const firstMergeCourt = eventSpan === "court1" ? 1 : 0;
          for (let court = firstMergeCourt; court < courtCount - 1; court++) {
            const mergeStart = courtLabelCol(court) + 1;
            ws.mergeCells(
              `${colLetter(mergeStart)}${labelRow + 2}:${colLetter(mergeStart + 2)}${labelRow + 2}`,
            );
          }
        }
        for (let court = 0; court < courtCount; court++) {
          if (eventSpan === "allCourts") break; // block is one merged cell
          if (eventSpan === "court1" && court === 0) continue;
          const start = courtLabelCol(court);
          const lastCourt = court === courtCount - 1;
          // Merged middle rows paint only up to the merge origin; the merge
          // covers the trailing group columns.
          const paintEnd = offset === 2 && !lastCourt ? start + 1 : start + 3;
          for (let c = start; c <= paintEnd; c++) {
            const cell = ws.getRow(labelRow + offset).getCell(c);
            solid(cell, COLORS.scoreGrey);
            setBorders(cell, "thin");
          }
        }
      }
      ws.mergeCells(`D${labelRow + 1}:D${labelRow + 3}`);
      const numberCell = ws.getRow(labelRow + 1).getCell(4);
      numberCell.value = slot.number;
      numberCell.font = { size: 12, bold: true, color: { argb: COLORS.black } };
      numberCell.alignment = { horizontal: "center", vertical: "middle" };
      setBorders(numberCell, "thin");

      row += 4;
    });
  }

  // Column widths, applied after all merges (see the note at the top of this
  // function). The court-3 / last-court quirks replicate the reference
  // workbook's manual adjustments; the other trailing group columns keep the
  // default width there too.
  ws.getColumn(4).width = 17.82; // D = time column
  for (let court = 0; court < courtCount; court++) {
    const label = courtLabelCol(court);
    ws.getColumn(label).width = 30.18;
    ws.getColumn(label + 1).width = court === 2 ? 4.45 : 4.0;
    if (court === courtCount - 1) {
      ws.getColumn(label + 2).width = 4.82;
      ws.getColumn(label + 3).width = 4.0;
    }
  }
}

export async function buildOopWorkbook(input: {
  tournament: Tournament;
  teams: RegistrationTeam[];
  plan: OopPlan;
}): Promise<Blob> {
  const Excel = await loadExcel();
  const { tournament, teams, plan } = input;
  const workbook = new Excel.Workbook();
  if (workbook.worksheets.length > 0) {
    workbook.removeWorksheet(workbook.worksheets[0].id);
  }

  // Draw sheets in scheduling order (categoryOrder first, then the rest).
  const oop = tournament.settings.oop;
  const ordered: string[] = [];
  for (const category of oop?.categoryOrder ?? []) {
    if (tournament.settings.categories.includes(category))
      ordered.push(category);
  }
  for (const category of tournament.settings.categories) {
    if (!ordered.includes(category)) ordered.push(category);
  }

  for (const category of ordered) {
    const categoryTeams = teams
      .filter((t) => t.category === category && t.group)
      .sort(
        (a, b) =>
          (a.seed ?? Number.MAX_SAFE_INTEGER) -
          (b.seed ?? Number.MAX_SAFE_INTEGER),
      );
    buildDrawSheet(
      Excel,
      workbook,
      category,
      categoryTeams.map((t) => ({
        no: t.seed ?? 0,
        player1: t.player,
        player2: t.partner ?? "",
        group: groupLetter(t.group),
      })),
    );
  }

  buildOopSheet(workbook, plan);

  const buffer = await workbook.xlsx.writeBuffer();
  return new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * The PadelCah! session plan (Aug 15 2026, 4 courts) used to pre-fill the OOP
 * settings editor: women's groups open Court 1 alongside the men's, the
 * ceremony sits before the 13:00 session, and the men's final closes the day
 * with the awarding right after it.
 */
export function padelCahOopTemplate(categories: string[]): OopSettings {
  const lower = (value: string) => value.toLowerCase();
  const women =
    categories.find((category) => lower(category).includes("women")) ??
    categories[0] ??
    "";
  const men =
    categories.find((category) => lower(category).includes("men")) ??
    categories[1] ??
    "";

  return {
    startTime: "09:00",
    slotsPerSession: 6,
    categoryOrder: women ? [women] : [],
    sessions: [
      { time: "11:00", notBefore: true },
      {
        time: "13:00",
        notBefore: true,
        eventsBefore: ["OPENING CEREMONY (SAMBUTAN)"],
      },
      { time: "15:00", notBefore: true, capacity: 5 },
      {
        time: "17:00",
        notBefore: true,
        capacity: 3,
        eventsMid: [{ title: "GAMES", afterSlot: 1 }],
      },
      {
        time: "18:00",
        notBefore: true,
        capacity: 1,
        eventsAfter: ["AWARDING"],
      },
    ],
    knockoutOrder: [
      { category: women, stage: 1 },
      { category: men, stage: 1 },
      { category: women, stage: 2 },
      { category: men, stage: 2 },
      { category: men, stage: 3 },
      { category: men, stage: "3rd-place" },
      { category: women, stage: 3 },
      { category: men, stage: 4 },
    ].filter((entry) => entry.category),
  };
}
