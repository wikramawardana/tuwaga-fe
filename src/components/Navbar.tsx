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
      className={`${sticky ? "sticky" : "fixed"} top-0 z-50 w-full border-b border-outline-variant/20 bg-white/85 shadow-[0px_4px_20px_rgba(0,0,0,0.03)] backdrop-blur-xl`}
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
            className={`hidden h-10 items-center justify-center rounded-lg px-4 text-sm font-semibold transition-colors sm:inline-flex ${
              active === "home"
                ? "bg-primary/8 text-primary"
                : "text-on-surface hover:bg-surface-container-low"
            }`}
          >
            Home
          </Link>
          {actions.map((action) => {
            const className =
              action.variant === "primary"
                ? "bg-primary text-on-primary hover:bg-primary/90"
                : "text-on-surface hover:bg-surface-container-low";

            if (action.href) {
              return (
                <Link
                  key={action.label}
                  href={action.href}
                  className={`inline-flex h-10 items-center justify-center rounded-lg px-4 text-sm font-semibold transition-colors ${className}`}
                >
                  {action.label}
                </Link>
              );
            }

            return (
              <button
                key={action.label}
                type="button"
                className={`inline-flex h-10 cursor-pointer items-center justify-center rounded-lg px-4 text-sm font-semibold transition-colors ${className}`}
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
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-outline-variant px-4 text-sm font-semibold text-on-surface transition-colors hover:bg-surface-container-low disabled:cursor-wait disabled:opacity-70"
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
