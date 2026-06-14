import dns from "node:dns";
import { betterAuth } from "better-auth";
import { admin, genericOAuth } from "better-auth/plugins";
import { Pool } from "pg";

dns.setDefaultResultOrder("ipv4first");

const appUrl =
  process.env.APP_URL ||
  process.env.NEXT_PUBLIC_APP_URL ||
  "http://localhost:3004";
const authServiceUrl = process.env.AUTH_URL || "http://localhost:3000";
const authClientSecret = process.env.AUTH_CLIENT_SECRET;

if (!authClientSecret) {
  throw new Error("AUTH_CLIENT_SECRET is required");
}

export const auth = betterAuth({
  baseURL: appUrl,
  basePath: "/api/auth",
  secret: process.env.BETTER_AUTH_SECRET,
  database: new Pool({
    connectionString: process.env.DATABASE_URL,
    connectionTimeoutMillis: 8000,
  }),
  advanced: {
    cookiePrefix: "tuwaga",
  },
  account: {
    skipStateCookieCheck: true,
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
          discoveryUrl: `${authServiceUrl}/api/auth/.well-known/openid-configuration`,
          scopes: ["openid", "profile", "email"],
          overrideUserInfo: true,
          mapProfileToUser: (profile: Record<string, unknown>) => {
            const appRole =
              typeof profile.app_role === "string" ? profile.app_role : "user";
            const email =
              typeof profile.email === "string"
                ? profile.email.toLowerCase()
                : undefined;

            return { email, role: appRole };
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
      enabled: true,
      maxAge: 60 * 5,
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
