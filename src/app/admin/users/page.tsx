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
        <main className="neo-admin min-h-screen pt-24 px-6">
          <div className="mx-auto max-w-xl border-4 border-black bg-white p-8 shadow-[8px_8px_0_#000]">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-4xl text-rose-500">
                admin_panel_settings
              </span>
              <h1 className="text-2xl font-black">
                Khusus Super Administrator
              </h1>
            </div>
            <p className="mt-4 text-slate-600">
              Halaman penetapan hak akses kru dan admin hanya dapat dibuka oleh
              akun dengan role <strong>Admin</strong>.
            </p>
            <div className="mt-6">
              <Link
                href="/admin"
                className="inline-flex h-12 items-center justify-center border-2 border-black bg-blue-600 px-5 text-sm font-black text-white shadow-[2px_2px_0_#000]"
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

      <main className="neo-admin min-h-screen pt-16">
        <section className="neo-hero">
          <div className="relative mx-auto max-w-[1400px] px-6 py-12 md:px-10 md:py-14">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <span className="neo-sticker -rotate-1">
                  Admin Ops · Crew & Roles
                </span>
                <h1 className="neo-title mt-4 text-3xl font-black sm:text-5xl">
                  Manajemen Peran & Kru Turnamen
                </h1>
                <p className="mt-3 max-w-3xl border-l-4 border-amber-300 pl-4 text-sm font-semibold leading-relaxed text-white sm:text-base">
                  Atur hak akses operasional. <strong>Admin</strong> memiliki
                  kendali penuh termasuk asisten AI Hermes.{" "}
                  <strong>Organizer (Panitia)</strong> dapat mengelola turnamen,
                  bagan, dan skor. Akun <strong>User</strong> dilarang masuk ke
                  workspace ini (403).
                </p>
              </div>

              <Link
                href="/admin"
                className="neo-button inline-flex h-12 items-center gap-2 border-2 border-black bg-white px-5 text-xs font-black uppercase text-[#07142f] hover:bg-slate-100"
              >
                <span className="material-symbols-outlined text-lg">
                  arrow_back
                </span>
                Kembali ke Turnamen
              </Link>
            </div>
          </div>
        </section>

        <div className="mx-auto max-w-[1400px] px-4 py-8 md:px-10">
          {/* Quick Assign Form */}
          <div className="neo-panel mb-8 border-4 border-[#07142f] bg-white p-6 shadow-[6px_6px_0_#07142f]">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-2xl text-blue-600">
                person_add
              </span>
              <h2 className="text-xl font-black text-slate-900">
                Tetapkan Peran via Email
              </h2>
            </div>
            <p className="mt-1 text-xs font-semibold text-slate-500">
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
                className="h-12 min-w-[280px] flex-1 border-2 border-[#07142f] px-4 text-sm font-bold shadow-[2px_2px_0_#07142f] focus:outline-none focus:ring-2 focus:ring-blue-500"
              />

              <select
                value={assignRole}
                onChange={(e) =>
                  setAssignRole(
                    e.target.value as "organizer" | "admin" | "user",
                  )
                }
                className="h-12 border-2 border-[#07142f] bg-white px-4 text-sm font-black shadow-[2px_2px_0_#07142f] focus:outline-none"
              >
                <option value="organizer">Organizer (Panitia)</option>
                <option value="admin">Admin (Full + Hermes AI)</option>
                <option value="user">User Biasa</option>
              </select>

              <button
                type="submit"
                disabled={assigning}
                className="neo-button inline-flex h-12 items-center justify-center gap-2 border-2 border-[#07142f] bg-[#246bfe] px-6 text-xs font-black uppercase text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {assigning ? "Menyimpan…" : "Tetapkan Peran"}
              </button>
            </form>

            {assignMessage && (
              <div
                className={`mt-4 border-2 p-3 text-xs font-black ${
                  assignMessage.type === "success"
                    ? "border-emerald-700 bg-emerald-100 text-emerald-950"
                    : "border-rose-700 bg-rose-100 text-rose-950"
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
                  className={`border-2 border-[#07142f] px-3.5 py-1.5 text-xs font-black uppercase shadow-[2px_2px_0_#07142f] transition ${
                    selectedFilter === tab.id
                      ? "bg-[#ffe45c] text-[#07142f]"
                      : "bg-white text-slate-700 hover:bg-slate-100"
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
                className="h-10 w-full border-2 border-[#07142f] bg-white pl-9 pr-4 text-xs font-bold shadow-[2px_2px_0_#07142f] focus:outline-none"
              />
              <span className="material-symbols-outlined absolute left-2.5 top-2.5 text-base text-slate-400">
                search
              </span>
            </div>
          </div>

          {/* Users Table */}
          {loading ? (
            <div className="border-4 border-[#07142f] bg-white p-12 text-center shadow-[6px_6px_0_#07142f]">
              <span className="material-symbols-outlined admin-spin text-4xl text-blue-600">
                progress_activity
              </span>
              <p className="mt-3 text-xs font-black uppercase tracking-wider text-slate-600">
                Memuat daftar pengguna...
              </p>
            </div>
          ) : error ? (
            <div className="border-4 border-rose-600 bg-rose-50 p-6 text-rose-950 shadow-[6px_6px_0_#07142f]">
              <p className="font-bold">{error}</p>
              <button
                type="button"
                onClick={fetchUsers}
                className="mt-3 border-2 border-black bg-white px-3 py-1 text-xs font-black uppercase"
              >
                Coba Lagi
              </button>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="border-4 border-[#07142f] bg-white p-12 text-center shadow-[6px_6px_0_#07142f]">
              <p className="text-base font-bold text-slate-500">
                Tidak ada pengguna yang cocok dengan pencarian.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto border-4 border-[#07142f] bg-white shadow-[8px_8px_0_#07142f]">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b-4 border-[#07142f] bg-[#f5f7ff] text-xs font-black uppercase tracking-wider text-slate-700">
                    <th className="px-5 py-4">Pengguna</th>
                    <th className="px-5 py-4">Email</th>
                    <th className="px-5 py-4">Peran Saat Ini</th>
                    <th className="px-5 py-4 text-right">Ubah Hak Akses</th>
                  </tr>
                </thead>
                <tbody className="divide-y-2 divide-[#07142f]">
                  {filteredUsers.map((user) => {
                    const currentRole = (user.role || "user").toLowerCase();
                    const isUpdating = updatingId === user.id;

                    return (
                      <tr key={user.id} className="hover:bg-blue-50/50">
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            {user.image ? (
                              <Image
                                src={user.image}
                                alt={user.name || user.email}
                                width={36}
                                height={36}
                                className="h-9 w-9 rounded-full border-2 border-[#07142f] object-cover"
                              />
                            ) : (
                              <div className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-[#07142f] bg-amber-300 text-xs font-black">
                                {(user.name || user.email)[0].toUpperCase()}
                              </div>
                            )}
                            <div>
                              <p className="font-extrabold text-slate-900">
                                {user.name || "—"}
                              </p>
                              <p className="text-[11px] font-medium text-slate-400">
                                ID: {user.id.slice(0, 8)}…
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="px-5 py-4 text-sm font-extrabold text-slate-800">
                          {user.email}
                        </td>

                        <td className="px-5 py-4">
                          {currentRole === "admin" ? (
                            <span className="inline-flex items-center gap-1.5 border-2 border-black bg-[#ffe45c] px-2.5 py-1 text-xs font-black uppercase text-[#07142f] shadow-[2px_2px_0_#000]">
                              <span className="material-symbols-outlined text-[14px]">
                                stars
                              </span>
                              Admin (+ Hermes AI)
                            </span>
                          ) : currentRole === "organizer" ||
                            currentRole === "panitia" ? (
                            <span className="inline-flex items-center gap-1.5 border-2 border-black bg-[#55dfff] px-2.5 py-1 text-xs font-black uppercase text-[#07142f] shadow-[2px_2px_0_#000]">
                              <span className="material-symbols-outlined text-[14px]">
                                sports
                              </span>
                              Organizer (Panitia)
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 border-2 border-black bg-slate-200 px-2.5 py-1 text-xs font-black uppercase text-slate-800">
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
                                className="border-2 border-black bg-white px-2.5 py-1 text-xs font-black uppercase shadow-[2px_2px_0_#000] hover:bg-[#ffe45c] disabled:opacity-50"
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
                                  className="border-2 border-black bg-white px-2.5 py-1 text-xs font-black uppercase shadow-[2px_2px_0_#000] hover:bg-[#55dfff] disabled:opacity-50"
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
                                className="border-2 border-black bg-white px-2.5 py-1 text-xs font-black uppercase text-rose-700 shadow-[2px_2px_0_#000] hover:bg-rose-100 disabled:opacity-50"
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
