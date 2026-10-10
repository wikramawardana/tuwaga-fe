import { redirect } from "next/navigation";

// Ends the identity provider (authentik) SSO session after the Tuwaga session
// has been cleared client-side. The target always comes from the server-side
// OIDC discovery document, never from the request, so this is not an open
// redirect.

let cachedEndSessionEndpoint: string | null = null;

async function getEndSessionEndpoint(): Promise<string | null> {
  if (cachedEndSessionEndpoint) return cachedEndSessionEndpoint;

  const discoveryUrl = process.env.AUTH_DISCOVERY_URL;
  if (!discoveryUrl) return null;

  try {
    const response = await fetch(discoveryUrl, {
      headers: { Accept: "application/json" },
      cache: "no-store",
      signal: AbortSignal.timeout(5000),
    });
    if (!response.ok) return null;

    const discovery = (await response.json()) as {
      end_session_endpoint?: unknown;
    };
    const endpoint = discovery.end_session_endpoint;
    if (typeof endpoint !== "string") return null;

    const url = new URL(endpoint);
    if (url.protocol !== "https:" && url.protocol !== "http:") return null;

    cachedEndSessionEndpoint = url.toString();
    return cachedEndSessionEndpoint;
  } catch {
    return null;
  }
}

export async function GET() {
  const endSessionEndpoint = await getEndSessionEndpoint();
  redirect(endSessionEndpoint ?? "/");
}
