"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import RegistrationShell from "@/components/RegistrationShell";

function SuccessContent() {
  const searchParams = useSearchParams();

  const registrationId = searchParams.get("registrationId") || "REG-TUWAGA";
  const tournamentName =
    searchParams.get("tournamentName") || "Tuwaga Open Tournament";
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
      <div className="rounded-2xl border border-[#e6e3da] bg-white p-6 shadow-sm sm:p-10">
        <div className="flex items-start justify-between gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-xl border border-[#e6e3da] bg-[#faf9f6] text-[#0c0d11]">
            <span className="material-symbols-outlined text-3xl">task_alt</span>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-emerald-800">
            Terkonfirmasi ✓
          </span>
        </div>

        <h1 className="mt-6 text-2xl font-bold tracking-tight text-[#0c0d11] sm:text-3xl">
          Pendaftaran Berhasil!
        </h1>
        <p className="mt-2 text-sm font-medium leading-relaxed text-slate-600">
          Selamat! Berkas dan data tim Anda telah resmi tercatat di sistem
          turnamen TUWAGA.
        </p>

        {/* Ticket Reference */}
        <div className="mt-8 rounded-xl border border-[#e6e3da] bg-[#faf9f6] p-5">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#e6e3da] pb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Registration ID / Kode Tim
            </span>
            <button
              type="button"
              onClick={handleCopyId}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[#e6e3da] bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 active:scale-95"
            >
              <span className="material-symbols-outlined text-sm">
                {copied ? "check" : "content_copy"}
              </span>
              {copied ? "Tersalin!" : "Salin ID"}
            </button>
          </div>
          <p className="mt-2 font-mono text-xl font-bold tracking-wider text-[#0c0d11] sm:text-2xl">
            {registrationId}
          </p>
        </div>

        {/* Details Grid */}
        <div className="mt-6 space-y-3">
          <div className="flex flex-col justify-between gap-1 rounded-xl border border-[#f0ede6] bg-[#faf9f6]/70 p-4 sm:flex-row sm:items-center">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Turnamen
            </span>
            <span className="font-bold text-[#0c0d11] sm:text-right">
              {tournamentName}
            </span>
          </div>

          <div className="flex flex-col justify-between gap-1 rounded-xl border border-[#f0ede6] bg-[#faf9f6]/70 p-4 sm:flex-row sm:items-center">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Kategori / Divisi
            </span>
            <span className="inline-flex w-fit items-center gap-1 rounded-md border border-[#e6e3da] bg-[#f5eedb]/80 px-2.5 py-1 text-xs font-semibold text-[#0c0d11]">
              {category}
            </span>
          </div>

          <div className="flex flex-col justify-between gap-1 rounded-xl border border-[#f0ede6] bg-[#faf9f6]/70 p-4 sm:flex-row sm:items-center">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Susunan Pemain
            </span>
            <span className="font-bold text-[#0c0d11] sm:text-right">
              {player} {partner ? `& ${partner}` : "(Single)"}
            </span>
          </div>

          {(venue || date) && (
            <div className="flex flex-col justify-between gap-1 rounded-xl border border-[#f0ede6] bg-[#faf9f6]/70 p-4 sm:flex-row sm:items-center">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Lokasi & Waktu
              </span>
              <span className="text-xs font-semibold text-slate-700 sm:text-right">
                {venue} {date ? `· ${date}` : ""}
              </span>
            </div>
          )}
        </div>

        {/* Next Steps Guidance */}
        <div className="mt-8 rounded-xl border border-[#e6e3da] bg-[#faf9f6] p-5">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-xl text-[#0c0d11]">
              info
            </span>
            <h2 className="text-sm font-bold uppercase tracking-wide text-[#0c0d11]">
              Langkah Selanjutnya untuk Pemain
            </h2>
          </div>
          <ol className="mt-3 space-y-2.5 text-xs font-medium leading-relaxed text-slate-700">
            <li className="flex items-start gap-2.5">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-[#e6e3da] bg-white text-[11px] font-bold text-slate-800">
                1
              </span>
              <span>
                <strong className="font-bold text-[#0c0d11]">
                  Penetapan Bagan (Draw)
                </strong>
                : Panitia akan menyusun bagan pertandingan dan membagi grup
                kualifikasi.
              </span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-[#e6e3da] bg-white text-[11px] font-bold text-slate-800">
                2
              </span>
              <span>
                <strong className="font-bold text-[#0c0d11]">
                  Jadwal Order of Play (OOP)
                </strong>
                : Nomor lapangan dan estimasi jam tanding akan dirilis sebelum
                pertandingan dimulai.
              </span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-[#e6e3da] bg-white text-[11px] font-bold text-slate-800">
                3
              </span>
              <span>
                <strong className="font-bold text-[#0c0d11]">
                  Live Score Real-Time
                </strong>
                : Anda dan pendukung dapat memantau perolehan poin langsung dari
                smartphone Anda.
              </span>
            </li>
          </ol>
        </div>

        {/* Action Buttons */}
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/tournaments/bracket"
            className="flex h-11 flex-1 items-center justify-center gap-2 rounded-xl border border-[#0c0d11] bg-[#0c0d11] px-4 text-center text-xs font-semibold uppercase tracking-wider text-[#f5eedb] transition hover:bg-black active:scale-95"
          >
            <span className="material-symbols-outlined text-lg">
              account_tree
            </span>
            Lihat Bagan Pertandingan
          </Link>
          <Link
            href="/tournaments/live"
            className="flex h-11 flex-1 items-center justify-center gap-2 rounded-xl border border-[#e6e3da] bg-white px-4 text-center text-xs font-semibold uppercase tracking-wider text-[#0c0d11] transition hover:bg-slate-50 active:scale-95"
          >
            <span className="material-symbols-outlined text-lg">sensors</span>
            Pantau Skor Live
          </Link>
          <Link
            href="/"
            className="flex h-11 items-center justify-center rounded-xl border border-[#e6e3da] bg-[#faf9f6] px-4 text-center text-xs font-semibold uppercase tracking-wider text-slate-700 transition hover:bg-slate-100 active:scale-95"
          >
            Beranda
          </Link>
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
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        }
      >
        <SuccessContent />
      </Suspense>
    </RegistrationShell>
  );
}
