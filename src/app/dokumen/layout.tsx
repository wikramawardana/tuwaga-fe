import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dokumen — TUWAGA SKOR",
  robots: { index: false, follow: false },
};

export default function DocumentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
