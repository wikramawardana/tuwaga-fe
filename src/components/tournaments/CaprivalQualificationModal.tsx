"use client";

import {
  BabyIcon,
  CheckIcon,
  GavelIcon,
  InfoIcon,
  RacquetIcon,
  SealCheckIcon,
  TennisBallIcon,
  XIcon,
} from "@phosphor-icons/react/dist/ssr";
import { Fragment } from "react";
import type { AppIcon } from "@/components/icons/SportIcons";
import {
  CAPRIVAL_QUALIFICATION_SECTIONS,
  CAPRIVAL_YOUTH_QUALIFICATION,
} from "@/lib/caprivalQualifications";

const sectionIcons: Record<string, AppIcon> = {
  sports_tennis: RacquetIcon,
  sports_baseball: TennisBallIcon,
};

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
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink-950/70 p-4 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div className="flex max-h-[92vh] w-full max-w-4xl flex-col rounded-3xl border border-ink-200 bg-white shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="relative border-b border-ink-100 bg-gradient-to-r from-ink-900 via-ink-800 to-ink-950 px-6 py-5 text-white sm:px-8">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-400/20 px-2.5 py-0.5 text-[11px] font-black uppercase tracking-wider text-amber-300 border border-amber-400/30">
                  <SealCheckIcon
                    className="text-[14px]"
                    aria-hidden="true"
                    weight="bold"
                  />
                  The Grand Caprival
                </span>
              </div>
              <h2
                id="caprival-modal-title"
                className="text-xl font-black tracking-tight text-white sm:text-2xl"
              >
                Panduan & Matriks Kualifikasi Kategori
              </h2>
              <p className="text-xs text-ink-300 max-w-2xl leading-relaxed">
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
              <XIcon className="text-xl" aria-hidden="true" weight="duotone" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Content: Pure Matrix Table */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6">
          <div className="space-y-6">
            {/* Matrix Legend Banner */}
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-brand-100 bg-brand-50/70 p-4 text-xs">
              <div className="flex items-center gap-2">
                <InfoIcon
                  className="text-brand-600 text-lg"
                  aria-hidden="true"
                  weight="bold"
                />
                <span className="font-bold text-ink-900">
                  Keterangan Tanda:
                </span>
              </div>
              <div className="flex items-center gap-4">
                <span className="inline-flex items-center gap-1 font-semibold text-emerald-700">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 font-black">
                    <CheckIcon weight="bold" aria-hidden="true" />
                  </span>
                  Diperbolehkan (Eligible)
                </span>
                <span className="inline-flex items-center gap-1 font-semibold text-rose-700">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-rose-100 text-rose-700 font-black">
                    <XIcon weight="bold" aria-hidden="true" />
                  </span>
                  Dilarang (Not Allowed)
                </span>
              </div>
            </div>

            {/* Table rendering */}
            <div className="overflow-x-auto rounded-2xl border border-ink-200 shadow-xs">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-ink-200 bg-ink-100/90 text-ink-700 font-extrabold">
                    <th className="py-3.5 px-4 sm:px-6 min-w-[280px]">
                      Kategori / Kriteria Pemain
                    </th>
                    <th className="py-3.5 px-4 text-center w-36 bg-amber-50/60 border-x border-ink-200 text-amber-900">
                      Upper Beginner
                      <span className="block text-[10px] font-normal text-amber-700">
                        (Khusus Women)
                      </span>
                    </th>
                    <th className="py-3.5 px-4 text-center w-32 bg-ink-50 border-r border-ink-200 text-ink-800">
                      Bronze
                      <span className="block text-[10px] font-normal text-ink-500">
                        (Men & Women)
                      </span>
                    </th>
                    <th className="py-3.5 px-4 text-center w-36 bg-emerald-50/50 border-l border-ink-200 text-ink-800">
                      Mens Open
                      <span className="block text-[10px] font-normal text-emerald-700">
                        (Eligible for All)
                      </span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {CAPRIVAL_QUALIFICATION_SECTIONS.map((section) => (
                    <Fragment key={section.title}>
                      {/* Section Header Row */}
                      <tr className="bg-ink-800 text-white font-extrabold text-[11px] uppercase tracking-wider">
                        <td
                          colSpan={4}
                          className="py-2 px-4 sm:px-6 text-white font-extrabold text-[11px] uppercase tracking-wider"
                        >
                          <div className="flex items-center gap-2">
                            {(() => {
                              const SectionIcon =
                                sectionIcons[section.icon] ?? RacquetIcon;
                              return (
                                <SectionIcon
                                  className="text-[16px] text-amber-400"
                                  weight="duotone"
                                  aria-hidden="true"
                                />
                              );
                            })()}
                            {section.title}
                          </div>
                        </td>
                      </tr>

                      {section.rows.map((row, rowIndex) => (
                        <tr
                          key={row.criteria}
                          className="border-b border-ink-100 hover:bg-ink-50/80 transition-colors"
                        >
                          <td className="py-3 px-4 sm:px-6 text-ink-900 font-medium">
                            <p className="font-semibold text-ink-900 text-xs">
                              {row.criteria}
                            </p>
                            {row.notes && (
                              <p className="text-[11px] text-ink-500 mt-0.5">
                                {row.notes}
                              </p>
                            )}
                          </td>
                          {/* Upper Beginner Column */}
                          <td className="py-3 px-4 text-center border-x border-ink-200 bg-amber-50/20">
                            {row.upperBeginner ? (
                              <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 font-black text-sm">
                                <CheckIcon weight="bold" aria-hidden="true" />
                              </span>
                            ) : (
                              <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-rose-100 text-rose-700 font-black text-sm">
                                <XIcon weight="bold" aria-hidden="true" />
                              </span>
                            )}
                          </td>
                          {/* Bronze Column */}
                          <td className="py-3 px-4 text-center border-r border-ink-200">
                            {row.bronze ? (
                              <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 font-black text-sm">
                                <CheckIcon weight="bold" aria-hidden="true" />
                              </span>
                            ) : (
                              <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-rose-100 text-rose-700 font-black text-sm">
                                <XIcon weight="bold" aria-hidden="true" />
                              </span>
                            )}
                          </td>
                          {/* Mens Open Column - Merged Cell for the Section */}
                          {rowIndex === 0 && (
                            <td
                              rowSpan={section.rows.length}
                              className="py-4 px-3 text-center bg-emerald-50/25 border-l border-ink-200 align-middle"
                            >
                              <div className="flex flex-col items-center justify-center gap-1.5 p-2 rounded-xl border border-emerald-200/70 bg-white/90 shadow-2xs">
                                <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 font-black text-sm shadow-xs">
                                  <CheckIcon weight="bold" aria-hidden="true" />
                                </span>
                                <span className="font-extrabold text-emerald-800 text-[11px] uppercase tracking-wide leading-snug">
                                  Eligible for All
                                </span>
                                <span className="text-[10px] text-emerald-600/90 font-semibold leading-tight">
                                  Semua Kualifikasi
                                </span>
                              </div>
                            </td>
                          )}
                        </tr>
                      ))}
                    </Fragment>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Youth Qualification Card (KU-14) */}
            <div className="rounded-2xl border border-cream-200 bg-gradient-to-r from-cream-50 to-brand-50/60 p-5 shadow-xs">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cream-600 text-white font-black">
                  <BabyIcon
                    className="text-2xl"
                    aria-hidden="true"
                    weight="duotone"
                  />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-extrabold text-cream-950">
                      {CAPRIVAL_YOUTH_QUALIFICATION.title} (
                      {CAPRIVAL_YOUTH_QUALIFICATION.category})
                    </h4>
                  </div>
                  <p className="text-xs font-bold text-cream-800">
                    Syarat kelahiran:{" "}
                    <span className="underline decoration-cream-400 underline-offset-2">
                      {CAPRIVAL_YOUTH_QUALIFICATION.rule}
                    </span>{" "}
                    ({CAPRIVAL_YOUTH_QUALIFICATION.indonesianRule})
                  </p>
                  <p className="text-[11px] text-ink-600 leading-relaxed">
                    {CAPRIVAL_YOUTH_QUALIFICATION.verification}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Screening & Committee Disclaimer */}
          <div className="rounded-2xl border border-ink-200 bg-ink-50 p-4 text-xs text-ink-600 flex items-start gap-3">
            <GavelIcon
              className="text-ink-500 text-lg shrink-0 mt-0.5"
              aria-hidden="true"
              weight="bold"
            />
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
        <div className="flex items-center justify-between border-t border-ink-100 bg-ink-50 px-6 py-4 sm:px-8">
          <span className="text-xs text-ink-500 font-medium">
            Dokumen resmi The Grand Caprival 2026
          </span>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-9 items-center justify-center rounded-xl bg-ink-900 px-5 text-xs font-extrabold text-white transition hover:bg-ink-800 shadow-xs"
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
