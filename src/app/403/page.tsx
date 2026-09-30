"use client";

import AccessDenied from "@/components/AccessDenied";
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
    <AccessDenied
      title="Akses khusus Organizer & Admin"
      description={
        <>
          Command Center turnamen hanya dapat diakses oleh akun dengan peran{" "}
          <strong className="font-semibold text-cream-50">
            Organizer (Panitia Turnamen)
          </strong>{" "}
          atau{" "}
          <strong className="font-semibold text-cream-50">Administrator</strong>
          .
        </>
      }
      email={session?.user?.email}
      role={session?.user ? (session.user.role ?? "user") : null}
      onSignOut={handleSignOut}
    />
  );
}
