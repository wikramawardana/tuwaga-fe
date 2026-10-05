"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  assignVerifier,
  listVerifierAssignments,
  removeVerifier,
  type VerifierAssignment,
} from "@/lib/tuwagaApi";

type Reviewer = {
  id: string;
  name: string | null;
  email: string;
  role: string | null;
};

export default function VerifierAssignments({
  tournamentId,
}: {
  tournamentId: string;
}) {
  const [reviewers, setReviewers] = useState<Reviewer[]>([]);
  const [assignments, setAssignments] = useState<VerifierAssignment[]>([]);
  const [selected, setSelected] = useState("");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [response, assigned] = await Promise.all([
        fetch("/api/admin/users?role=eo"),
        listVerifierAssignments(tournamentId),
      ]);
      if (!response.ok) throw new Error("Gagal memuat pengguna EO");
      const data = (await response.json()) as { users: Reviewer[] };
      setReviewers(data.users.filter((user) => user.role === "eo"));
      setAssignments(assigned);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memuat penugasan");
    } finally {
      setLoading(false);
    }
  }, [tournamentId]);
  useEffect(() => {
    void refresh();
  }, [refresh]);
  async function change(userId: string, remove: boolean) {
    setBusy(true);
    setError("");
    try {
      if (remove) await removeVerifier(tournamentId, userId);
      else await assignVerifier(tournamentId, userId);
      setSelected("");
      await refresh();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Gagal menyimpan penugasan",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="rounded-2xl border border-ink-200 bg-white p-5">
      <h2 className="text-lg font-semibold">Penugasan EO</h2>
      <p className="mt-1 text-sm text-ink-600">
        EO hanya dapat melihat dan memverifikasi peserta turnamen ini setelah
        ditugaskan.
      </p>
      {error && (
        <p role="alert" className="mt-3 text-sm text-rose-700">
          {error}
        </p>
      )}
      {loading ? (
        <p className="mt-4 text-sm text-ink-500">Memuat penugasan…</p>
      ) : (
        <>
          <div className="mt-4 flex flex-wrap gap-3">
            <label className="flex-1 text-sm">
              Pilih pengguna EO
              <select
                className="mt-1 h-11 w-full rounded-lg border border-ink-300 px-3"
                value={selected}
                onChange={(event) => setSelected(event.target.value)}
                disabled={busy}
              >
                <option value="">Pilih akun</option>
                {reviewers
                  .filter(
                    (user) =>
                      !assignments.some((item) => item.userId === user.id),
                  )
                  .map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name || user.email} · {user.email}
                    </option>
                  ))}
              </select>
            </label>
            <button
              type="button"
              className="btn btn-dark self-end"
              disabled={busy || !selected}
              onClick={() => void change(selected, false)}
            >
              Tugaskan
            </button>
          </div>
          <Link
            href="/admin/users?role=eo"
            className="mt-3 inline-block text-sm font-semibold text-brand-700"
          >
            Kelola peran EO
          </Link>
          {assignments.length === 0 && (
            <p className="mt-4 text-sm text-ink-500">
              Belum ada EO yang ditugaskan.
            </p>
          )}
          <ul className="mt-3 divide-y divide-ink-100">
            {assignments.map((assignment) => {
              const person = reviewers.find(
                (user) => user.id === assignment.userId,
              );
              return (
                <li
                  key={assignment.userId}
                  className="flex items-center justify-between gap-3 py-3"
                >
                  <span className="text-sm">
                    {person
                      ? `${person.name || person.email} · ${person.email}`
                      : assignment.userId}
                  </span>
                  <button
                    type="button"
                    className="btn btn-sm btn-outline"
                    disabled={busy}
                    onClick={() => void change(assignment.userId, true)}
                  >
                    Cabut akses
                  </button>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </section>
  );
}
