"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { signOut } from "@/lib/auth-client";

type NavbarAction = {
  label: string;
  href?: string;
  variant?: "primary" | "secondary";
};

type NavbarProps = {
  active?: "home" | "register" | "live" | "bracket" | "admin";
  actions?: NavbarAction[];
  sticky?: boolean;
};

export default function Navbar({
  active = "home",
  actions = [{ label: "Support", href: "https://wa.me/6281234567890" }],
  sticky = false,
}: NavbarProps) {
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleSignOut = async () => {
    setIsSigningOut(true);

    try {
      await signOut();
    } finally {
      window.location.href = "/login?callbackUrl=/admin";
    }
  };

  return (
    <header
      className={`${sticky ? "sticky" : "fixed"} top-0 z-50 w-full border-b border-[#E6E3DA] bg-[#FAF9F6]/90 shadow-[0_1px_3px_0_rgba(0,0,0,0.02)] backdrop-blur-md`}
    >
      <nav className="mx-auto flex h-16 max-w-[1200px] items-center justify-between gap-3 px-4 md:px-10">
        <Link
          href="/"
          className="inline-flex shrink-0 items-center py-1 transition-opacity hover:opacity-80"
        >
          <Image
            src="/tuwaga-logo.png"
            alt="TUWAGA"
            width={124}
            height={28}
            priority
            className="h-7 w-auto"
          />
        </Link>
        <div className="flex min-w-0 items-center gap-2">
          <Link
            href="/"
            className={`hidden h-9 items-center justify-center rounded-lg px-3.5 text-sm font-medium transition-colors sm:inline-flex ${
              active === "home"
                ? "bg-[#0C0D11] text-[#F5EEDB]"
                : "text-neutral-700 hover:bg-neutral-100/70"
            }`}
          >
            Home
          </Link>
          {actions.map((action) => {
            const className =
              action.variant === "primary"
                ? "bg-[#0C0D11] text-[#F5EEDB] hover:bg-neutral-800"
                : "border border-[#E6E3DA] bg-white text-neutral-800 hover:bg-neutral-50 shadow-xs";

            if (action.href) {
              return (
                <Link
                  key={action.label}
                  href={action.href}
                  className={`inline-flex h-9 items-center justify-center rounded-lg px-3.5 text-sm font-medium transition-colors ${className}`}
                >
                  {action.label}
                </Link>
              );
            }

            return (
              <button
                key={action.label}
                type="button"
                className={`inline-flex h-9 cursor-pointer items-center justify-center rounded-lg px-3.5 text-sm font-medium transition-colors ${className}`}
              >
                {action.label}
              </button>
            );
          })}
          {active === "admin" && (
            <button
              type="button"
              onClick={handleSignOut}
              disabled={isSigningOut}
              className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-[#E6E3DA] bg-white px-3 text-sm font-medium text-rose-600 transition-colors hover:bg-rose-50 hover:border-rose-200 disabled:cursor-wait disabled:opacity-70 sm:px-3.5"
            >
              <span className="material-symbols-outlined text-lg">logout</span>
              <span className="hidden sm:inline">
                {isSigningOut ? "Signing out..." : "Sign out"}
              </span>
            </button>
          )}
        </div>
      </nav>
    </header>
  );
}
