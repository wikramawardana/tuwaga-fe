import Link from "next/link";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";

export default function PublicFeaturePage({
  eyebrow,
  title,
  description,
  icon,
}: {
  eyebrow: string;
  title: string;
  description: string;
  icon: string;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <main className="relative flex flex-1 items-center overflow-hidden px-6 pb-20 pt-32 md:px-10">
        <div className="mx-auto grid w-full max-w-[1200px] items-center gap-10 lg:grid-cols-[1fr_360px]">
          <div className="relative z-10">
            <span className="inline-flex items-center rounded-full border border-primary/20 bg-primary/8 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-primary">
              {eyebrow}
            </span>
            <h1 className="mt-5 max-w-3xl text-4xl font-extrabold tracking-tight text-on-surface md:text-5xl">
              {title}
            </h1>
            <p className="mt-4 max-w-xl text-base leading-relaxed text-on-surface-variant">
              {description}
            </p>
            <Link
              href="/"
              className="mt-8 inline-flex h-11 items-center gap-2 rounded-lg bg-primary px-5 text-sm font-bold text-on-primary shadow-sm transition-colors hover:bg-primary/90"
            >
              <span className="material-symbols-outlined text-lg">
                arrow_back
              </span>
              Back to tournaments
            </Link>
          </div>

          <div className="relative z-10 flex aspect-square items-center justify-center rounded-2xl border border-outline-variant/30 bg-white p-8 shadow-[0px_4px_20px_rgba(0,0,0,0.04)]">
            <div className="flex h-36 w-36 items-center justify-center rounded-2xl border border-outline-variant/30 bg-surface-container-low">
              <span className="material-symbols-outlined text-[72px] text-primary">
                {icon}
              </span>
            </div>
            <span className="absolute -bottom-3 -left-3 rounded-md bg-primary px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-on-primary shadow-sm">
              Coming soon
            </span>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
