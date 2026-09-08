"use client";

import Link from "next/link";
import { signOut, useSession } from "@/lib/auth-client";

export default function ForbiddenPage() {
  const { data: session } = useSession();

  const handleSignOut = async () => {
    try {
      await signOut();
      window.location.href = "/login";
    } catch {
      window.location.href = "/login";
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f6f8fc] px-6 py-12 text-slate-900">
      <div className="w-full max-w-xl rounded-2xl border border-slate-200 bg-white p-8 shadow-xl sm:p-10">
        <div className="flex items-start justify-between gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-rose-200 bg-rose-50 text-rose-600">
            <span className="material-symbols-outlined text-2xl">block</span>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-rose-800">
            HTTP 403 · FORBIDDEN
          </span>
        </div>

        <h1 className="mt-6 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
          Akses Khusus Organizer & Admin
        </h1>

        <p className="mt-3 text-sm leading-relaxed text-slate-600">
          Halaman Command Center turnamen hanya dapat diakses oleh akun dengan
          peran{" "}
          <strong className="font-bold text-slate-900">
            Organizer (Panitia Turnamen)
          </strong>{" "}
          atau{" "}
          <strong className="font-bold text-slate-900">Administrator</strong>.
        </p>

        {session?.user && (
          <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Akun yang Sedang Masuk
            </div>
            <div className="mt-1 flex flex-wrap items-center justify-between gap-2">
              <span className="font-bold text-slate-900">
                {session.user.email}
              </span>
              <span className="rounded-md border border-slate-200 bg-white px-2.5 py-0.5 text-xs font-bold uppercase text-slate-800">
                Role: {session.user.role ?? "user"}
              </span>
            </div>
          </div>
        )}

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/"
            className="flex h-11 flex-1 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-center text-sm font-bold text-slate-800 shadow-sm transition hover:bg-slate-50"
          >
            Kembali ke Beranda
          </Link>
          <button
            type="button"
            onClick={handleSignOut}
            className="flex h-11 flex-1 items-center justify-center rounded-xl bg-blue-600 px-4 text-center text-sm font-extrabold text-white shadow-lg shadow-blue-200 transition hover:-translate-y-0.5 hover:bg-blue-700"
          >
            Ganti Akun / Keluar
          </button>
        </div>
      </div>
    </main>
  );
}
