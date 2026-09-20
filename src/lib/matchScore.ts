/**
 * Simplifies a detailed score (e.g. "11-3, 3-11, 11-6, 11-6")
 * into the sets won score (e.g. "3-1").
 */
export function simplifyScore(
  score: string | undefined | null,
  scoreSets?: Array<{ teamA: number; teamB: number }>,
): string {
  // If scoreSets is provided and non-empty, determine sets won directly
  if (scoreSets && scoreSets.length > 0) {
    let setsA = 0;
    let setsB = 0;
    for (const s of scoreSets) {
      if (s.teamA > s.teamB) setsA++;
      else if (s.teamB > s.teamA) setsB++;
    }
    if (setsA > 0 || setsB > 0) {
      return `${setsA}-${setsB}`;
    }
  }

  if (!score || typeof score !== "string") return "";
  const trimmed = score.trim();
  if (!trimmed || trimmed === "0-0" || trimmed === "0 - 0") return trimmed;

  // Extract all "X-Y" or "X:Y" patterns
  const regex = /(\d+)\s*[-:]\s*(\d+)/g;
  const matches: Array<{ a: number; b: number }> = [];
  let m: RegExpExecArray | null = regex.exec(trimmed);
  while (m !== null) {
    const a = Number.parseInt(m[1], 10);
    const b = Number.parseInt(m[2], 10);
    if (!Number.isNaN(a) && !Number.isNaN(b)) {
      matches.push({ a, b });
    }
    m = regex.exec(trimmed);
  }

  if (matches.length > 1) {
    let setsA = 0;
    let setsB = 0;
    for (const { a, b } of matches) {
      if (a > b) setsA++;
      else if (b > a) setsB++;
    }
    return `${setsA}-${setsB}`;
  }

  if (matches.length === 1) {
    const { a, b } = matches[0];
    // If numbers are small (<= 4 each and total <= 7), it's already a sets score like "3-1" or "2-0"
    if (a <= 4 && b <= 4 && a + b <= 7) {
      return `${a}-${b}`;
    }
    // If it's a single set match with high game points (e.g. "11-4" or "21-19")
    if (a > b) return "1-0";
    if (b > a) return "0-1";
  }

  return trimmed;
}

/**
 * Returns formatted display score:
 * - primary: simplified score, e.g. "3-1"
 * - details: original points string if different, e.g. "11-3, 3-11, 11-6, 11-6"
 */
export function formatMatchScore(
  score: string | undefined | null,
  scoreSets?: Array<{ teamA: number; teamB: number }>,
): {
  primary: string;
  details: string | null;
} {
  const simplified = simplifyScore(score, scoreSets);
  const raw = score?.trim() || "";
  const hasDetails = Boolean(raw && simplified && simplified !== raw);

  return {
    primary: simplified || raw || "-",
    details: hasDetails ? raw : null,
  };
}
