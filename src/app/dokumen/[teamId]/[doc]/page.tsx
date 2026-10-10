"use client";

import {
  ArrowClockwiseIcon,
  CircleNotchIcon,
  FileXIcon,
  WarningIcon,
} from "@phosphor-icons/react/dist/ssr";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { type ReactNode, useEffect, useState } from "react";
import AccessDenied from "@/components/AccessDenied";
import RadarArt from "@/components/landing/RadarArt";
import { signOutEverywhere, useSession } from "@/lib/auth-client";
import { getDocumentUrl, isDocumentKind } from "@/lib/tuwagaApi";

type ViewState = "loading" | "forbidden" | "not_found" | "error";

/** Charcoal status screen matching the shared 403 page. */
function DocumentStatus({
  eyebrow,
  icon,
  title,
  description,
  children,
}: {
  eyebrow: string;
  icon: ReactNode;
  title: string;
  description: ReactNode;
  children?: ReactNode;
}) {
  return (
    <main className="relative isolate flex min-h-screen flex-col overflow-hidden bg-ink-950 text-cream-100">
      <div className="texture-grain pointer-events-none absolute inset-0 -z-10 opacity-60" />
      <div className="pointer-events-none absolute -right-80 top-1/2 -z-10 w-[60rem] -translate-y-1/2 opacity-60 [&_text]:hidden">
        <RadarArt className="h-auto w-full" showCourts={false} />
      </div>

      <header className="container-page flex h-16 items-center">
        <Link href="/" className="transition-opacity hover:opacity-80">
          <Image
            src="/tuwaga-logo-cream.png"
            alt="TUWAGA SKOR"
            unoptimized
            width={119}
            height={28}
            className="h-7 w-auto"
          />
        </Link>
      </header>

      <div className="container-page flex flex-1 items-center py-12">
        <div className="w-full max-w-xl">
          <p className="eyebrow flex items-center gap-2.5 text-brand-500">
            {icon}
            {eyebrow}
          </p>
          <h1 className="mt-6 text-[clamp(2.25rem,5vw,3.5rem)] font-medium leading-[1] tracking-[-0.04em] text-cream-50">
            {title}
          </h1>
          <p className="mt-5 max-w-lg text-base leading-relaxed text-cream-100/65">
            {description}
          </p>
          {children ? <div className="cta-row mt-10">{children}</div> : null}
        </div>
      </div>
    </main>
  );
}

export default function DocumentPage() {
  const params = useParams<{ teamId: string; doc: string }>();
  const teamId = params?.teamId ?? "";
  const doc = params?.doc ?? "";

  const { data: session } = useSession();
  const [state, setState] = useState<ViewState>("loading");

  useEffect(() => {
    // Unknown document kinds never reach the API.
    if (!teamId || !isDocumentKind(doc)) {
      setState("not_found");
      return;
    }

    let cancelled = false;
    getDocumentUrl(teamId, doc).then((result) => {
      if (cancelled) return;

      switch (result.status) {
        case "ok":
          // Navigate straight to the presigned URL; never render or log it.
          window.location.replace(result.url);
          return;
        case "unauthorized":
          // getDocumentUrl already redirects to /login with a callbackUrl.
          return;
        case "forbidden":
          setState("forbidden");
          return;
        case "not_found":
          setState("not_found");
          return;
        default:
          setState("error");
      }
    });

    return () => {
      cancelled = true;
    };
  }, [doc, teamId]);

  if (state === "forbidden") {
    return (
      <AccessDenied
        title="Akses dokumen ditolak"
        description={
          <>
            Dokumen pendaftaran bersifat privat dan hanya dapat dilihat oleh{" "}
            <strong className="font-semibold text-cream-50">
              Panitia / Organizer
            </strong>
            ,{" "}
            <strong className="font-semibold text-cream-50">
              Administrator
            </strong>
            , atau{" "}
            <strong className="font-semibold text-cream-50">
              verifikator yang ditugaskan
            </strong>{" "}
            pada turnamen ini.
          </>
        }
        email={session?.user?.email}
        role={session?.user ? (session.user.role ?? "user") : null}
        onSignOut={signOutEverywhere}
      />
    );
  }

  if (state === "not_found") {
    return (
      <DocumentStatus
        eyebrow="Error 404 · Tidak ditemukan"
        icon={<FileXIcon weight="bold" aria-hidden="true" />}
        title="Dokumen tidak ditemukan"
        description="Dokumen yang Anda cari tidak tersedia. Tautan mungkin salah, atau dokumen belum diunggah oleh peserta."
      >
        <Link href="/" className="btn btn-lg btn-primary">
          Kembali ke beranda
        </Link>
      </DocumentStatus>
    );
  }

  if (state === "error") {
    return (
      <DocumentStatus
        eyebrow="Terjadi kesalahan"
        icon={<WarningIcon weight="bold" aria-hidden="true" />}
        title="Dokumen gagal dimuat"
        description="Kami tidak dapat membuka dokumen ini sekarang. Periksa koneksi Anda lalu coba lagi."
      >
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="btn btn-lg btn-primary"
        >
          <ArrowClockwiseIcon weight="bold" aria-hidden="true" />
          Coba lagi
        </button>
        <Link href="/" className="btn btn-lg btn-outline-dark">
          Kembali ke beranda
        </Link>
      </DocumentStatus>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-ink-950 text-cream-100">
      <div className="flex flex-col items-center">
        <CircleNotchIcon
          className="admin-spin text-4xl text-brand-500"
          weight="bold"
          aria-hidden="true"
        />
        <p className="eyebrow mt-4 text-cream-100/60">Membuka dokumen…</p>
      </div>
    </div>
  );
}
