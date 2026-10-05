"use client";

import { useCallback, useEffect, useState } from "react";
import {
  type EligibilityReview,
  listVerificationRegistrations,
} from "@/lib/tuwagaApi";

/** Keep eligibility separate from registration approval and payment. */
export function useEligibilityReviews(tournamentId: string, enabled: boolean) {
  const [reviews, setReviews] = useState<Record<string, EligibilityReview[]>>(
    {},
  );
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [revision, setRevision] = useState(0);
  const refresh = useCallback(() => setRevision((value) => value + 1), []);
  useEffect(() => {
    if (!enabled) return;
    // Manual refresh starts a new request generation.
    void revision;
    let disposed = false;
    let busy = false;
    async function sync() {
      if (disposed || busy || document.visibilityState === "hidden") return;
      busy = true;
      try {
        const registrations = await listVerificationRegistrations(tournamentId);
        if (!disposed) {
          setReviews(
            Object.fromEntries(
              registrations.map((team) => [team.id, team.reviews]),
            ),
          );
          setError("");
        }
      } catch {
        if (!disposed) {
          // Do not present stale decisions as current after an access or network failure.
          setReviews({});
          setError("Hasil EO belum dapat dimuat. Coba lagi.");
        }
      } finally {
        busy = false;
        if (!disposed) setLoading(false);
      }
    }
    setLoading(true);
    setReviews({});
    setError("");
    void sync();
    const timer = window.setInterval(() => void sync(), 10000);
    const resume = () => void sync();
    window.addEventListener("focus", resume);
    document.addEventListener("visibilitychange", resume);
    return () => {
      disposed = true;
      window.clearInterval(timer);
      window.removeEventListener("focus", resume);
      document.removeEventListener("visibilitychange", resume);
    };
  }, [tournamentId, enabled, revision]);
  return { reviews, error, loading, refresh };
}
