"use client";

import {
  ListIcon,
  SignInIcon,
  SignOutIcon,
  SquaresFourIcon,
  WhatsappLogoIcon,
  XIcon,
} from "@phosphor-icons/react/dist/ssr";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { signOut, useSession } from "@/lib/auth-client";
import { workspaceForRole } from "@/lib/roles";
import { SUPPORT_URL } from "@/lib/site";

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

const links = [
  { id: "home", label: "Home", href: "/" },
  { id: "live", label: "Live Scoring", href: "/tournaments/live" },
  { id: "bracket", label: "Bracket", href: "/tournaments/bracket" },
] as const;

export default function Navbar({
  active = "home",
  actions = [{ label: "Support", href: SUPPORT_URL }],
  sticky = false,
}: NavbarProps) {
  const { data: session } = useSession();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const handleSignOut = async () => {
    setIsSigningOut(true);

    try {
      await signOut();
    } finally {
      window.location.href = "/login?callbackUrl=/admin";
    }
  };

  const isUserAuthenticated = Boolean(session?.user);
  const workspace = workspaceForRole(session?.user.role);
  const container = active === "admin" ? "container-wide" : "container-page";

  return (
    <header
      className={`${sticky ? "sticky" : "fixed"} inset-x-0 top-0 z-50 border-b border-cream-200/10 bg-ink-950 text-cream-100`}
    >
      <nav
        aria-label="Main"
        className={`${container} flex h-16 items-center justify-between gap-4`}
      >
        <Link
          href="/"
          className="inline-flex shrink-0 items-center py-1 transition-opacity hover:opacity-80"
        >
          <Image
            src="/tuwaga-logo-cream.png"
            alt="TUWAGA SKOR"
            unoptimized
            width={119}
            height={28}
            priority
            className="h-7 w-auto"
          />
        </Link>

        <div className="hidden items-center gap-1 md:flex">
          {links.map((link) => {
            const isActive = active === link.id;
            return (
              <Link
                key={link.id}
                href={link.href}
                aria-current={isActive ? "page" : undefined}
                className={`inline-flex h-9 items-center gap-2 rounded-lg px-3.5 text-[13px] font-medium transition-colors ${
                  isActive
                    ? "text-cream-50"
                    : "text-cream-100/60 hover:bg-cream-200/5 hover:text-cream-50"
                }`}
              >
                {isActive && (
                  <span className="h-1.5 w-1.5 rounded-full bg-brand-500" />
                )}
                {link.label}
              </Link>
            );
          })}
        </div>

        <div className="flex min-w-0 items-center gap-2">
          {actions.map((action) =>
            action.href ? (
              <Link
                key={action.label}
                href={action.href}
                target={action.href.startsWith("http") ? "_blank" : undefined}
                rel={
                  action.href.startsWith("http")
                    ? "noopener noreferrer"
                    : undefined
                }
                className={`btn btn-sm hidden lg:inline-flex ${
                  action.variant === "primary"
                    ? "btn-primary"
                    : "btn-ghost-dark"
                }`}
              >
                {action.href === SUPPORT_URL && (
                  <WhatsappLogoIcon weight="bold" aria-hidden="true" />
                )}
                {action.label}
              </Link>
            ) : (
              <button
                key={action.label}
                type="button"
                className={`btn btn-sm hidden lg:inline-flex ${
                  action.variant === "primary"
                    ? "btn-primary"
                    : "btn-ghost-dark"
                }`}
              >
                {action.label}
              </button>
            ),
          )}

          {isUserAuthenticated ? (
            <>
              {active !== "admin" && (
                <Link
                  href={workspace}
                  className="btn btn-sm btn-primary hidden sm:inline-flex"
                >
                  <SquaresFourIcon weight="bold" aria-hidden="true" />
                  Workspace
                </Link>
              )}
              <button
                type="button"
                onClick={handleSignOut}
                disabled={isSigningOut}
                className="btn btn-sm btn-outline-dark hidden sm:inline-flex"
                title="Sign out"
              >
                <SignOutIcon weight="bold" aria-hidden="true" />
                <span className="hidden lg:inline">
                  {isSigningOut ? "Signing out…" : "Sign out"}
                </span>
              </button>
            </>
          ) : (
            <Link
              href="/login?callbackUrl=/admin"
              className="btn btn-sm btn-outline-dark hidden sm:inline-flex"
            >
              <SignInIcon weight="bold" aria-hidden="true" />
              Log in
            </Link>
          )}

          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            className="btn btn-sm btn-icon btn-ghost-dark md:hidden"
          >
            {menuOpen ? (
              <XIcon className="text-lg" weight="bold" aria-hidden="true" />
            ) : (
              <ListIcon className="text-lg" weight="bold" aria-hidden="true" />
            )}
          </button>
        </div>
      </nav>

      {menuOpen && (
        <div
          id="mobile-menu"
          className="border-t border-cream-200/10 bg-ink-950 md:hidden"
        >
          <div className={`${container} flex flex-col gap-1 py-4`}>
            {links.map((link) => {
              const isActive = active === link.id;
              return (
                <Link
                  key={link.id}
                  href={link.href}
                  onClick={() => setMenuOpen(false)}
                  aria-current={isActive ? "page" : undefined}
                  className={`flex h-11 items-center gap-2.5 rounded-lg px-3 text-sm font-medium ${
                    isActive
                      ? "bg-cream-200/5 text-cream-50"
                      : "text-cream-100/70 hover:bg-cream-200/5"
                  }`}
                >
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${isActive ? "bg-brand-500" : "bg-cream-200/20"}`}
                  />
                  {link.label}
                </Link>
              );
            })}

            <div className="mt-3 grid grid-cols-2 gap-2 border-t border-cream-200/10 pt-4">
              {isUserAuthenticated ? (
                <>
                  <Link href={workspace} className="btn btn-primary">
                    <SquaresFourIcon weight="bold" aria-hidden="true" />
                    Workspace
                  </Link>
                  <button
                    type="button"
                    onClick={handleSignOut}
                    disabled={isSigningOut}
                    className="btn btn-outline-dark"
                  >
                    <SignOutIcon weight="bold" aria-hidden="true" />
                    {isSigningOut ? "Signing out…" : "Sign out"}
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/login?callbackUrl=/admin"
                    className="btn btn-cream"
                  >
                    <SignInIcon weight="bold" aria-hidden="true" />
                    Log in
                  </Link>
                  <Link
                    href={SUPPORT_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-outline-dark"
                  >
                    <WhatsappLogoIcon weight="bold" aria-hidden="true" />
                    Support
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
