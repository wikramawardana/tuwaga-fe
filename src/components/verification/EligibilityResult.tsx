import Link from "next/link";
import type { EligibilityReview } from "@/lib/tuwagaApi";

export const eligibilityLabels = {
  eligible: "Layak",
  needs_clarification: "Perlu klarifikasi",
  ineligible: "Tidak layak",
  pending: "Belum ditinjau",
};
const tones = {
  eligible: "border-emerald-200 bg-emerald-50 text-emerald-800",
  needs_clarification: "border-amber-200 bg-amber-50 text-amber-800",
  ineligible: "border-rose-200 bg-rose-50 text-rose-800",
  pending: "border-ink-200 bg-ink-50 text-ink-600",
};
export function EligibilityBadge({ review }: { review?: EligibilityReview }) {
  const status = review?.status ?? "pending";
  return (
    <span
      className={`inline-flex rounded-lg border px-2.5 py-1 text-xs font-bold ${tones[status]}`}
    >
      {eligibilityLabels[status]}
    </span>
  );
}
export default function EligibilityResult({
  reviews,
  tournamentId,
  teamId,
  unavailable,
  loading,
}: {
  reviews: EligibilityReview[];
  tournamentId: string;
  teamId: string;
  unavailable: boolean;
  loading: boolean;
}) {
  const review = reviews[0];
  return (
    <section
      className="mt-4 rounded-xl border border-ink-100 bg-ink-50/50 p-3"
      aria-label="Hasil verifikasi EO"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="eyebrow text-[10px] text-ink-500">Kelayakan EO</span>
          {unavailable ? (
            <span className="text-xs text-ink-500">Hasil belum tersedia</span>
          ) : loading ? (
            <span className="text-xs text-ink-500">Memuat hasil…</span>
          ) : (
            <EligibilityBadge review={review} />
          )}
        </div>
        <Link
          className="text-xs font-bold text-brand-700 underline underline-offset-4"
          href={`/verification/${encodeURIComponent(tournamentId)}?team=${encodeURIComponent(teamId)}`}
        >
          Buka verifikasi
        </Link>
      </div>
      {!unavailable && !loading && review && (
        <>
          <p className="mt-2 text-xs text-ink-500">
            {review.reviewerName} ·{" "}
            {new Date(review.reviewedAt).toLocaleString("id-ID", {
              timeZone: "Asia/Jakarta",
            })}{" "}
            WIB
          </p>
          {review.notes && (
            <p className="mt-2 whitespace-pre-wrap break-words text-sm text-ink-700">
              {review.notes}
            </p>
          )}
        </>
      )}
    </section>
  );
}
