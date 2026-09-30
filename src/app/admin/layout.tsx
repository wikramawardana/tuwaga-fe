"use client";

import { CircleNotchIcon } from "@phosphor-icons/react/dist/ssr";
import AccessDenied from "@/components/AccessDenied";
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
      <div className="flex min-h-screen items-center justify-center bg-canvas text-ink-900">
        <div className="flex flex-col items-center">
          <CircleNotchIcon
            className="admin-spin text-4xl text-brand-500"
            weight="bold"
            aria-hidden="true"
          />
          <p className="eyebrow mt-4 text-ink-500">Memverifikasi hak akses…</p>
        </div>
      </div>
    );
  }

  const role = session?.user?.role;
  const isAllowed =
    role === "admin" || role === "organizer" || role === "panitia";

  if (!session || !isAllowed) {
    return (
      <AccessDenied
        title="Khusus Panitia (Organizer) & Admin"
        description={
          <>
            Halaman ini khusus untuk manajemen turnamen dan hanya dapat diakses
            oleh akun dengan peran{" "}
            <strong className="font-semibold text-cream-50">
              Organizer / Panitia Turnamen
            </strong>{" "}
            atau{" "}
            <strong className="font-semibold text-cream-50">
              Administrator
            </strong>
            .
          </>
        }
        email={session?.user?.email ?? "Belum masuk (unauthenticated)"}
        role={role ?? "none"}
        onSignOut={handleSignOut}
      />
    );
  }

  return <>{children}</>;
}
