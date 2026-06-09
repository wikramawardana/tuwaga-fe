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
  children: ReactNode;
};

export default function RegistrationShell({
  current,
  title,
  description,
  headerAlign = "left",
  showProgress = true,
  children,
}: RegistrationShellProps) {
  const isCentered = headerAlign === "center";

  return (
    <div className="min-h-screen bg-background text-on-surface flex flex-col">
      <Navbar active="register" />

      <main className="flex-1 px-6 pb-12 pt-28 md:px-10">
        <div className="mx-auto w-full max-w-[1200px]">
          <PageBreadcrumb
            parentLabel="Home"
            parentHref="/"
            current="Register"
          />

          {showProgress ? (
            <RegistrationProgress current={current ?? 0} />
          ) : null}

          {title ? (
            <header
              className={`mb-8 max-w-4xl ${
                isCentered ? "mx-auto text-center" : ""
              }`}
            >
              <h1 className="text-[32px] font-semibold leading-[1.25] tracking-[-0.01em] text-on-surface">
                {title}
              </h1>
              {description ? (
                <p className="mt-2 text-[16px] font-normal leading-[1.5] text-on-surface-variant">
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
