"use client";

import Link from "next/link";
import { signOut, useSession } from "@/lib/auth-client";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, isPending } = useSession();

  const handleSignOut = async () => {
    try {
      await signOut();
      window.location.href = "/login";
    } catch {
      window.location.href = "/login";
    }
  };

  if (isPending) {
    return (
      <div className="neo-admin flex min-h-screen items-center justify-center bg-[#246bfe] text-white">
        <div className="text-center">
          <span className="material-symbols-outlined admin-spin text-5xl text-blue-300">
            progress_activity
          </span>
          <p className="mt-4 text-xs font-black uppercase tracking-widest text-blue-100">
            Memverifikasi Hak Akses...
          </p>
        </div>
      </div>
    );
  }

  const role = session?.user?.role;
  const isAllowed =
    role === "admin" || role === "organizer" || role === "panitia";

  if (!session || !isAllowed) {
    return (
      <main className="neo-admin flex min-h-screen items-center justify-center bg-[#faf9f6] px-6 py-12 text-slate-950">
        <div className="w-full max-w-xl rounded-2xl border border-[#e6e3da] bg-white p-8 shadow-sm sm:p-10">
          <div className="flex items-start justify-between gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl border border-rose-200 bg-rose-50 text-rose-600">
              <span className="material-symbols-outlined text-3xl">block</span>
            </div>
            <span className="rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-700">
              Error 403 · Akses Ditolak
            </span>
          </div>

          <h1 className="mt-6 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
            Khusus Panitia (Organizer) & Admin
          </h1>

          <p className="mt-3 text-sm leading-relaxed text-slate-600">
            Halaman ini khusus untuk manajemen turnamen dan hanya dapat diakses
            oleh akun dengan peran{" "}
            <strong className="font-semibold text-slate-900">
              Organizer / Panitia Turnamen
            </strong>{" "}
            atau{" "}
            <strong className="font-semibold text-slate-900">
              Administrator
            </strong>
            .
          </p>

          <div className="mt-6 rounded-xl border border-[#e6e3da] bg-[#faf9f6] p-4">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Status Akun Anda
            </div>
            <div className="mt-1 flex flex-wrap items-center justify-between gap-2">
              <span className="font-semibold text-slate-900">
                {session?.user?.email ?? "Belum Masuk (Unauthenticated)"}
              </span>
              <span className="rounded-md border border-[#e6e3da] bg-white px-2.5 py-0.5 text-xs font-semibold uppercase text-slate-700">
                Role: {role ?? "none"}
              </span>
            </div>
          </div>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/"
              className="flex h-11 flex-1 items-center justify-center rounded-lg border border-[#e6e3da] bg-white px-4 text-center text-xs font-bold uppercase tracking-wider text-slate-800 transition hover:bg-slate-50"
            >
              Kembali ke Beranda
            </Link>
            <button
              type="button"
              onClick={handleSignOut}
              className="flex h-11 flex-1 items-center justify-center rounded-lg bg-[#111318] px-4 text-center text-xs font-bold uppercase tracking-wider text-[#f5eedb] transition hover:bg-neutral-800"
            >
              Ganti Akun / Keluar
            </button>
          </div>
        </div>
      </main>
    );
  }

  return <>{children}</>;
}
