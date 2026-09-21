import type { ReactNode } from "react";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import PageBreadcrumb from "@/components/PageBreadcrumb";
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
  children,
}: RegistrationShellProps) {
  const isCentered = headerAlign === "center";

  return (
    <div className="flex min-h-screen flex-col bg-background text-on-surface">
      <Navbar active="register" />

      <main className="flex-1 px-6 pb-16 pt-28 md:px-10">
        <div className="mx-auto w-full max-w-[1200px]">
          <PageBreadcrumb
            parentLabel={parentLabel}
            parentHref={parentHref}
            current={currentLabel}
          />

          {showProgress ? (
            <RegistrationProgress steps={steps} current={current ?? 0} />
          ) : null}

          {title ? (
            <header
              className={`mb-8 max-w-4xl ${
                isCentered ? "mx-auto text-center" : ""
              }`}
            >
              <p className="mb-2 text-xs font-bold uppercase tracking-widest text-primary">
                Player registration
              </p>
              <h1 className="text-3xl font-extrabold tracking-tight text-on-surface md:text-4xl">
                {title}
              </h1>
              {description ? (
                <p className="mt-2 text-base font-normal leading-relaxed text-on-surface-variant">
                  {description}
                </p>
              ) : null}
            </header>
          ) : null}

          {children}
        </div>
      </main>

      <Footer />
    </div>
  );
}
