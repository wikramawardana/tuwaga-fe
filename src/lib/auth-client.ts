"use client";

import { adminClient, genericOAuthClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

const getBaseURL = () => {
  if (typeof window !== "undefined") {
    return window.location.origin;
  }

  return process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3004";
};

export const authClient = createAuthClient({
  baseURL: getBaseURL(),
  plugins: [adminClient(), genericOAuthClient()],
});

export const { signIn, signOut, useSession, getSession } = authClient;

/**
 * User-initiated sign-out: clears the Tuwaga session, then ends the identity
 * provider (authentik) SSO session so the next login can pick another account.
 * Silent sign-outs (e.g. after an API 401) should keep using `signOut` only.
 */
export async function signOutEverywhere() {
  try {
    await signOut();
  } catch {
    // Still end the IdP session below.
  }

  window.location.href = "/api/idp-logout";
}
