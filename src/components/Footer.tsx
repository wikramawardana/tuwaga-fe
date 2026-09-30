import { ArrowUpRightIcon } from "@phosphor-icons/react/dist/ssr";
import Image from "next/image";
import Link from "next/link";
import { SPORTS, SUPPORT_URL } from "@/lib/site";

const footerLinks = [
  { label: "Live Scoring", href: "/tournaments/live" },
  { label: "Bracket", href: "/tournaments/bracket" },
  { label: "Organizer Workspace", href: "/login?callbackUrl=/admin" },
];

export default function Footer() {
  return (
    <footer className="relative overflow-hidden border-t border-cream-200/10 bg-ink-950 text-cream-100">
      <div className="container-page flex flex-col gap-8 py-12 md:flex-row md:items-end md:justify-between">
        <div className="max-w-sm">
          <Link
            href="/"
            className="inline-flex items-center transition-opacity hover:opacity-80"
          >
            <Image
              src="/tuwaga-logo-cream.png"
              alt="TUWAGA SKOR"
              unoptimized
              width={136}
              height={32}
              className="h-8 w-auto"
            />
          </Link>
          <p className="eyebrow mt-4 text-brand-500">Control the Game</p>
          <p className="mt-2 text-sm leading-relaxed text-cream-100/55">
            Live scoring, brackets, and match-day operations for tournament
            organizers in Indonesia.
          </p>
        </div>

        <nav
          aria-label="Footer"
          className="flex flex-wrap gap-x-6 gap-y-3 text-sm font-medium"
        >
          {footerLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-cream-100/70 transition-colors hover:text-cream-50"
            >
              {link.label}
            </Link>
          ))}
          <Link
            href={SUPPORT_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-cream-100/70 transition-colors hover:text-cream-50"
          >
            Support
            <ArrowUpRightIcon weight="bold" aria-hidden="true" />
          </Link>
        </nav>
      </div>

      <div className="border-t border-cream-200/10">
        <div className="container-page flex flex-col gap-2 py-5 text-xs text-cream-100/45 sm:flex-row sm:items-center sm:justify-between">
          <p>© 2026 TUWAGA SKOR. All rights reserved.</p>
          <p className="font-mono uppercase tracking-[0.14em]">
            {SPORTS.join(" · ")}
          </p>
        </div>
      </div>
    </footer>
  );
}
