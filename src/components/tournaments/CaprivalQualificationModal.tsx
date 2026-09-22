"use client";

import { useState } from "react";
import {
  CAPRIVAL_QUALIFICATION_SECTIONS,
  CAPRIVAL_YOUTH_QUALIFICATION,
  getCaprivalCategoryEligibility,
} from "@/lib/caprivalQualifications";

interface CaprivalQualificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialCategory?: string;
}

export function CaprivalQualificationModal({
  isOpen,
  onClose,
  initialCategory,
}: CaprivalQualificationModalProps) {
  const [activeTab, setActiveTab] = useState<"matrix" | "categories">("matrix");
  const [selectedCatName, setSelectedCatName] = useState<string>(
    initialCategory || "Upper beginner women",
  );

  if (!isOpen) return null;

  const currentEligibility = getCaprivalCategoryEligibility(selectedCatName);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="caprival-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div className="flex max-h-[92vh] w-full max-w-4xl flex-col rounded-3xl border border-slate-200 bg-white shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="relative border-b border-slate-100 bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 px-6 py-5 text-white sm:px-8">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-400/20 px-2.5 py-0.5 text-[11px] font-black uppercase tracking-wider text-amber-300 border border-amber-400/30">
                  <span className="material-symbols-outlined text-[14px]">
                    verified
                  </span>
                  The Grand Caprival
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2.5 py-0.5 text-[11px] font-semibold text-slate-300">
                  Kuota: 24 Pair per Kategori
                </span>
              </div>
              <h2
                id="caprival-modal-title"
                className="text-xl font-black tracking-tight text-white sm:text-2xl"
              >
                Panduan & Matriks Kualifikasi Kategori
              </h2>
              <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
                Kriteria ketat penentuan level pemain (Tenis & Padel) untuk
                menjaga sportivitas, integritas, dan kompetisi yang berimbang.
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/10 text-white/80 transition hover:bg-white/20 hover:text-white"
              aria-label="Tutup panduan"
            >
              <span className="material-symbols-outlined text-xl">close</span>
            </button>
          </div>

          {/* Tab Switcher */}
          <div className="mt-5 flex gap-2 border-t border-white/10 pt-3">
            <button
              type="button"
              onClick={() => setActiveTab("matrix")}
              className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold transition ${
                activeTab === "matrix"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "bg-white/10 text-slate-300 hover:bg-white/20 hover:text-white"
              }`}
            >
              <span className="material-symbols-outlined text-base">
                table_chart
              </span>
              Tabel Matriks Lengkap
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("categories")}
              className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold transition ${
                activeTab === "categories"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "bg-white/10 text-slate-300 hover:bg-white/20 hover:text-white"
              }`}
            >
              <span className="material-symbols-outlined text-base">
                category
              </span>
              Ringkasan Tiap Kategori
            </button>
          </div>
        </div>

        {/* Modal Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6">
          {activeTab === "matrix" && (
            <div className="space-y-6">
              {/* Matrix Legend Banner */}
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-blue-100 bg-blue-50/70 p-4 text-xs">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-blue-600 text-lg">
                    info
                  </span>
                  <span className="font-bold text-blue-900">
                    Keterangan Tanda:
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="inline-flex items-center gap-1 font-semibold text-emerald-700">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 font-black">
                      ✓
                    </span>
                    Diperbolehkan (Eligible)
                  </span>
                  <span className="inline-flex items-center gap-1 font-semibold text-rose-700">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-rose-100 text-rose-700 font-black">
                      ✕
                    </span>
                    Dilarang (Not Allowed)
                  </span>
                </div>
              </div>

              {/* Table rendering */}
              <div className="overflow-x-auto rounded-2xl border border-slate-200 shadow-xs">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-100/90 text-slate-700 font-extrabold">
                      <th className="py-3.5 px-4 sm:px-6 min-w-[280px]">
                        Kategori / Kriteria Pemain
                      </th>
                      <th className="py-3.5 px-4 text-center w-36 bg-amber-50/60 border-x border-slate-200 text-amber-900">
                        Upper Beginner
                        <span className="block text-[10px] font-normal text-amber-700">
                          (Khusus Women)
                        </span>
                      </th>
                      <th className="py-3.5 px-4 text-center w-32 bg-slate-50 border-r border-slate-200 text-slate-800">
                        Bronze
                        <span className="block text-[10px] font-normal text-slate-500">
                          (Men & Women)
                        </span>
                      </th>
                      <th className="py-3.5 px-4 text-center w-32 bg-indigo-50/60 text-indigo-900">
                        Silver
                        <span className="block text-[10px] font-normal text-indigo-700">
                          (Open)
                        </span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {CAPRIVAL_QUALIFICATION_SECTIONS.map((section) => (
                      <tr key={section.title} className="contents">
                        {/* Section Header Row */}
                        <td
                          colSpan={4}
                          className="bg-slate-800 py-2 px-4 sm:px-6 text-white font-extrabold text-[11px] uppercase tracking-wider"
                        >
                          <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-[16px] text-amber-400">
                              {section.icon}
                            </span>
                            {section.title}
                          </div>
                        </td>

                        {section.rows.map((row) => (
                          <tr
                            key={row.criteria}
                            className="border-b border-slate-100 hover:bg-slate-50/80 transition-colors"
                          >
                            <td className="py-3 px-4 sm:px-6 text-slate-900 font-medium">
                              <p className="font-semibold text-slate-900 text-xs">
                                {row.criteria}
                              </p>
                              {row.notes && (
                                <p className="text-[11px] text-slate-500 mt-0.5">
                                  {row.notes}
                                </p>
                              )}
                            </td>
                            {/* Upper Beginner Column */}
                            <td className="py-3 px-4 text-center border-x border-slate-200 bg-amber-50/20">
                              {row.upperBeginner ? (
                                <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 font-black text-sm">
                                  ✓
                                </span>
                              ) : (
                                <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-rose-100 text-rose-700 font-black text-sm">
                                  ✕
                                </span>
                              )}
                            </td>
                            {/* Bronze Column */}
                            <td className="py-3 px-4 text-center border-r border-slate-200">
                              {row.bronze ? (
                                <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 font-black text-sm">
                                  ✓
                                </span>
                              ) : (
                                <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-rose-100 text-rose-700 font-black text-sm">
                                  ✕
                                </span>
                              )}
                            </td>
                            {/* Silver Column */}
                            <td className="py-3 px-4 text-center bg-indigo-50/20">
                              {row.silver ? (
                                <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 font-black text-sm">
                                  ✓
                                </span>
                              ) : (
                                <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-rose-100 text-rose-700 font-black text-sm">
                                  ✕
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Youth Qualification Card (KU-14) */}
              <div className="rounded-2xl border border-sky-200 bg-gradient-to-r from-sky-50 to-blue-50/60 p-5 shadow-xs">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-600 text-white font-black">
                    <span className="material-symbols-outlined text-2xl">
                      child_care
                    </span>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-extrabold text-sky-950">
                        {CAPRIVAL_YOUTH_QUALIFICATION.title} (
                        {CAPRIVAL_YOUTH_QUALIFICATION.category})
                      </h4>
                      <span className="inline-flex rounded-full bg-sky-200/80 px-2 py-0.5 text-[10px] font-bold text-sky-900">
                        Kuota: {CAPRIVAL_YOUTH_QUALIFICATION.quota}
                      </span>
                    </div>
                    <p className="text-xs font-bold text-sky-800">
                      🎂 Syarat Kelahiran:{" "}
                      <span className="underline decoration-sky-400 underline-offset-2">
                        {CAPRIVAL_YOUTH_QUALIFICATION.rule}
                      </span>{" "}
                      ({CAPRIVAL_YOUTH_QUALIFICATION.indonesianRule})
                    </p>
                    <p className="text-[11px] text-slate-600 leading-relaxed">
                      📌 {CAPRIVAL_YOUTH_QUALIFICATION.verification}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "categories" && (
            <div className="space-y-6">
              {/* Category selector pills */}
              <div className="flex flex-wrap gap-2">
                {[
                  "Upper beginner women",
                  "Bronze Men",
                  "Bronze Women",
                  "Silver Open",
                  "KU-14 Men",
                ].map((name) => {
                  const isSelected = selectedCatName === name;
                  return (
                    <button
                      key={name}
                      type="button"
                      onClick={() => setSelectedCatName(name)}
                      className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold transition ${
                        isSelected
                          ? "bg-slate-900 text-white shadow-sm"
                          : "border border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                      }`}
                    >
                      <span>{name}</span>
                      <span
                        className={`rounded-full px-1.5 py-0.2 text-[10px] ${
                          isSelected
                            ? "bg-white/20 text-white"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        24 Pair
                      </span>
                    </button>
                  );
                })}
              </div>

              {currentEligibility && (
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-5">
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
                    <div>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                        Detail Kategori
                      </span>
                      <h3 className="text-lg font-black text-slate-900">
                        {currentEligibility.name}
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {currentEligibility.description}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-extrabold text-indigo-700">
                        {currentEligibility.badgeText}
                      </span>
                      <span className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-bold text-slate-700">
                        {currentEligibility.quota}
                      </span>
                    </div>
                  </div>

                  {currentEligibility.youthRule && (
                    <div className="rounded-xl border border-amber-200 bg-amber-50 p-3.5 text-xs text-amber-900 font-semibold flex items-center gap-2">
                      <span className="material-symbols-outlined text-amber-600">
                        cake
                      </span>
                      <span>
                        Batasan Usia: {currentEligibility.youthRule}. Wajib
                        melampirkan dokumen identitas yang memperlihatkan
                        tanggal lahir.
                      </span>
                    </div>
                  )}

                  <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                    {/* Allowed */}
                    <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4 space-y-3">
                      <div className="flex items-center gap-2 text-emerald-900 font-bold text-xs">
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-600 text-white text-xs font-black">
                          ✓
                        </span>
                        Diperbolehkan Mendaftar (Eligible)
                      </div>
                      <ul className="space-y-2 text-xs text-slate-700">
                        {currentEligibility.allowedList.map((item) => (
                          <li
                            key={item}
                            className="flex items-start gap-2 leading-relaxed"
                          >
                            <span className="text-emerald-600 font-bold">
                              •
                            </span>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Disallowed */}
                    <div className="rounded-xl border border-rose-200 bg-rose-50/50 p-4 space-y-3">
                      <div className="flex items-center gap-2 text-rose-900 font-bold text-xs">
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-rose-600 text-white text-xs font-black">
                          ✕
                        </span>
                        Dilarang Mendaftar (Not Allowed)
                      </div>
                      <ul className="space-y-2 text-xs text-slate-700">
                        {currentEligibility.disallowedList.map((item) => (
                          <li
                            key={item}
                            className="flex items-start gap-2 leading-relaxed"
                          >
                            <span className="text-rose-600 font-bold">•</span>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Screening & Committee Disclaimer */}
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-600 flex items-start gap-3">
            <span className="material-symbols-outlined text-slate-500 text-lg shrink-0 mt-0.5">
              gavel
            </span>
            <p className="leading-relaxed">
              <strong>Catatan Kurasi Panitia:</strong> Seluruh pendaftar akan
              melewati tahap kurasi & verifikasi profil secara ketat oleh
              panitia The Grand Caprival. Pembayaran pendaftaran hanya dilakukan
              setelah tim diverifikasi lolos kategori. Panitia berhak
              memindahkan kategori atau mendiskualifikasi peserta yang tidak
              sesuai kriteria.
            </p>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50 px-6 py-4 sm:px-8">
          <span className="text-xs text-slate-500 font-medium">
            Dokumen resmi The Grand Caprival 2026
          </span>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-9 items-center justify-center rounded-xl bg-slate-900 px-5 text-xs font-extrabold text-white transition hover:bg-slate-800 shadow-xs"
          >
            Tutup & Lanjutkan Form
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Contextual Criteria Box for the selected category in the registration form
 */
export function CaprivalSelectedCategoryGuide({
  categoryName,
  onOpenModal,
}: {
  categoryName: string;
  onOpenModal: () => void;
}) {
  const eligibility = getCaprivalCategoryEligibility(categoryName);
  if (!eligibility) return null;

  return (
    <div className="mt-4 rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50/60 via-white to-blue-50/40 p-4 sm:p-5 shadow-xs animate-in fade-in duration-200">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-indigo-100/70 pb-3">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600 text-white">
            <span className="material-symbols-outlined text-[16px]">
              verified
            </span>
          </span>
          <div>
            <h4 className="text-xs font-black uppercase tracking-wider text-indigo-950">
              Kriteria Kualifikasi: {eligibility.name}
            </h4>
            <p className="text-[11px] text-indigo-800/80">
              {eligibility.badgeText} • Kuota: {eligibility.quota}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onOpenModal}
          className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-200 bg-white px-3 py-1.5 text-xs font-bold text-indigo-700 shadow-xs transition hover:bg-indigo-50 hover:border-indigo-300"
        >
          <span className="material-symbols-outlined text-[15px]">
            table_chart
          </span>
          Lihat Matriks Lengkap
        </button>
      </div>

      {eligibility.youthRule && (
        <div className="mt-3 rounded-lg border border-sky-200 bg-sky-50 px-3 py-2 text-xs font-semibold text-sky-900 flex items-center gap-2">
          <span className="material-symbols-outlined text-base text-sky-600">
            calendar_month
          </span>
          <span>
            {eligibility.youthRule}. Siapkan kartu identitas anak / pelajar
            untuk verifikasi usia.
          </span>
        </div>
      )}

      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 text-xs">
        {/* Quick Allowed list */}
        <div className="rounded-xl border border-emerald-200 bg-white/90 p-3">
          <div className="flex items-center gap-1.5 font-bold text-emerald-800 text-[11px] uppercase tracking-wider mb-1.5">
            <span className="text-emerald-600 font-black">✓</span>
            Syarat Utama (Eligible):
          </div>
          <ul className="space-y-1 text-[11px] text-slate-700 leading-snug">
            {eligibility.allowedList.slice(0, 2).map((item) => (
              <li key={item} className="flex items-start gap-1.5">
                <span className="text-emerald-500 font-bold">•</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Quick Disallowed list */}
        <div className="rounded-xl border border-rose-200 bg-white/90 p-3">
          <div className="flex items-center gap-1.5 font-bold text-rose-800 text-[11px] uppercase tracking-wider mb-1.5">
            <span className="text-rose-600 font-black">✕</span>
            Dilarang (Not Allowed):
          </div>
          <ul className="space-y-1 text-[11px] text-slate-700 leading-snug">
            {eligibility.disallowedList.slice(0, 2).map((item) => (
              <li key={item} className="flex items-start gap-1.5">
                <span className="text-rose-500 font-bold">•</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
