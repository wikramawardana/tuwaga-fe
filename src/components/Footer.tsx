import Image from "next/image";
import Link from "next/link";

export default function Footer({
  showAdminPortal = true,
}: {
  showAdminPortal?: boolean;
}) {
  return (
    <footer className="border-t-4 border-[#07142f] bg-[#071c4d] py-8 text-white">
      <div className="mx-auto max-w-[1400px] px-6 md:px-10">
        <div className="flex flex-col items-center justify-between gap-5 md:flex-row">
          <Link
            href="/"
            className="inline-flex items-center border-2 border-[#07142f] bg-white px-4 py-2 shadow-[4px_4px_0_#55dfff]"
          >
            <Image
              src="/tuwaga-logo.png"
              alt="TUWAGA"
              width={104}
              height={28}
            />
          </Link>
          <div className="flex flex-col items-center gap-4 md:flex-row md:gap-6">
            <div className="text-center md:text-right">
              <p className="text-xs font-black uppercase tracking-[0.16em] text-cyan-300">
                Play · Score · Repeat
              </p>
              <p className="mt-1 text-xs font-semibold text-blue-100/75">
                © 2026 TUWAGA. Live tournament action for Indonesia.
              </p>
            </div>

            {showAdminPortal && (
              <Link
                href="/admin"
                className="group inline-flex min-h-11 items-center gap-3 border-2 border-[#07142f] bg-[#55dfff] px-4 py-2 text-left text-[#07142f] shadow-[4px_4px_0_#020817] transition hover:-translate-y-0.5 hover:bg-[#ffe45c] hover:shadow-[6px_6px_0_#020817] focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-white"
                aria-label="Open the secure TUWAGA admin portal"
              >
                <span
                  className="material-symbols-outlined text-xl transition-transform group-hover:-rotate-6"
                  aria-hidden="true"
                >
                  lock
                </span>
                <span>
                  <span className="block text-[10px] font-black uppercase tracking-[0.15em] opacity-65">
                    Tournament crew
                  </span>
                  <span className="block text-xs font-black uppercase">
                    Admin portal
                  </span>
                </span>
                <span
                  className="material-symbols-outlined ml-1 text-lg transition-transform group-hover:translate-x-1"
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
