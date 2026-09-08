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
      className={`${sticky ? "sticky" : "fixed"} top-0 z-50 w-full border-b border-[#e6e3da] bg-[#faf9f6]/90 shadow-[0_1px_3px_0_rgba(0,0,0,0.02)] backdrop-blur-md`}
    >
      <nav className="mx-auto flex h-16 max-w-[1400px] items-center justify-between gap-3 px-4 md:px-10">
        <Link
          href="/"
          className="inline-flex shrink-0 items-center py-1 transition hover:opacity-80"
        >
          <Image
            src="/tuwaga-logo.png"
            alt="tuwaga skor"
            width={124}
            height={28}
            priority
            className="h-7 w-auto"
          />
        </Link>
        <div className="flex min-w-0 items-center gap-2">
          <Link
            href="/"
            className={`hidden h-9 items-center justify-center rounded-lg border px-3.5 text-xs font-bold uppercase tracking-wider transition sm:inline-flex ${
              active === "home"
                ? "border-[#111318] bg-[#111318] text-[#f5eedb]"
                : "border-transparent text-[#111318] hover:border-[#e6e3da] hover:bg-neutral-100/70"
            }`}
          >
            Home
          </Link>
          {actions.map((action) => {
            const className =
              action.variant === "primary"
                ? "bg-[#111318] text-[#f5eedb] hover:bg-neutral-800 border-[#111318]"
                : "bg-white text-[#111318] hover:bg-neutral-50 border-[#e6e3da]";

            if (action.href) {
              return (
                <Link
                  key={action.label}
                  href={action.href}
                  className={`inline-flex h-9 items-center justify-center rounded-lg border px-3 text-xs font-bold uppercase tracking-wider transition hover:-translate-y-0.5 hover:shadow-xs sm:px-4 ${className}`}
                >
                  {action.label}
                </Link>
              );
            }

            return (
              <button
                key={action.label}
                type="button"
                className={`h-9 cursor-pointer rounded-lg border px-3 text-xs font-bold uppercase tracking-wider transition hover:-translate-y-0.5 hover:shadow-xs sm:px-4 ${className}`}
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
              className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-[#e6e3da] bg-white px-3 text-xs font-bold uppercase text-rose-600 transition hover:bg-rose-50 hover:border-rose-200 disabled:cursor-wait disabled:opacity-70 sm:px-3.5"
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
