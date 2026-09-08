import Image from "next/image";
import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-slate-200/80 bg-white py-5 text-on-surface">
      <div className="mx-auto flex max-w-[1200px] flex-col items-center justify-between gap-4 px-6 sm:flex-row md:px-10">
        <Link
          href="/"
          className="inline-flex items-center transition hover:opacity-80"
        >
          <Image
            src="/tuwaga-logo.png"
            alt="TUWAGA SKOR"
            width={104}
            height={28}
            className="h-6 w-auto"
          />
        </Link>
        <p className="text-center text-xs text-slate-500 sm:text-right">
          © 2026 TUWAGA SKOR. Live scoring and tournament operations for
          Indonesia.
        </p>
      </div>
    </footer>
  );
}
