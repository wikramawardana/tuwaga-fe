"use client";

import {
  BroadcastIcon,
  CheckCircleIcon,
  CheckIcon,
  CopyIcon,
  InfoIcon,
  ShieldCheckIcon,
  TreeStructureIcon,
} from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import RegistrationShell from "@/components/RegistrationShell";

function SuccessContent() {
  const searchParams = useSearchParams();

  const registrationId = searchParams.get("registrationId") || "REG-TUWAGA";
  const tournamentName =
    searchParams.get("tournamentName") || "Tuwaga Open Tournament";
  const tournamentSlug = searchParams.get("tournamentSlug");
  const category = searchParams.get("category") || "Match Division";
  const player = searchParams.get("player") || "Pemain Utama";
  const partner = searchParams.get("partner");
  const venue = searchParams.get("venue");
  const date = searchParams.get("date");

  const [copied, setCopied] = useState(false);

  const handleCopyId = () => {
    navigator.clipboard.writeText(registrationId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="mx-auto max-w-2xl">
      {/* Main Success Receipt Card */}
      <div className="rounded-2xl border border-ink-300/30 bg-white p-6 shadow-[0px_4px_20px_rgba(0,0,0,0.04)] sm:p-10">
        <div className="flex items-start justify-between gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-xl border border-ink-300/30 bg-ink-100 text-brand-600">
            <CheckCircleIcon
              className="text-3xl"
              aria-hidden="true"
              weight="duotone"
            />
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-bold uppercase tracking-wider text-emerald-800">
            Terkonfirmasi
          </span>
        </div>

        <h1 className="mt-6 text-2xl font-black tracking-tight text-ink-950 sm:text-3xl">
          Pendaftaran Berhasil!
        </h1>
        <p className="mt-2 text-sm font-medium leading-relaxed text-ink-600">
          Selamat! Berkas dan data tim Anda telah resmi tercatat di sistem
          TUWAGA.
        </p>

        {/* Ticket Reference */}
        <div className="mt-8 rounded-xl border border-ink-300/30 bg-ink-100 p-5">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-ink-300/20 pb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-ink-600">
              Registration ID / Kode Tim
            </span>
            <button
              type="button"
              onClick={handleCopyId}
              className="inline-flex items-center gap-1.5 rounded-lg border border-ink-300/40 bg-white px-2.5 py-1 text-xs font-semibold text-ink-950 transition hover:bg-ink-100 active:scale-95"
            >
              {copied ? (
                <CheckIcon
                  className="text-sm"
                  weight="bold"
                  aria-hidden="true"
                />
              ) : (
                <CopyIcon
                  className="text-sm"
                  weight="bold"
                  aria-hidden="true"
                />
              )}
              {copied ? "Tersalin!" : "Salin ID"}
            </button>
          </div>
          <p className="mt-2 font-mono text-xl font-bold tracking-wider text-ink-950 sm:text-2xl">
            {registrationId}
          </p>
        </div>

        {/* Details Grid */}
        <div className="mt-6 space-y-3">
          <div className="flex flex-col justify-between gap-1 rounded-xl border border-ink-300/20 bg-ink-100/50 p-4 sm:flex-row sm:items-center">
            <span className="text-xs font-bold uppercase tracking-wider text-ink-600">
              Turnamen
            </span>
            <span className="font-bold text-ink-950 sm:text-right">
              {tournamentName}
            </span>
          </div>

          <div className="flex flex-col justify-between gap-1 rounded-xl border border-ink-300/20 bg-ink-100/50 p-4 sm:flex-row sm:items-center">
            <span className="text-xs font-bold uppercase tracking-wider text-ink-600">
              Kategori / Divisi
            </span>
            <span className="inline-flex w-fit items-center gap-1 rounded-md border border-brand-500/20 bg-brand-500/8 px-2.5 py-1 text-xs font-bold text-brand-600">
              {category}
            </span>
          </div>

          <div className="flex flex-col justify-between gap-1 rounded-xl border border-ink-300/20 bg-ink-100/50 p-4 sm:flex-row sm:items-center">
            <span className="text-xs font-bold uppercase tracking-wider text-ink-600">
              Susunan Pemain
            </span>
            <span className="font-bold text-ink-950 sm:text-right">
              {player} {partner ? `& ${partner}` : "(Single)"}
            </span>
          </div>

          {(venue || date) && (
            <div className="flex flex-col justify-between gap-1 rounded-xl border border-ink-300/20 bg-ink-100/50 p-4 sm:flex-row sm:items-center">
              <span className="text-xs font-bold uppercase tracking-wider text-ink-600">
                Lokasi & Waktu
              </span>
              <span className="text-xs font-semibold text-ink-600 sm:text-right">
                {venue} {date ? `· ${date}` : ""}
              </span>
            </div>
          )}
        </div>

        {/* Next Steps Guidance */}
        <div className="mt-8 rounded-xl border border-ink-300/30 bg-ink-100 p-5">
          <div className="flex items-center gap-2">
            <InfoIcon
              className="text-xl text-brand-600"
              aria-hidden="true"
              weight="duotone"
            />
            <h2 className="text-sm font-bold uppercase tracking-wide text-ink-950">
              Langkah Selanjutnya untuk Pemain
            </h2>
          </div>
          <ol className="mt-3 space-y-2.5 text-xs font-medium leading-relaxed text-ink-600">
            <li className="flex items-start gap-2.5">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-ink-300/40 bg-white text-[11px] font-bold text-brand-600">
                1
              </span>
              <span>
                <strong className="font-bold text-ink-950">
                  Penetapan Bagan (Draw)
                </strong>
                : Panitia akan menyusun bagan pertandingan dan membagi grup
                kualifikasi.
              </span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-ink-300/40 bg-white text-[11px] font-bold text-brand-600">
                2
              </span>
              <span>
                <strong className="font-bold text-ink-950">
                  Jadwal Order of Play (OOP)
                </strong>
                : Nomor lapangan dan estimasi jam tanding akan dirilis sebelum
                pertandingan dimulai.
              </span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-ink-300/40 bg-white text-[11px] font-bold text-brand-600">
                3
              </span>
              <span>
                <strong className="font-bold text-ink-950">
                  Live Score Real-Time
                </strong>
                : Anda dan pendukung dapat memantau perolehan poin langsung dari
                smartphone Anda.
              </span>
            </li>
          </ol>
        </div>

        {/* Action Buttons */}
        <div className="mt-8 flex flex-col gap-3">
          <Link
            href={
              tournamentSlug
                ? `/tournaments/${tournamentSlug}?check=${registrationId}`
                : `/tournaments/the-grand-caprival?check=${registrationId}`
            }
            className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-brand-500 px-4 text-center text-xs font-bold uppercase tracking-wider text-ink-950 shadow-sm transition hover:bg-brand-500/90 active:scale-95"
          >
            <ShieldCheckIcon
              className="text-lg"
              aria-hidden="true"
              weight="bold"
            />
            Pantau Live Status Pendaftaran Tim
          </Link>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              href={
                tournamentSlug
                  ? `/tournaments/bracket?tournament=${tournamentSlug}`
                  : "/tournaments/bracket"
              }
              className="flex h-11 flex-1 items-center justify-center gap-2 rounded-xl border border-ink-300/40 bg-white px-4 text-center text-xs font-bold uppercase tracking-wider text-ink-950 shadow-sm transition hover:bg-ink-100 active:scale-95"
            >
              <TreeStructureIcon
                className="text-lg"
                aria-hidden="true"
                weight="bold"
              />
              Bagan Turnamen
            </Link>
            <Link
              href={
                tournamentSlug
                  ? `/tournaments/live?tournament=${tournamentSlug}`
                  : "/tournaments/live"
              }
              className="flex h-11 flex-1 items-center justify-center gap-2 rounded-xl border border-ink-300/40 bg-white px-4 text-center text-xs font-bold uppercase tracking-wider text-ink-950 shadow-sm transition hover:bg-ink-100 active:scale-95"
            >
              <BroadcastIcon
                className="text-lg"
                aria-hidden="true"
                weight="bold"
              />
              Pantau Skor Live
            </Link>
            <Link
              href="/"
              className="flex h-11 items-center justify-center rounded-xl border border-ink-300/40 bg-ink-100 px-4 text-center text-xs font-bold uppercase tracking-wider text-ink-950 transition hover:bg-white active:scale-95"
            >
              Beranda
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function RegistrationSuccessPage() {
  return (
    <RegistrationShell title="Konfirmasi Pendaftaran" showProgress={false}>
      <Suspense
        fallback={
          <div className="flex h-64 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
          </div>
        }
      >
        <SuccessContent />
      </Suspense>
    </RegistrationShell>
  );
}
