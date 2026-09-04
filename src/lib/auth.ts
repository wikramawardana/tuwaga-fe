import dns from "node:dns";
import { betterAuth } from "better-auth";
import { admin, genericOAuth } from "better-auth/plugins";
import { getAuthPool } from "./auth-pool";

dns.setDefaultResultOrder("ipv4first");

const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3004";
const authServiceUrl = process.env.AUTH_URL || "http://localhost:3000";
const authInternalUrl = process.env.AUTH_INTERNAL_URL || authServiceUrl;
const authClientSecret = process.env.AUTH_CLIENT_SECRET;

if (!authClientSecret) {
  throw new Error("AUTH_CLIENT_SECRET is required");
}

export const auth = betterAuth({
  baseURL: appUrl,
  basePath: "/api/auth",
  secret: process.env.BETTER_AUTH_SECRET,
  database: getAuthPool(),
  advanced: {
    cookiePrefix: "tuwaga",
  },
  account: {
    skipStateCookieCheck: false,
    storeStateStrategy: "database",
  },
  emailAndPassword: {
    enabled: false,
  },
  plugins: [
    genericOAuth({
      config: [
        {
          providerId: "auth",
          clientId: process.env.AUTH_CLIENT_ID || "tuwaga",
          clientSecret: authClientSecret,
          issuer: authServiceUrl,
          authorizationUrl: `${authServiceUrl}/api/auth/oauth2/authorize`,
          tokenUrl: `${authInternalUrl}/api/auth/oauth2/token`,
          userInfoUrl: `${authInternalUrl}/api/auth/oauth2/userinfo`,
          scopes: ["openid", "profile", "email"],
          overrideUserInfo: true,
          mapProfileToUser: (profile: Record<string, unknown>) => {
            const email =
              typeof profile.email === "string"
                ? profile.email.toLowerCase()
                : undefined;

            // Only set role if explicitly provided upstream; otherwise preserve assigned database role
            if (typeof profile.app_role === "string") {
              return { email, role: profile.app_role };
            }

            return { email };
          },
        },
      ],
    }),
    admin({
      defaultRole: "user",
    }),
  ],
  session: {
    expiresIn: 60 * 60 * 24,
    updateAge: 60 * 60,
    cookieCache: {
      enabled: false,
    },
  },
  trustedOrigins: [
    appUrl,
    authServiceUrl,
    "http://localhost:3004",
    "http://127.0.0.1:3004",
  ],
});

export type Session = typeof auth.$Infer.Session;
