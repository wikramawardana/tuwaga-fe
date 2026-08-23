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
      className={`${sticky ? "sticky" : "fixed"} top-0 z-50 w-full border-b-[3px] border-[#07142f] bg-[#f5f7ff]/95 shadow-[0_5px_0_#07142f] backdrop-blur-xl`}
    >
      <nav className="mx-auto flex h-16 max-w-[1400px] items-center justify-between gap-3 px-4 md:px-10">
        <Link
          href="/"
          className="inline-flex shrink-0 items-center border-2 border-[#07142f] bg-white px-3 py-2 shadow-[3px_3px_0_#07142f] transition hover:-translate-y-0.5 hover:shadow-[5px_5px_0_#07142f]"
        >
          <Image
            src="/tuwaga-logo.png"
            alt="TUWAGA"
            width={104}
            height={28}
            priority
          />
        </Link>
        <div className="flex min-w-0 items-center gap-2">
          <Link
            href="/"
            className={`hidden h-10 items-center justify-center border-2 border-[#07142f] px-4 text-xs font-black uppercase shadow-[3px_3px_0_#07142f] transition sm:inline-flex ${
              active === "home"
                ? "bg-[#55dfff] text-[#07142f]"
                : "bg-white text-[#07142f] hover:bg-blue-100"
            }`}
          >
            Home
          </Link>
          {actions.map((action) => {
            const className =
              action.variant === "primary"
                ? "bg-[#246bfe] text-white hover:bg-blue-700"
                : "bg-[#ffe45c] text-[#07142f] hover:bg-yellow-300";

            if (action.href) {
              return (
                <Link
                  key={action.label}
                  href={action.href}
                  className={`inline-flex h-10 items-center justify-center border-2 border-[#07142f] px-3 text-xs font-black uppercase shadow-[3px_3px_0_#07142f] transition hover:-translate-y-0.5 hover:shadow-[5px_5px_0_#07142f] sm:px-4 ${className}`}
                >
                  {action.label}
                </Link>
              );
            }

            return (
              <button
                key={action.label}
                type="button"
                className={`h-10 cursor-pointer border-2 border-[#07142f] px-3 text-xs font-black uppercase shadow-[3px_3px_0_#07142f] transition hover:-translate-y-0.5 hover:shadow-[5px_5px_0_#07142f] sm:px-4 ${className}`}
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
              className="inline-flex h-10 items-center justify-center gap-2 border-2 border-[#07142f] bg-white px-3 text-xs font-black uppercase text-[#07142f] shadow-[3px_3px_0_#07142f] transition hover:bg-rose-100 disabled:cursor-wait disabled:opacity-70 sm:px-4"
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
