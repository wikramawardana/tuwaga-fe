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
