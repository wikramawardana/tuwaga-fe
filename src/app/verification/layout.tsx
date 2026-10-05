"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useSession } from "@/lib/auth-client";

export default function VerificationLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, isPending } = useSession();
  useEffect(() => {
    if (!isPending && !session)
      window.location.replace(
        `/login?callbackUrl=${encodeURIComponent(window.location.pathname)}`,
      );
  }, [isPending, session]);
  if (isPending || !session)
    return <p className="container-page py-24">Memverifikasi akses…</p>;
  if (
    !["admin", "organizer", "panitia", "eo"].includes(
      session.user.role ?? "user",
    )
  ) {
    return (
      <main className="container-page py-24">
        <h1 className="text-2xl font-semibold">Akses verifikasi diperlukan</h1>
        <p className="mt-3">
          Hubungi admin untuk mendapatkan akses ke turnamen yang ditugaskan.
        </p>
        <Link className="btn btn-dark mt-6" href="/tournaments">
          Portal turnamen
        </Link>
      </main>
    );
  }
  return children;
}
