"use client";

import { ProhibitIcon } from "@phosphor-icons/react/dist/ssr";
import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import RadarArt from "@/components/landing/RadarArt";

/** Shared 403 screen for the /403 route and the admin role guard. */
export default function AccessDenied({
  title,
  description,
  email,
  role,
  onSignOut,
}: {
  title: string;
  description: ReactNode;
  email?: string | null;
  role?: string | null;
  onSignOut: () => void;
}) {
  return (
    <main className="relative isolate flex min-h-screen flex-col overflow-hidden bg-ink-950 text-cream-100">
      <div className="texture-grain pointer-events-none absolute inset-0 -z-10 opacity-60" />
      <div className="pointer-events-none absolute -right-80 top-1/2 -z-10 w-[60rem] -translate-y-1/2 opacity-60 [&_text]:hidden">
        <RadarArt className="h-auto w-full" showCourts={false} />
      </div>
      <p
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-10 -left-4 -z-10 select-none font-mono text-[clamp(10rem,30vw,22rem)] leading-none text-cream-200/[0.04]"
      >
        403
      </p>

      <header className="container-page flex h-16 items-center">
        <Link href="/" className="transition-opacity hover:opacity-80">
          <Image
            src="/tuwaga-logo-cream.png"
            alt="TUWAGA SKOR"
            unoptimized
            width={119}
            height={28}
            className="h-7 w-auto"
          />
        </Link>
      </header>

      <div className="container-page flex flex-1 items-center py-12">
        <div className="w-full max-w-xl">
          <p className="eyebrow flex items-center gap-2.5 text-brand-500">
            <ProhibitIcon weight="bold" aria-hidden="true" />
            Error 403 · Akses ditolak
          </p>
          <h1 className="mt-6 text-[clamp(2.25rem,5vw,3.5rem)] font-medium leading-[1] tracking-[-0.04em] text-cream-50">
            {title}
          </h1>
          <p className="mt-5 max-w-lg text-base leading-relaxed text-cream-100/65">
            {description}
          </p>

          <dl className="mt-8 grid gap-4 rounded-xl border border-cream-200/10 bg-cream-200/[0.03] p-5 sm:grid-cols-[1fr_auto] sm:items-center">
            <div className="min-w-0">
              <dt className="eyebrow text-[10px] text-cream-100/45">
                Akun saat ini
              </dt>
              <dd className="mt-1.5 truncate text-sm font-semibold text-cream-50">
                {email ?? "Belum masuk"}
              </dd>
            </div>
            <div>
              <dt className="sr-only">Role</dt>
              <dd className="eyebrow w-fit rounded-md border border-cream-200/15 px-2.5 py-1 text-[10px] text-cream-100/75">
                Role · {role ?? "none"}
              </dd>
            </div>
          </dl>

          <div className="cta-row mt-10">
            <button
              type="button"
              onClick={onSignOut}
              className="btn btn-lg btn-primary"
            >
              Ganti akun / Keluar
            </button>
            <Link href="/" className="btn btn-lg btn-outline-dark">
              Kembali ke beranda
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
