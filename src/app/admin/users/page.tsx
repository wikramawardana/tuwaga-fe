"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import { useSession } from "@/lib/auth-client";

interface UserItem {
  id: string;
  name: string | null;
  email: string;
  role: string | null;
  image: string | null;
  createdAt: string;
}

export default function AdminUsersPage() {
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "admin";

  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [selectedFilter, setSelectedFilter] = useState<
    "all" | "admin" | "organizer" | "user"
  >("all");

  const [assignEmail, setAssignEmail] = useState("");
  const [assignRole, setAssignRole] = useState<"organizer" | "admin" | "user">(
    "organizer",
  );
  const [assigning, setAssigning] = useState(false);
  const [assignMessage, setAssignMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/admin/users");
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Gagal memuat daftar kru & pengguna");
      }
      const data = await res.json();
      setUsers(data.users || []);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Terjadi kesalahan saat memuat data",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAdmin) {
      fetchUsers();
    }
  }, [isAdmin, fetchUsers]);

  const handleUpdateRole = async (
    userId: string,
    newRole: "admin" | "organizer" | "user",
  ) => {
    try {
      setUpdatingId(userId);
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, role: newRole }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Gagal mengubah role");
      }

      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u)),
      );
    } catch (err) {
      alert(err instanceof Error ? err.message : "Gagal mengubah role");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleAssignByEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignEmail.trim()) return;

    try {
      setAssigning(true);
      setAssignMessage(null);

      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: assignEmail.trim(), role: assignRole }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Gagal menetapkan peran");
      }

      setAssignMessage({
        type: "success",
        text: `Role ${assignRole.toUpperCase()} berhasil diberikan ke ${assignEmail}`,
      });
      setAssignEmail("");
      fetchUsers();
    } catch (err) {
      setAssignMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Gagal menetapkan peran",
      });
    } finally {
      setAssigning(false);
    }
  };

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      Boolean(u.name?.toLowerCase().includes(search.toLowerCase()));

    if (!matchesSearch) return false;

    const role = (u.role || "user").toLowerCase();
    if (selectedFilter === "admin") return role === "admin";
    if (selectedFilter === "organizer")
      return role === "organizer" || role === "panitia";
    if (selectedFilter === "user") return role === "user";
    return true;
  });

  if (!isAdmin) {
    return (
      <>
        <Navbar active="admin" />
        <main className="min-h-screen pt-24 px-6 bg-[#FAF9F6]">
          <div className="mx-auto max-w-xl rounded-2xl border border-[#E6E3DA] bg-white p-8 shadow-xs">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-4xl text-rose-500">
                admin_panel_settings
              </span>
              <h1 className="text-2xl font-bold tracking-tight text-[#0C0D11]">
                Khusus Super Administrator
              </h1>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-[#5A5751]">
              Halaman penetapan hak akses kru dan admin hanya dapat dibuka oleh
              akun dengan role <strong>Admin</strong>.
            </p>
            <div className="mt-6">
              <Link
                href="/admin"
                className="inline-flex h-11 items-center justify-center rounded-lg bg-[#0C0D11] px-5 text-sm font-semibold text-[#F5EEDB] shadow-xs hover:bg-neutral-800 transition-colors"
              >
                Kembali ke Dashboard Turnamen
              </Link>
            </div>
          </div>
        </main>
        <Footer showAdminPortal={false} />
      </>
    );
  }

  return (
    <>
      <Navbar active="admin" />

      <main className="min-h-screen pt-16 bg-[#FAF9F6]">
        <section className="relative overflow-hidden border-b border-[#E6E3DA] bg-[#0C0D11] text-white">
          <div className="relative mx-auto max-w-[1400px] px-6 py-12 md:px-10 md:py-14">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <span className="inline-flex items-center rounded-full border border-white/20 bg-white/10 px-3.5 py-1 text-xs font-semibold uppercase tracking-wider text-[#F5EEDB] backdrop-blur-xs">
                  Admin Ops · Crew & Roles
                </span>
                <h1 className="mt-4 text-3xl font-bold tracking-tight text-white sm:text-5xl">
                  Manajemen Peran & Kru Turnamen
                </h1>
                <p className="mt-3 max-w-3xl text-sm leading-relaxed text-neutral-300 sm:text-base">
                  Atur hak akses operasional. <strong>Admin</strong> memiliki
                  kendali penuh termasuk asisten AI Hermes.{" "}
                  <strong>Organizer (Panitia)</strong> dapat mengelola turnamen,
                  bagan, dan skor. Akun <strong>User</strong> dilarang masuk ke
                  workspace ini (403).
                </p>
              </div>

              <Link
                href="/admin"
                className="inline-flex h-11 items-center gap-2 rounded-lg border border-white/20 bg-white/5 px-4 text-sm font-semibold text-white shadow-xs transition hover:bg-white/10 hover:border-white/30"
              >
                <span className="material-symbols-outlined text-lg">
                  arrow_back
                </span>
                Dashboard
              </Link>
            </div>
          </div>
        </section>

        <div className="mx-auto max-w-[1400px] px-4 py-8 md:px-10">
          {/* Quick Assign Form */}
          <div className="mb-8 rounded-xl border border-[#e6e3da] bg-white p-6 shadow-xs">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-2xl text-slate-800">
                person_add
              </span>
              <h2 className="text-lg font-bold text-slate-900">
                Tetapkan Peran via Email
              </h2>
            </div>
            <p className="mt-1 text-xs font-medium text-slate-500">
              Pengguna yang sudah pernah login sekali dengan Google dapat
              langsung ditingkatkan menjadi Organizer atau Admin.
            </p>

            <form
              onSubmit={handleAssignByEmail}
              className="mt-5 flex flex-wrap items-center gap-3"
            >
              <input
                type="email"
                placeholder="nama@email.com"
                value={assignEmail}
                onChange={(e) => setAssignEmail(e.target.value)}
                required
                className="h-11 min-w-[280px] flex-1 rounded-lg border border-[#e6e3da] px-4 text-sm font-medium focus:border-[#111318] focus:outline-none"
              />

              <select
                value={assignRole}
                onChange={(e) =>
                  setAssignRole(
                    e.target.value as "organizer" | "admin" | "user",
                  )
                }
                className="h-11 rounded-lg border border-[#e6e3da] bg-white px-3 text-xs font-semibold focus:border-[#111318] focus:outline-none"
              >
                <option value="organizer">Organizer (Panitia)</option>
                <option value="admin">Admin (Full + Hermes AI)</option>
                <option value="user">User Biasa</option>
              </select>

              <button
                type="submit"
                disabled={assigning}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-[#111318] px-6 text-xs font-bold uppercase tracking-wider text-[#f5eedb] hover:bg-neutral-800 disabled:opacity-50 transition"
              >
                {assigning ? "Menyimpan…" : "Tetapkan Peran"}
              </button>
            </form>

            {assignMessage && (
              <div
                className={`mt-4 rounded-lg border p-3 text-xs font-semibold ${
                  assignMessage.type === "success"
                    ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                    : "border-rose-200 bg-rose-50 text-rose-900"
                }`}
              >
                {assignMessage.text}
              </div>
            )}
          </div>

          {/* User List Header Controls */}
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap gap-2">
              {(
                [
                  { id: "all", label: "Semua Akun" },
                  { id: "admin", label: "Admin" },
                  { id: "organizer", label: "Organizer (Panitia)" },
                  { id: "user", label: "User Biasa" },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setSelectedFilter(tab.id)}
                  className={`rounded-lg border px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider transition ${
                    selectedFilter === tab.id
                      ? "border-[#111318] bg-[#111318] text-[#f5eedb]"
                      : "border-[#e6e3da] bg-white text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="relative w-full sm:w-72">
              <input
                type="text"
                placeholder="Cari email atau nama..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-10 w-full rounded-lg border border-[#e6e3da] bg-white pl-9 pr-4 text-xs font-medium focus:border-[#111318] focus:outline-none"
              />
              <span className="material-symbols-outlined absolute left-2.5 top-2.5 text-base text-slate-400">
                search
              </span>
            </div>
          </div>

          {/* Users Table */}
          {loading ? (
            <div className="rounded-xl border border-[#e6e3da] bg-white p-12 text-center shadow-xs">
              <span className="material-symbols-outlined admin-spin text-4xl text-slate-700">
                progress_activity
              </span>
              <p className="mt-3 text-xs font-bold uppercase tracking-wider text-slate-500">
                Memuat daftar pengguna...
              </p>
            </div>
          ) : error ? (
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-rose-900 shadow-xs">
              <p className="font-semibold">{error}</p>
              <button
                type="button"
                onClick={fetchUsers}
                className="mt-3 rounded-lg border border-rose-300 bg-white px-3 py-1 text-xs font-bold uppercase"
              >
                Coba Lagi
              </button>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="rounded-xl border border-[#e6e3da] bg-white p-12 text-center shadow-xs">
              <p className="text-sm font-medium text-slate-500">
                Tidak ada pengguna yang cocok dengan pencarian.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-[#e6e3da] bg-white shadow-xs">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-[#e6e3da] bg-[#faf9f6] text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    <th className="px-5 py-4">Pengguna</th>
                    <th className="px-5 py-4">Email</th>
                    <th className="px-5 py-4">Peran Saat Ini</th>
                    <th className="px-5 py-4 text-right">Ubah Hak Akses</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e6e3da]">
                  {filteredUsers.map((user) => {
                    const currentRole = (user.role || "user").toLowerCase();
                    const isUpdating = updatingId === user.id;

                    return (
                      <tr
                        key={user.id}
                        className="hover:bg-slate-50/70 transition-colors"
                      >
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            {user.image ? (
                              <Image
                                src={user.image}
                                alt={user.name || user.email}
                                width={36}
                                height={36}
                                className="h-9 w-9 rounded-full border border-[#e6e3da] object-cover"
                              />
                            ) : (
                              <div className="flex h-9 w-9 items-center justify-center rounded-full border border-[#e6e3da] bg-[#faf9f6] text-xs font-bold text-slate-800">
                                {(user.name || user.email)[0].toUpperCase()}
                              </div>
                            )}
                            <div>
                              <p className="font-bold text-slate-900">
                                {user.name || "—"}
                              </p>
                              <p className="text-[11px] font-medium text-slate-400">
                                ID: {user.id.slice(0, 8)}…
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="px-5 py-4 text-sm font-semibold text-slate-800">
                          {user.email}
                        </td>

                        <td className="px-5 py-4">
                          {currentRole === "admin" ? (
                            <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-300/80 bg-amber-50 px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider text-amber-900">
                              <span className="material-symbols-outlined text-[14px]">
                                stars
                              </span>
                              Admin (+ Hermes AI)
                            </span>
                          ) : currentRole === "organizer" ||
                            currentRole === "panitia" ? (
                            <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-300/80 bg-blue-50 px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider text-blue-900">
                              <span className="material-symbols-outlined text-[14px]">
                                sports
                              </span>
                              Organizer (Panitia)
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 rounded-full border border-neutral-200 bg-neutral-50 px-2.5 py-0.5 text-xs font-medium uppercase text-slate-600">
                              User Biasa (403)
                            </span>
                          )}
                        </td>

                        <td className="px-5 py-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {currentRole !== "admin" && (
                              <button
                                type="button"
                                disabled={isUpdating}
                                onClick={() =>
                                  handleUpdateRole(user.id, "admin")
                                }
                                className="rounded-lg border border-[#e6e3da] bg-white px-2.5 py-1 text-xs font-semibold uppercase tracking-wider text-slate-800 hover:border-amber-400 hover:bg-amber-50 disabled:opacity-50 transition"
                                title="Beri akses Admin dan Hermes AI"
                              >
                                Set Admin
                              </button>
                            )}

                            {currentRole !== "organizer" &&
                              currentRole !== "panitia" && (
                                <button
                                  type="button"
                                  disabled={isUpdating}
                                  onClick={() =>
                                    handleUpdateRole(user.id, "organizer")
                                  }
                                  className="rounded-lg border border-[#e6e3da] bg-white px-2.5 py-1 text-xs font-semibold uppercase tracking-wider text-slate-800 hover:border-blue-400 hover:bg-blue-50 disabled:opacity-50 transition"
                                  title="Beri akses operasional turnamen"
                                >
                                  Set Organizer
                                </button>
                              )}

                            {currentRole !== "user" && (
                              <button
                                type="button"
                                disabled={isUpdating}
                                onClick={() =>
                                  handleUpdateRole(user.id, "user")
                                }
                                className="rounded-lg border border-[#e6e3da] bg-white px-2.5 py-1 text-xs font-semibold uppercase tracking-wider text-rose-600 hover:border-rose-300 hover:bg-rose-50 disabled:opacity-50 transition"
                                title="Cabut akses operasional (jadikan user biasa)"
                              >
                                Cabut Akses
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      <Footer showAdminPortal={false} />
    </>
  );
}
