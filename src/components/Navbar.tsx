"use client";

import Image from "next/image";
import Link from "next/link";

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
  return (
    <header
      className={`${sticky ? "sticky" : "fixed"} top-0 w-full z-50 bg-white/85 backdrop-blur-xl border-b border-outline-variant/20 shadow-[0px_4px_20px_rgba(0,0,0,0.03)]`}
    >
      <nav className="max-w-[1200px] mx-auto px-6 md:px-10 flex items-center justify-between h-16">
        <Link href="/" className="inline-flex items-center">
          <Image
            src="/tuwaga-logo.png"
            alt="TUWAGA"
            width={104}
            height={28}
            className="h-7 w-auto"
            priority
          />
        </Link>
        <div className="flex items-center gap-2">
          <Link
            href="/"
            className={`inline-flex h-10 items-center justify-center rounded-lg px-4 text-sm font-semibold transition-colors ${
              active === "home"
                ? "bg-primary/8 text-primary"
                : "text-on-surface hover:bg-surface-container-low"
            }`}
          >
            Home
          </Link>
          <Link
            href="/admin"
            className={`hidden h-10 items-center justify-center rounded-lg px-4 text-sm font-semibold transition-colors sm:inline-flex ${
              active === "admin"
                ? "bg-primary/8 text-primary"
                : "text-on-surface hover:bg-surface-container-low"
            }`}
          >
            Admin
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
                className={`h-10 rounded-lg px-4 text-sm font-semibold transition-colors cursor-pointer ${className}`}
              >
                {action.label}
              </button>
            );
          })}
        </div>
      </nav>
    </header>
  );
}
