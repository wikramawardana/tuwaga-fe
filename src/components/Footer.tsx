import Image from "next/image";
import Link from "next/link";

export default function Footer({
  showAdminPortal = true,
}: {
  showAdminPortal?: boolean;
}) {
  return (
    <footer className="border-t border-outline-variant/20 bg-white py-8 text-on-surface">
      <div className="mx-auto max-w-[1200px] px-6 md:px-10">
        <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
          <Link
            href="/"
            className="inline-flex items-center transition hover:opacity-80"
          >
            <Image
              src="/tuwaga-logo.png"
              alt="TUWAGA"
              width={104}
              height={28}
              className="h-7 w-auto"
            />
          </Link>
          <div className="flex flex-col items-center gap-4 md:flex-row md:gap-6">
            <p className="text-center text-xs font-semibold text-on-surface-variant md:text-right">
              © 2026 TUWAGA. Live scoring and tournament operations for
              Indonesia.
            </p>
            {showAdminPortal && (
              <Link
                href="/admin"
                className="group inline-flex items-center gap-2 rounded-lg border border-outline-variant/40 bg-surface-container-low px-3 py-1.5 text-xs font-bold text-on-surface transition hover:bg-white hover:shadow-xs"
                aria-label="Open the secure TUWAGA admin portal"
              >
                <span className="material-symbols-outlined text-base text-primary">
                  lock
                </span>
                <span>Admin portal</span>
              </Link>
            )}
          </div>
        </div>
      </div>
    </footer>
  );
}
