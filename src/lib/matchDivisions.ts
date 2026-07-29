export const DIVISION_SKILL_LEVELS = [
  { value: "beginner", label: "Beginner" },
  { value: "intermediate", label: "Intermediate" },
  { value: "advanced", label: "Advanced" },
  { value: "professional", label: "Professional" },
] as const;

export type DivisionSkillLevel =
  (typeof DIVISION_SKILL_LEVELS)[number]["value"];

export function divisionSkillLevel(division: string): DivisionSkillLevel {
  const normalized = division.toLowerCase();
  return (
    DIVISION_SKILL_LEVELS.find(({ value }) => normalized.includes(value))
      ?.value ?? "intermediate"
  );
}

export function createDivisionLabel(
  matchCategory: string,
  skillLevel: DivisionSkillLevel,
) {
  const category = matchCategory.trim();
  const skill =
    DIVISION_SKILL_LEVELS.find(({ value }) => value === skillLevel)?.label ??
    "Intermediate";
  return category ? `${category} — ${skill}` : "";
}

export function divisionCategoryName(division: string) {
  return division.split(/\s+[—–]\s+/)[0]?.trim() || division;
}

export function divisionSkillLabel(division: string) {
  const level = divisionSkillLevel(division);
  return (
    DIVISION_SKILL_LEVELS.find(({ value }) => value === level)?.label ??
    "Intermediate"
  );
}
