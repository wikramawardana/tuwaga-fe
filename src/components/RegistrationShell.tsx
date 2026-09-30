import Link from "next/link";
import type { ReactNode } from "react";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import RegistrationProgress from "@/components/RegistrationProgress";

type RegistrationShellProps = {
  current?: number;
  title?: string;
  description?: ReactNode;
  headerAlign?: "left" | "center";
  showProgress?: boolean;
  steps?: string[];
  parentLabel?: string;
  parentHref?: string;
  currentLabel?: string;
  hideFooter?: boolean;
  children: ReactNode;
};

export default function RegistrationShell({
  current,
  title,
  description,
  headerAlign = "left",
  showProgress = false,
  steps,
  parentLabel = "Home",
  parentHref = "/",
  currentLabel = "Register",
  hideFooter = false,
  children,
}: RegistrationShellProps) {
  const isCentered = headerAlign === "center";

  return (
    <div className="flex min-h-screen flex-col bg-canvas text-ink-950">
      <Navbar active="register" />

      <main className="flex-1 pb-16 pt-16">
        <section className="relative isolate overflow-hidden bg-ink-950 text-cream-100">
          <div className="texture-grain pointer-events-none absolute inset-0 -z-10 opacity-60" />
          <div className="container-page pb-10 pt-10 md:pb-12 md:pt-12">
            <nav
              aria-label="Breadcrumb"
              className={`eyebrow flex items-center gap-2 text-[10px] text-cream-100/45 ${
                isCentered ? "justify-center" : ""
              }`}
            >
              <Link
                href={parentHref}
                className="truncate transition-colors hover:text-cream-50"
              >
                {parentLabel}
              </Link>
              <span aria-hidden="true">/</span>
              <span className="text-cream-100/80" aria-current="page">
                {currentLabel}
              </span>
            </nav>

            {title ? (
              <header
                className={`mt-6 max-w-4xl ${isCentered ? "mx-auto text-center" : ""}`}
              >
                <p className="eyebrow text-brand-500">Player registration</p>
                <h1 className="mt-3 text-[clamp(2rem,4.5vw,3.25rem)] font-semibold leading-[0.98] tracking-[-0.035em] text-cream-50">
                  {title}
                </h1>
                {description ? (
                  <p className="mt-3 text-base leading-relaxed text-cream-100/60">
                    {description}
                  </p>
                ) : null}
              </header>
            ) : null}
          </div>
        </section>

        <div className="container-page pt-10">
          {showProgress ? (
            <RegistrationProgress steps={steps} current={current ?? 0} />
          ) : null}

          {children}
        </div>
      </main>

      {!hideFooter && <Footer />}
    </div>
  );
}
