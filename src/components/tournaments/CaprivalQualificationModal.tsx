"use client";

import {
  CAPRIVAL_QUALIFICATION_SECTIONS,
  CAPRIVAL_YOUTH_QUALIFICATION,
} from "@/lib/caprivalQualifications";

interface CaprivalQualificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialCategory?: string;
}

export function CaprivalQualificationModal({
  isOpen,
  onClose,
}: CaprivalQualificationModalProps) {
  if (!isOpen) return null;

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
        </div>

        {/* Modal Scrollable Content: Pure Matrix Table */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6">
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
                      Open Men
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
                          {/* Open Men Column */}
                          <td className="py-3 px-4 text-center bg-indigo-50/20">
                            {row.openMen === true ? (
                              <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 font-black text-sm">
                                ✓
                              </span>
                            ) : row.openMen === false ? (
                              <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-rose-100 text-rose-700 font-black text-sm">
                                ✕
                              </span>
                            ) : (
                              <span className="inline-block h-6 w-6" />
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

export function CaprivalSelectedCategoryGuide(_props: {
  categoryName?: string;
  onOpenModal?: () => void;
}) {
  return null;
}
