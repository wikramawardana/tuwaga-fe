import type { Metadata, Viewport } from "next";
import { Geist_Mono, Inter_Tight } from "next/font/google";
import "./globals.css";
import Loader from "@/components/Loader";
import PageTransition from "@/components/PageTransition";

const interTight = Inter_Tight({
  variable: "--font-inter-tight",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "TUWAGA SKOR — Control the Game",
  description:
    "Live scoring, brackets, order of play, and referee workflows for tournament organizers in one control room.",
  icons: {
    icon: "/tuwaga-favicon.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#171717",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${interTight.variable} ${geistMono.variable}`}>
      <body className="flex min-h-screen flex-col bg-canvas font-sans text-ink-950 antialiased">
        <Loader />
        <PageTransition>{children}</PageTransition>
      </body>
    </html>
  );
}
