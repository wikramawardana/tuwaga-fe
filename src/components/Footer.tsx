import Image from "next/image";
import Link from "next/link";

export default function Footer({
  showAdminPortal = true,
}: {
  showAdminPortal?: boolean;
}) {
  return (
    <footer className="border-t border-white/10 bg-[#0c0d11] py-10 text-white">
      <div className="mx-auto max-w-[1400px] px-6 md:px-10">
        <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
          <Link
            href="/"
            className="inline-flex items-center py-1 transition hover:opacity-80"
          >
            <Image
              src="/tuwaga-logo-cream.png"
              alt="tuwaga skor"
              width={124}
              height={28}
              className="h-7 w-auto"
            />
          </Link>
          <div className="flex flex-col items-center gap-4 md:flex-row md:gap-6">
            <div className="text-center md:text-right">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#f5eedb]">
                Play · Score · Repeat
              </p>
              <p className="mt-1 text-xs text-white/50">
                © 2026 TUWAGA. Live tournament action for Indonesia.
              </p>
            </div>

            {showAdminPortal && (
              <Link
                href="/admin"
                className="group inline-flex min-h-10 items-center gap-2.5 rounded-lg border border-white/15 bg-white/5 px-4 py-2 text-left text-white transition hover:border-[#f5eedb]/40 hover:bg-white/10 hover:text-[#f5eedb] focus-visible:outline-2 focus-visible:outline-[#f5eedb]"
                aria-label="Open the secure TUWAGA admin portal"
              >
                <span
                  className="material-symbols-outlined text-lg text-[#f5eedb] transition-transform group-hover:scale-110"
                  aria-hidden="true"
                >
                  lock
                </span>
                <span>
                  <span className="block text-[10px] font-semibold uppercase tracking-[0.12em] text-white/50">
                    Tournament crew
                  </span>
                  <span className="block text-xs font-bold uppercase tracking-wider text-white group-hover:text-[#f5eedb]">
                    Admin portal
                  </span>
                </span>
                <span
                  className="material-symbols-outlined ml-1 text-base text-white/50 transition-transform group-hover:translate-x-0.5 group-hover:text-[#f5eedb]"
                  aria-hidden="true"
                >
                  arrow_forward
                </span>
              </Link>
            )}
          </div>
        </div>
      </div>
    </footer>
  );
}
