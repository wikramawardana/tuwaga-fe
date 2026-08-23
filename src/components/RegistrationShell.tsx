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
    <div className="neo-public flex min-h-screen flex-col text-on-surface">
      <Navbar active="register" />

      <main className="flex-1 px-6 pb-16 pt-28 md:px-10">
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
              className={`mb-10 max-w-4xl border-l-4 border-blue-600 pl-5 ${
                isCentered ? "mx-auto text-center" : ""
              }`}
            >
              <p className="public-kicker mb-5">Player registration</p>
              <h1 className="public-title text-[38px] text-slate-950 md:text-5xl">
                {title}
              </h1>
              {description ? (
                <p className="mt-3 text-[16px] font-semibold leading-[1.5] text-on-surface-variant">
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
