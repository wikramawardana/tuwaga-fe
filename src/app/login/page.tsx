"use client";

import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";
import { authClient, useSession } from "@/lib/auth-client";

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
      setAccessError(
        "Only Tuwaga organizers and admins can access this workspace.",
      );
    }
  }, [reason]);

  useEffect(() => {
    if (isPending || !session) return;

    const isAllowed =
      session.user.role === "admin" ||
      session.user.role === "organizer" ||
      session.user.role === "panitia";
    if (!isAllowed) {
      window.location.href = "/403";
      return;
    }

    window.location.href = safeCallbackPath;
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
    <main className="relative min-h-screen overflow-hidden bg-[#f6f8fc] px-4 py-5 text-slate-900 sm:px-6 lg:p-8">
      <section className="relative mx-auto grid min-h-[calc(100vh-2.5rem)] max-w-[1440px] overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-xl lg:min-h-[calc(100vh-4rem)] lg:grid-cols-[1.2fr_0.8fr]">
        <div className="relative hidden overflow-hidden border-r border-blue-900/10 bg-gradient-to-br from-[#0c2461] via-[#1a56db] to-[#1e40af] p-10 text-white lg:flex lg:flex-col lg:justify-between xl:p-14">
          <div className="relative z-10 flex items-center justify-between">
            <Link href="/" className="transition hover:opacity-80">
              <Image
                src="/tuwaga-logo.png"
                alt="TUWAGA SKOR"
                width={132}
                height={32}
                priority
                className="h-8 w-auto brightness-0 invert"
              />
            </Link>
            <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-blue-100 backdrop-blur">
              Tuwaga Skor
            </span>
          </div>

          <div className="relative z-10 max-w-3xl py-12">
            <p className="mb-4 inline-flex text-xs font-bold uppercase tracking-wider text-blue-200">
              Tournament OS · 2026
            </p>
            <h1 className="text-4xl font-extrabold leading-tight tracking-tight text-white xl:text-5xl">
              Run the whole tournament.
            </h1>
            <p className="mt-4 max-w-lg text-base leading-relaxed text-blue-100/80">
              Draws, schedules, courts, scoring, and results. One unified
              workspace for directors, organizers, and court crew.
            </p>
          </div>

          <div className="relative z-10 grid grid-cols-3 gap-3">
            {[
              ["01", "Build OOP"],
              ["02", "Run courts"],
              ["03", "Publish live"],
            ].map(([number, label]) => (
              <div
                key={number}
                className="rounded-2xl border border-white/15 bg-white/10 p-5 text-white backdrop-blur transition hover:border-white/30"
              >
                <p className="text-2xl font-black text-white">{number}</p>
                <p className="mt-1 text-xs font-bold uppercase tracking-wider text-blue-100/80">
                  {label}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="relative flex min-w-0 items-center justify-center bg-[#f8fafc] p-5 sm:p-10 xl:p-16">
          <div className="min-w-0 w-full max-w-[440px]">
            <div className="mb-8 flex items-center justify-between lg:hidden">
              <Link href="/">
                <Image
                  src="/tuwaga-logo.png"
                  alt="TUWAGA SKOR"
                  width={124}
                  height={28}
                  priority
                  className="h-7 w-auto"
                />
              </Link>
              <span className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-bold uppercase tracking-wider text-primary">
                Workspace
              </span>
            </div>

            <div className="relative rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm sm:p-9">
              <span className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-bold uppercase tracking-wider text-primary">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                Secure sign-in
              </span>

              <h2 className="mt-6 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
                Ready to run the show?
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-slate-600">
                Sign in with your Google account to access your Tuwaga Skor
                workspace and command center.
              </p>

              <hr className="my-6 border-0 border-t border-slate-200" />

              <button
                type="button"
                onClick={handleSignIn}
                disabled={isLoading}
                className="inline-flex h-12 w-full items-center justify-center gap-3 rounded-xl bg-blue-600 px-4 text-sm font-extrabold text-white shadow-lg shadow-blue-200 transition hover:-translate-y-0.5 hover:bg-blue-700 disabled:cursor-wait disabled:opacity-60"
              >
                {isLoading ? (
                  <>
                    <span className="material-symbols-outlined admin-spin text-xl">
                      progress_activity
                    </span>
                    Connecting…
                  </>
                ) : (
                  <>
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-white shadow-xs">
                      <GoogleIcon className="h-4 w-4" />
                    </span>
                    <span>Sign in with Google</span>
                    <span className="material-symbols-outlined text-lg">
                      arrow_forward
                    </span>
                  </>
                )}
              </button>

              {accessError && (
                <div
                  role="alert"
                  className="mt-5 rounded-lg border border-error/20 bg-error-container px-4 py-3 text-xs font-semibold text-on-error-container"
                >
                  <div className="flex items-start gap-2">
                    <span className="material-symbols-outlined text-lg">
                      warning
                    </span>
                    <span>{accessError}</span>
                  </div>
                </div>
              )}

              <div className="mt-6 flex items-center gap-2.5 text-xs text-slate-500">
                <span className="material-symbols-outlined text-base text-emerald-600">
                  verified_user
                </span>
                Access is limited to approved tournament administrators.
              </div>
            </div>

            <p className="mt-8 text-center text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
              Tuwaga Admin System · Keep every court moving
            </p>
          </div>
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
