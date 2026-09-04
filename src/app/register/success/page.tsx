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
      <div className="rounded-2xl border-4 border-[#07142f] bg-white p-6 shadow-[8px_8px_0_#07142f] sm:p-10">
        <div className="flex items-start justify-between gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl border-3 border-[#07142f] bg-[#55dfff] text-[#07142f] shadow-[4px_4px_0_#07142f]">
            <span className="material-symbols-outlined text-4xl">task_alt</span>
          </div>
          <span className="inline-flex border-2 border-[#07142f] bg-emerald-200 px-3 py-1.5 text-xs font-black uppercase tracking-wider text-emerald-950 shadow-[2px_2px_0_#07142f]">
            Terkonfirmasi ✓
          </span>
        </div>

        <h1 className="mt-6 text-3xl font-black uppercase tracking-tight text-slate-950 sm:text-4xl">
          Pendaftaran Berhasil!
        </h1>
        <p className="mt-2 text-base font-semibold leading-relaxed text-slate-600">
          Selamat! Berkas dan data tim Anda telah resmi tercatat di sistem
          turnamen TUWAGA.
        </p>

        {/* Ticket Reference */}
        <div className="mt-8 rounded-xl border-3 border-[#07142f] bg-[#f5f7ff] p-5 shadow-[4px_4px_0_#07142f]">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-slate-200 pb-3">
            <span className="text-xs font-black uppercase tracking-wider text-slate-500">
              Registration ID / Kode Tim
            </span>
            <button
              type="button"
              onClick={handleCopyId}
              className="inline-flex items-center gap-1.5 border border-[#07142f] bg-white px-2.5 py-1 text-xs font-black uppercase text-[#07142f] shadow-[1px_1px_0_#07142f] hover:bg-slate-100 active:scale-95"
            >
              <span className="material-symbols-outlined text-sm">
                {copied ? "check" : "content_copy"}
              </span>
              {copied ? "Tersalin!" : "Salin ID"}
            </button>
          </div>
          <p className="mt-2 font-mono text-lg font-black tracking-wider text-blue-700 sm:text-xl">
            {registrationId}
          </p>
        </div>

        {/* Details Grid */}
        <div className="mt-6 space-y-3">
          <div className="flex flex-col justify-between gap-1 rounded-lg border-2 border-slate-200 bg-slate-50 p-4 sm:flex-row sm:items-center">
            <span className="text-xs font-black uppercase tracking-wider text-slate-500">
              Turnamen
            </span>
            <span className="font-extrabold text-slate-950 sm:text-right">
              {tournamentName}
            </span>
          </div>

          <div className="flex flex-col justify-between gap-1 rounded-lg border-2 border-slate-200 bg-slate-50 p-4 sm:flex-row sm:items-center">
            <span className="text-xs font-black uppercase tracking-wider text-slate-500">
              Kategori / Divisi
            </span>
            <span className="inline-flex w-fit items-center gap-1 rounded border border-black bg-[#ffe45c] px-2 py-0.5 text-xs font-black uppercase text-slate-950">
              {category}
            </span>
          </div>

          <div className="flex flex-col justify-between gap-1 rounded-lg border-2 border-slate-200 bg-slate-50 p-4 sm:flex-row sm:items-center">
            <span className="text-xs font-black uppercase tracking-wider text-slate-500">
              Susunan Pemain
            </span>
            <span className="font-extrabold text-slate-950 sm:text-right">
              {player} {partner ? `& ${partner}` : "(Single)"}
            </span>
          </div>

          {(venue || date) && (
            <div className="flex flex-col justify-between gap-1 rounded-lg border-2 border-slate-200 bg-slate-50 p-4 sm:flex-row sm:items-center">
              <span className="text-xs font-black uppercase tracking-wider text-slate-500">
                Lokasi & Waktu
              </span>
              <span className="text-xs font-extrabold text-slate-700 sm:text-right">
                {venue} {date ? `· ${date}` : ""}
              </span>
            </div>
          )}
        </div>

        {/* Next Steps Guidance */}
        <div className="mt-8 rounded-xl border-3 border-[#07142f] bg-[#ffe45c] p-5 shadow-[4px_4px_0_#07142f]">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-2xl text-[#07142f]">
              info
            </span>
            <h2 className="text-sm font-black uppercase tracking-wide text-[#07142f]">
              Langkah Selanjutnya untuk Pemain
            </h2>
          </div>
          <ol className="mt-3 space-y-2 text-xs font-bold leading-relaxed text-slate-900">
            <li className="flex items-start gap-2">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-black bg-white text-[11px] font-black">
                1
              </span>
              <span>
                <strong>Penetapan Bagan (Draw)</strong>: Panitia akan menyusun
                bagan pertandingan dan membagi grup kualifikasi.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-black bg-white text-[11px] font-black">
                2
              </span>
              <span>
                <strong>Jadwal Order of Play (OOP)</strong>: Nomor lapangan dan
                estimasi jam tanding akan dirilis sebelum pertandingan dimulai.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-black bg-white text-[11px] font-black">
                3
              </span>
              <span>
                <strong>Live Score Real-Time</strong>: Anda dan pendukung dapat
                memantau perolehan poin langsung dari smartphone Anda.
              </span>
            </li>
          </ol>
        </div>

        {/* Action Buttons */}
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/tournaments/bracket"
            className="flex h-12 flex-1 items-center justify-center gap-2 border-2 border-[#07142f] bg-[#246bfe] px-4 text-center text-xs font-black uppercase text-white shadow-[3px_3px_0_#07142f] transition hover:bg-blue-700"
          >
            <span className="material-symbols-outlined text-lg">
              account_tree
            </span>
            Lihat Bagan Pertandingan
          </Link>
          <Link
            href="/tournaments/live"
            className="flex h-12 flex-1 items-center justify-center gap-2 border-2 border-[#07142f] bg-white px-4 text-center text-xs font-black uppercase text-[#07142f] shadow-[3px_3px_0_#07142f] transition hover:bg-slate-100"
          >
            <span className="material-symbols-outlined text-lg">sensors</span>
            Pantau Skor Live
          </Link>
          <Link
            href="/"
            className="flex h-12 items-center justify-center border-2 border-[#07142f] bg-slate-100 px-4 text-center text-xs font-black uppercase text-slate-800 shadow-[3px_3px_0_#07142f] transition hover:bg-slate-200"
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
