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
      <div className="flex min-h-screen items-center justify-center bg-[#FAF9F6] text-[#0C0D11]">
        <div className="text-center">
          <span className="material-symbols-outlined admin-spin text-4xl text-[#0C0D11]">
            progress_activity
          </span>
          <p className="mt-4 text-xs font-semibold uppercase tracking-widest text-[#8C877D]">
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
      <main className="flex min-h-screen items-center justify-center bg-[#FAF9F6] px-6 py-12 text-[#0C0D11]">
        <div className="w-full max-w-xl rounded-2xl border border-[#E6E3DA] bg-white p-8 shadow-xs sm:p-10">
          <div className="flex items-start justify-between gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-rose-200 bg-rose-50 text-rose-600">
              <span className="material-symbols-outlined text-2xl">block</span>
            </div>
            <span className="rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-xs font-medium text-rose-700">
              Error 403 · Akses Ditolak
            </span>
          </div>

          <h1 className="mt-6 text-2xl font-bold tracking-tight text-[#0C0D11] sm:text-3xl">
            Khusus Panitia (Organizer) & Admin
          </h1>

          <p className="mt-3 text-sm leading-relaxed text-[#5A5751]">
            Halaman ini khusus untuk manajemen turnamen dan hanya dapat diakses
            oleh akun dengan peran{" "}
            <strong className="font-semibold text-[#0C0D11]">
              Organizer / Panitia Turnamen
            </strong>{" "}
            atau{" "}
            <strong className="font-semibold text-[#0C0D11]">
              Administrator
            </strong>
            .
          </p>

          <div className="mt-6 rounded-xl border border-[#E6E3DA] bg-[#FAF9F6] p-4">
            <div className="text-[11px] font-bold uppercase tracking-wider text-[#8C877D]">
              Status Akun Anda
            </div>
            <div className="mt-1 flex flex-wrap items-center justify-between gap-2">
              <span className="font-semibold text-[#0C0D11]">
                {session?.user?.email ?? "Belum Masuk (Unauthenticated)"}
              </span>
              <span className="rounded-md border border-[#E6E3DA] bg-white px-2.5 py-0.5 text-xs font-semibold uppercase text-[#0C0D11]">
                Role: {role ?? "none"}
              </span>
            </div>
          </div>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/"
              className="flex h-11 flex-1 items-center justify-center rounded-lg border border-[#E6E3DA] bg-white px-4 text-center text-sm font-semibold text-[#0C0D11] shadow-xs transition hover:bg-neutral-50"
            >
              Kembali ke Beranda
            </Link>
            <button
              type="button"
              onClick={handleSignOut}
              className="flex h-11 flex-1 items-center justify-center rounded-lg bg-[#0C0D11] px-4 text-center text-sm font-semibold text-[#F5EEDB] shadow-xs transition hover:bg-neutral-800"
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
