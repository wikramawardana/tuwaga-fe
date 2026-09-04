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
      <main className="neo-admin flex min-h-screen items-center justify-center bg-[#f4f0ea] px-6 py-12 text-slate-950">
        <div className="w-full max-w-xl rounded-2xl border-4 border-black bg-white p-8 shadow-[8px_8px_0_#000] sm:p-10">
          <div className="flex items-start justify-between gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl border-3 border-black bg-rose-500 text-white shadow-[4px_4px_0_#000]">
              <span className="material-symbols-outlined text-4xl">block</span>
            </div>
            <span className="neo-sticker -rotate-1 bg-rose-200 text-rose-950">
              Error 403 · Akses Ditolak
            </span>
          </div>

          <h1 className="mt-6 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
            Khusus Panitia (Organizer) & Admin
          </h1>

          <p className="mt-3 text-base leading-relaxed text-slate-600">
            Halaman ini khusus untuk manajemen turnamen dan hanya dapat diakses
            oleh akun dengan peran{" "}
            <strong className="text-slate-950 underline decoration-amber-400 decoration-4">
              Organizer / Panitia Turnamen
            </strong>{" "}
            atau{" "}
            <strong className="text-slate-950 underline decoration-blue-400 decoration-4">
              Administrator
            </strong>
            .
          </p>

          <div className="mt-6 rounded-xl border-2 border-black bg-slate-50 p-4">
            <div className="text-xs font-black uppercase tracking-wider text-slate-500">
              Status Akun Anda
            </div>
            <div className="mt-1 flex flex-wrap items-center justify-between gap-2">
              <span className="font-extrabold text-slate-950">
                {session?.user?.email ?? "Belum Masuk (Unauthenticated)"}
              </span>
              <span className="rounded-md border border-black bg-slate-200 px-2 py-0.5 text-xs font-black uppercase text-slate-800">
                Role: {role ?? "none"}
              </span>
            </div>
          </div>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/"
              className="flex h-12 flex-1 items-center justify-center rounded-xl border-2 border-black bg-slate-100 px-4 text-center text-sm font-black text-slate-900 shadow-[2px_2px_0_#000] transition hover:bg-slate-200"
            >
              Kembali ke Beranda
            </Link>
            <button
              type="button"
              onClick={handleSignOut}
              className="flex h-12 flex-1 items-center justify-center rounded-xl border-2 border-black bg-[#246bfe] px-4 text-center text-sm font-black text-white shadow-[2px_2px_0_#000] transition hover:bg-blue-600"
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
