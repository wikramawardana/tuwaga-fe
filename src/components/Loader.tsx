"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

export default function Loader() {
  const [loading, setLoading] = useState(true);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    // Wait for fonts to be ready before revealing the page
    document.fonts.ready.then(() => {
      setTimeout(() => {
        setFading(true);
        // Unmount once the fade-out has finished
        setTimeout(() => setLoading(false), 300);
      }, 100);
    });
  }, []);

  if (!loading) return null;

  return (
    <div
      className={`fixed inset-0 z-[10000] flex items-center justify-center bg-ink-950 transition-opacity duration-300 ${
        fading ? "pointer-events-none opacity-0" : "opacity-100"
      }`}
    >
      <div className="flex flex-col items-center gap-6">
        <Image
          src="/tuwaga-logo-cream.png"
          alt="TUWAGA SKOR"
          unoptimized
          width={170}
          height={40}
          priority
          className="h-10 w-auto"
        />
        <div className="h-0.5 w-32 overflow-hidden rounded-full bg-cream-200/10">
          <div className="loader-bar h-full w-1/3 rounded-full bg-brand-500" />
        </div>
      </div>
    </div>
  );
}
