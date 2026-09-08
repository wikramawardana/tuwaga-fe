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
    <div className="neo-public flex min-h-screen flex-col">
      <Navbar />
      <main className="relative flex flex-1 items-center overflow-hidden px-6 pb-20 pt-32 md:px-10">
        <div className="pointer-events-none absolute -right-24 top-20 h-96 w-96 rounded-full bg-[#f5eedb]/40 blur-3xl" />
        <div className="mx-auto grid w-full max-w-[1200px] items-center gap-10 lg:grid-cols-[1fr_360px]">
          <div className="relative z-10">
            <p className="public-kicker">{eyebrow}</p>
            <h1 className="public-title mt-7 max-w-3xl text-4xl font-bold tracking-tight text-[#0c0d11] md:text-6xl">
              {title}
            </h1>
            <p className="mt-6 max-w-xl border-l-2 border-[#0c0d11] pl-5 text-base font-medium leading-relaxed text-slate-600">
              {description}
            </p>
            <Link
              href="/"
              className="mt-8 inline-flex h-11 items-center gap-2 rounded-xl border border-[#0c0d11] bg-[#0c0d11] px-5 text-xs font-semibold uppercase tracking-wider text-[#f5eedb] transition hover:bg-black active:scale-95"
            >
              <span className="material-symbols-outlined text-base">
                arrow_back
              </span>
              Back to tournaments
            </Link>
          </div>

          <div className="relative z-10 flex aspect-square items-center justify-center rounded-2xl border border-[#e6e3da] bg-white p-8 shadow-sm">
            <div className="flex h-36 w-36 items-center justify-center rounded-2xl border border-[#e6e3da] bg-[#faf9f6]">
              <span className="material-symbols-outlined text-[72px] text-[#0c0d11]">
                {icon}
              </span>
            </div>
            <span className="absolute -bottom-3 -left-3 rounded-lg border border-[#e6e3da] bg-[#0c0d11] px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wider text-[#f5eedb] shadow-sm">
              Coming soon
            </span>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
