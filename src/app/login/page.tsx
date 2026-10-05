"use client";

import {
  ArrowLeftIcon,
  ArrowRightIcon,
  CircleNotchIcon,
  ShieldCheckIcon,
  WarningIcon,
} from "@phosphor-icons/react/dist/ssr";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";
import RadarArt from "@/components/landing/RadarArt";
import { authClient, useSession } from "@/lib/auth-client";
import { workspaceForRole } from "@/lib/roles";

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

    const workspace = workspaceForRole(session.user.role);
    const requestsAdmin =
      safeCallbackPath === "/admin" || safeCallbackPath.startsWith("/admin/");
    const requestsVerification =
      safeCallbackPath === "/verification" ||
      safeCallbackPath.startsWith("/verification/");
    window.location.href =
      (requestsAdmin && workspace !== "/admin") ||
      (requestsVerification && workspace === "/tournaments")
        ? workspace
        : safeCallbackPath;
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
    <main className="grid min-h-screen bg-canvas text-ink-950 lg:grid-cols-[1.15fr_0.85fr]">
      <section className="relative isolate hidden overflow-hidden bg-ink-950 p-10 text-cream-100 lg:flex lg:flex-col lg:justify-between xl:p-14">
        <div className="texture-grain pointer-events-none absolute inset-0 -z-10 opacity-60" />
        <div className="pointer-events-none absolute -bottom-72 -right-72 -z-10 w-[56rem] opacity-80 [&_text]:hidden">
          <RadarArt className="h-auto w-full" showCourts={false} />
        </div>

        <Link href="/" className="w-fit transition-opacity hover:opacity-80">
          <Image
            src="/tuwaga-logo-cream.png"
            alt="TUWAGA SKOR"
            unoptimized
            width={136}
            height={32}
            priority
            className="h-8 w-auto"
          />
        </Link>

        <div className="max-w-xl py-12">
          <p className="eyebrow flex items-center gap-2.5 text-cream-100/60">
            <span className="h-1.5 w-1.5 bg-brand-500" />
            Organizer workspace
          </p>
          <h1 className="mt-6 text-[clamp(2.75rem,4.5vw,4.5rem)] font-medium leading-[0.95] tracking-[-0.045em] text-cream-50">
            Run the whole tournament<span className="text-brand-500">.</span>
          </h1>
          <p className="mt-6 max-w-md text-base leading-relaxed text-cream-100/65">
            Draws, schedules, courts, scoring, and results. One workspace for
            directors, organizers, and court crew.
          </p>
        </div>

        <ol className="grid max-w-xl grid-cols-3 border-t border-cream-200/15">
          {[
            ["01", "Build the order of play"],
            ["02", "Run every court"],
            ["03", "Publish results live"],
          ].map(([number, label]) => (
            <li key={number} className="pr-4 pt-5">
              <p className="font-mono text-sm text-brand-500">{number}</p>
              <p className="mt-2 text-sm font-medium leading-snug text-cream-100/80">
                {label}
              </p>
            </li>
          ))}
        </ol>
      </section>

      <section className="flex min-w-0 flex-col items-center justify-center px-5 py-10 sm:px-10">
        <div className="w-full max-w-[420px]">
          <Link
            href="/"
            className="mb-10 inline-flex transition-opacity hover:opacity-80 lg:hidden"
          >
            <Image
              src="/tuwaga-logo.png"
              alt="TUWAGA SKOR"
              unoptimized
              width={119}
              height={28}
              priority
              className="h-7 w-auto"
            />
          </Link>

          <div className="rounded-2xl border border-ink-200 bg-white p-6 shadow-[0_24px_60px_-30px_rgba(23,23,23,0.25)] sm:p-9">
            <p className="eyebrow flex items-center gap-2 text-ink-500">
              <ShieldCheckIcon
                className="text-sm text-emerald-600"
                weight="bold"
                aria-hidden="true"
              />
              Secure sign-in
            </p>

            <h2 className="mt-5 text-3xl font-semibold tracking-[-0.03em] text-ink-950 sm:text-[2.125rem]">
              Ready to run the show?
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-ink-600">
              Sign in with your Google account to open your Tuwaga Skor
              workspace and command center.
            </p>

            <button
              type="button"
              onClick={handleSignIn}
              disabled={isLoading}
              className="btn btn-lg btn-dark btn-block mt-8 disabled:cursor-wait"
            >
              {isLoading ? (
                <>
                  <CircleNotchIcon
                    className="admin-spin text-xl"
                    weight="bold"
                    aria-hidden="true"
                  />
                  Connecting…
                </>
              ) : (
                <>
                  <span className="flex h-7 w-7 items-center justify-center rounded-md bg-white">
                    <GoogleIcon className="h-4 w-4" />
                  </span>
                  Sign in with Google
                  <ArrowRightIcon weight="bold" aria-hidden="true" />
                </>
              )}
            </button>

            {accessError && (
              <div
                role="alert"
                className="mt-5 flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-semibold text-rose-900"
              >
                <WarningIcon
                  className="mt-px shrink-0 text-base"
                  weight="bold"
                  aria-hidden="true"
                />
                <span>{accessError}</span>
              </div>
            )}

            <p className="mt-6 border-t border-ink-100 pt-5 text-xs leading-relaxed text-ink-500">
              Access is limited to approved tournament organizers and
              administrators.
            </p>
          </div>

          <Link
            href="/"
            className="link-arrow mt-8 text-ink-500 hover:text-ink-950"
          >
            <ArrowLeftIcon weight="bold" aria-hidden="true" />
            Back to Tuwaga Skor
          </Link>
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
