"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { signOut, useSession } from "@/lib/auth-client";

type NavbarAction = {
  label: string;
  href?: string;
  variant?: "primary" | "secondary";
};

type NavbarProps = {
  active?: "home" | "register" | "live" | "bracket" | "admin" | "tournaments";
  actions?: NavbarAction[];
  sticky?: boolean;
};

export default function Navbar({
  active = "home",
  actions = [{ label: "Support", href: "https://wa.me/6281234567890" }],
  sticky = false,
}: NavbarProps) {
  const { data: session } = useSession();
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleSignOut = async () => {
    setIsSigningOut(true);

    try {
      await signOut();
    } finally {
      window.location.href = "/login?callbackUrl=/admin";
    }
  };

  const isUserAuthenticated = Boolean(session?.user);

  return (
    <header
      className={`${sticky ? "sticky" : "fixed"} top-0 z-50 w-full border-b border-slate-200/80 bg-white/90 shadow-[0px_4px_20px_rgba(0,0,0,0.03)] backdrop-blur-xl`}
    >
      <nav className="mx-auto flex h-16 max-w-[1200px] items-center justify-between gap-3 px-4 md:px-10">
        <Link
          href="/"
          className="inline-flex shrink-0 items-center py-1 transition-opacity hover:opacity-80"
        >
          <Image
            src="/tuwaga-logo.png"
            alt="TUWAGA SKOR"
            width={124}
            height={28}
            priority
            className="h-7 w-auto"
          />
        </Link>

        {/* Center / primary navigation links */}
        <div className="hidden items-center gap-1 sm:flex">
          <Link
            href="/"
            className={`inline-flex h-9 items-center justify-center rounded-lg px-3.5 text-xs font-semibold transition-colors ${
              active === "home"
                ? "bg-primary/10 text-primary"
                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
            }`}
          >
            Home
          </Link>
          <Link
            href="/tournaments/live"
            className={`inline-flex h-9 items-center justify-center rounded-lg px-3.5 text-xs font-semibold transition-colors ${
              active === "live"
                ? "bg-primary/10 text-primary"
                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
            }`}
          >
            Live Scoring
          </Link>
          <Link
            href="/tournaments/bracket"
            className={`inline-flex h-9 items-center justify-center rounded-lg px-3.5 text-xs font-semibold transition-colors ${
              active === "bracket"
                ? "bg-primary/10 text-primary"
                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
            }`}
          >
            Bracket
          </Link>
        </div>

        {/* Right side actions */}
        <div className="flex min-w-0 items-center gap-2">
          {actions.map((action) => {
            const className =
              action.variant === "primary"
                ? "bg-primary text-white hover:bg-primary/90"
                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900";

            if (action.href) {
              return (
                <Link
                  key={action.label}
                  href={action.href}
                  className={`hidden h-9 items-center justify-center rounded-lg px-3 text-xs font-semibold transition-colors md:inline-flex ${className}`}
                >
                  {action.label}
                </Link>
              );
            }

            return (
              <button
                key={action.label}
                type="button"
                className={`hidden h-9 cursor-pointer items-center justify-center rounded-lg px-3 text-xs font-semibold transition-colors md:inline-flex ${className}`}
              >
                {action.label}
              </button>
            );
          })}

          {/* User Auth status: If logged in, show Workspace / Sign Out; If not, show Log in */}
          {isUserAuthenticated ? (
            <div className="flex items-center gap-2">
              {active !== "admin" && (
                <Link
                  href="/admin"
                  className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-primary px-3.5 text-xs font-semibold text-white shadow-xs transition hover:bg-primary/90"
                >
                  <span className="material-symbols-outlined text-base">
                    space_dashboard
                  </span>
                  <span>Workspace</span>
                </Link>
              )}
              <button
                type="button"
                onClick={handleSignOut}
                disabled={isSigningOut}
                className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 shadow-xs transition hover:bg-slate-50 hover:text-slate-900 disabled:cursor-wait disabled:opacity-70"
                title="Sign out"
              >
                <span className="material-symbols-outlined text-base">
                  logout
                </span>
                <span className="hidden sm:inline">
                  {isSigningOut ? "Signing out..." : "Sign out"}
                </span>
              </button>
            </div>
          ) : (
            <Link
              href="/login?callbackUrl=/admin"
              className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 text-xs font-semibold text-slate-700 shadow-xs transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900"
            >
              <span className="material-symbols-outlined text-base text-slate-500">
                login
              </span>
              <span>Log in</span>
            </Link>
          )}
        </div>
      </nav>
    </header>
  );
}
