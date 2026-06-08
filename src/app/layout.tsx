import type { Metadata } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import Loader from "@/components/Loader";
import PageTransition from "@/components/PageTransition";

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "TUWAGA — Live Scoring & Tournament Operations",
  description:
    "Run live scoring, brackets, and referee scoring workflows from one tournament operations platform.",
  icons: {
    icon: "/tuwaga-favicon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="light">
      <head>
        {/* Material Symbols */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
        />
      </head>
      <body
        className={`${plusJakartaSans.variable} ${inter.variable} bg-background font-sans text-on-surface antialiased min-h-screen flex flex-col`}
      >
        <Loader />
        <PageTransition>{children}</PageTransition>
      </body>
    </html>
  );
}
