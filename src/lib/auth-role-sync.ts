import "server-only";
import type { TuwagaRole } from "./roles";

export async function syncRoleToAuth(email: string, role: TuwagaRole) {
  const clientId = process.env.AUTH_CLIENT_ID;
  const clientSecret = process.env.AUTH_CLIENT_SECRET;
  const baseUrl = process.env.AUTH_INTERNAL_URL || process.env.AUTH_URL;
  if (!clientId || !clientSecret || !baseUrl)
    throw new Error("Auth role synchronization is not configured");
  const response = await fetch(
    `${baseUrl.replace(/\/$/, "")}/api/internal/tuwaga-roles`,
    {
      method: "PUT",
      headers: {
        Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, role }),
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
    },
  );
  if (!response.ok)
    throw new Error(
      "Auth could not synchronize the role. Check the Auth deployment and Tuwaga client allowlist, then retry.",
    );
}
