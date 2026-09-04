"use client";

import Image from "next/image";
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
    <main className="neo-login relative min-h-screen overflow-hidden px-4 py-5 text-[#07142f] sm:px-6 lg:p-8">
      <div className="neo-dot-field pointer-events-none absolute -left-12 -top-12 h-48 w-48 rotate-6 opacity-30" />
      <div className="pointer-events-none absolute -bottom-12 -right-12 h-48 w-48 rotate-12 border-4 border-[#07142f] bg-[#55dfff]" />

      <section className="relative mx-auto grid min-h-[calc(100vh-2.5rem)] max-w-[1440px] overflow-hidden border-4 border-[#07142f] bg-white shadow-[10px_10px_0_#07142f] lg:min-h-[calc(100vh-4rem)] lg:grid-cols-[1.2fr_0.8fr]">
        <div className="relative hidden overflow-hidden border-r-4 border-[#07142f] bg-[#246bfe] p-10 text-white lg:flex lg:flex-col lg:justify-between xl:p-14">
          <div className="neo-dot-field absolute -right-12 top-24 h-56 w-56 rotate-12 border-4 border-[#07142f] bg-[#55dfff] opacity-90" />
          <div className="absolute -right-10 bottom-16 h-40 w-40 rounded-full border-4 border-[#07142f] bg-[#ffe45c]" />

          <div className="relative z-10 flex items-center justify-between">
            <div className="border-3 border-[#07142f] bg-white px-5 py-3 shadow-[5px_5px_0_#07142f]">
              <Image
                src="/tuwaga-logo.png"
                alt="TUWAGA"
                width={132}
                height={36}
                priority
              />
            </div>
            <span className="neo-sticker rotate-2">Admin only</span>
          </div>

          <div className="relative z-10 max-w-3xl py-12">
            <p className="mb-6 inline-flex border-2 border-[#07142f] bg-[#55dfff] px-3 py-2 text-xs font-black uppercase tracking-[0.18em] text-[#07142f] shadow-[4px_4px_0_#07142f]">
              Tournament OS / 2026
            </p>
            <h1 className="text-6xl font-black uppercase leading-[0.82] tracking-[-0.075em] xl:text-8xl">
              Run the
              <span className="my-3 block w-fit -rotate-1 border-4 border-[#07142f] bg-[#ffe45c] px-3 py-2 text-[#07142f] shadow-[7px_7px_0_#07142f]">
                whole
              </span>
              tournament.
            </h1>
            <p className="mt-8 max-w-lg border-l-4 border-[#ffe45c] pl-5 text-lg font-bold leading-7">
              Draws, schedules, courts, scoring, and results. One focused
              workspace for a sharp tournament crew.
            </p>
          </div>

          <div className="relative z-10 grid grid-cols-3 gap-3">
            {[
              ["01", "Build OOP"],
              ["02", "Run courts"],
              ["03", "Publish live"],
            ].map(([number, label], index) => (
              <div
                key={number}
                className={`border-3 border-[#07142f] p-4 text-[#07142f] shadow-[4px_4px_0_#07142f] ${index === 1 ? "bg-[#55dfff]" : "bg-white"}`}
              >
                <p className="text-2xl font-black">{number}</p>
                <p className="mt-1 text-xs font-black uppercase tracking-wider">
                  {label}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="relative flex min-w-0 items-center justify-center bg-[#f5f7ff] p-5 sm:p-10 xl:p-16">
          <div className="min-w-0 w-full max-w-[470px]">
            <div className="mb-10 flex items-center justify-between lg:hidden">
              <Image
                src="/tuwaga-logo.png"
                alt="TUWAGA"
                width={132}
                height={36}
                priority
              />
              <span className="neo-sticker rotate-2">Admin</span>
            </div>

            <div className="neo-corner-mark relative border-4 border-[#07142f] bg-white p-6 shadow-[8px_8px_0_#07142f] sm:p-9">
              <span className="inline-flex items-center gap-2 border-2 border-[#07142f] bg-[#55dfff] px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.16em] shadow-[3px_3px_0_#07142f]">
                <span className="h-2 w-2 rounded-full bg-[#07142f]" />
                Secure crew entrance
              </span>

              <h2 className="neo-title mt-7 text-4xl font-black sm:text-5xl">
                Ready to run the show?
              </h2>
              <p className="mt-4 max-w-sm text-sm font-semibold leading-6 text-slate-600">
                Sign in with your authorized Google account to open the Tuwaga
                admin command center.
              </p>

              <hr className="neo-rule my-7" />

              <button
                type="button"
                onClick={handleSignIn}
                disabled={isLoading}
                className="neo-button inline-flex h-14 min-w-0 w-full items-center justify-center gap-2 bg-[#246bfe] px-3 text-xs font-black uppercase tracking-wide text-white hover:bg-blue-700 disabled:cursor-wait disabled:opacity-60 sm:gap-3 sm:px-5 sm:text-sm"
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
                    <span className="flex h-8 w-8 items-center justify-center border-2 border-[#07142f] bg-white">
                      <GoogleIcon className="h-5 w-5" />
                    </span>
                    <span>Sign in with Google</span>
                    <span className="material-symbols-outlined hidden text-xl sm:inline">
                      arrow_forward
                    </span>
                  </>
                )}
              </button>

              {accessError && (
                <div
                  role="alert"
                  className="mt-5 bg-rose-200 px-4 py-3 text-sm font-black text-rose-950"
                >
                  <div className="flex items-start gap-2">
                    <span className="material-symbols-outlined text-xl">
                      warning
                    </span>
                    <span>{accessError}</span>
                  </div>
                </div>
              )}

              <div className="mt-6 flex items-center gap-3 text-xs font-bold text-slate-500">
                <span className="material-symbols-outlined text-lg text-[#246bfe]">
                  verified_user
                </span>
                Access is limited to approved tournament administrators.
              </div>
            </div>

            <p className="mt-8 text-center text-[11px] font-black uppercase tracking-[0.18em] text-slate-500">
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
