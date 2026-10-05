export const TUWAGA_ROLES = ["admin", "organizer", "eo", "user"] as const;
export type TuwagaRole = (typeof TUWAGA_ROLES)[number];

export function normalizeTuwagaRole(value: unknown): TuwagaRole {
  if (value === "panitia") return "organizer";
  return typeof value === "string" &&
    (TUWAGA_ROLES as readonly string[]).includes(value)
    ? (value as TuwagaRole)
    : "user";
}

export function workspaceForRole(role: unknown) {
  switch (normalizeTuwagaRole(role)) {
    case "admin":
    case "organizer":
      return "/admin";
    case "eo":
      return "/verification";
    default:
      return "/tournaments";
  }
}
