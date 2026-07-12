"use client";

import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";
import { authClient, signOut, useSession } from "@/lib/auth-client";

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}

function LoginContent() {
  const searchParams = useSearchParams();
  const { data: session, isPending } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  const [accessError, setAccessError] = useState("");
  const callbackUrl = searchParams.get("callbackUrl") || "/admin";
  const reason = searchParams.get("reason");

  const safeCallbackPath = useMemo(() => {
    if (!callbackUrl.startsWith("/")) return "/admin";
    if (callbackUrl.startsWith("//")) return "/admin";
    return callbackUrl;
  }, [callbackUrl]);

  const getAbsoluteCallbackUrl = () => {
    if (typeof window === "undefined") return safeCallbackPath;
    return new URL(safeCallbackPath, window.location.origin).toString();
  };

  useEffect(() => {
    if (reason === "admin_required") {
      setAccessError("Only Tuwaga admins can access this workspace.");
    }
  }, [reason]);

  useEffect(() => {
    if (isPending || !session) return;

    if (session.user.role !== "admin") {
      setAccessError("Only Tuwaga admins can access this workspace.");
      signOut().catch(() => {});
      return;
    }

    if (session.user.role === "admin") {
      window.location.href = safeCallbackPath;
    }
  }, [isPending, safeCallbackPath, session]);

  const handleSignIn = async () => {
    setIsLoading(true);
    setAccessError("");
    try {
      const result = await authClient.signIn.oauth2({
        providerId: "auth",
        callbackURL: getAbsoluteCallbackUrl(),
      });

      if (result?.error) {
        setAccessError(
          result.error.message || "Sign in was rejected. Please try again.",
        );
        setIsLoading(false);
      }
    } catch (error) {
      console.error("Sign in error:", error);
      setAccessError(
        error instanceof Error
          ? error.message
          : "Sign in was rejected. Please try again.",
      );
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-background px-6 pt-24 text-on-surface">
      <section className="mx-auto flex min-h-[calc(100vh-8rem)] max-w-[420px] flex-col items-center justify-center">
        <div className="w-full rounded-lg border border-outline-variant/30 bg-white p-8 shadow-[0_12px_40px_rgba(15,23,42,0.08)]">
          <Image
            src="/tuwaga-logo.png"
            alt="TUWAGA"
            width={132}
            height={36}
            className="mx-auto h-9 w-auto"
            priority
          />

          <div className="mt-8 text-center">
            <h1 className="text-2xl font-extrabold tracking-tight">
              Admin sign in
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-on-surface-variant">
              Continue with Google to manage tournaments and scoring.
            </p>
          </div>

          <button
            type="button"
            onClick={handleSignIn}
            disabled={isLoading}
            className="mt-8 inline-flex h-12 w-full items-center justify-center gap-3 rounded-lg border border-outline-variant/40 bg-white px-5 text-sm font-bold text-on-surface shadow-[0_6px_20px_rgba(15,23,42,0.08)] transition-colors hover:bg-surface-container-low disabled:cursor-wait disabled:opacity-70"
          >
            {isLoading ? (
              "Redirecting..."
            ) : (
              <>
                <GoogleIcon className="h-5 w-5" />
                <span>Continue with Google</span>
              </>
            )}
          </button>

          {accessError && (
            <div className="mt-5 rounded-lg border border-error/20 bg-error-container px-4 py-3 text-sm font-semibold text-on-error-container">
              {accessError}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginContent />
    </Suspense>
  );
}
