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
        <div className="public-dots pointer-events-none absolute -right-16 top-24 h-72 w-72 rotate-12 border-4 border-[#07142f] bg-cyan-200 opacity-50" />
        <div className="mx-auto grid w-full max-w-[1200px] items-center gap-10 lg:grid-cols-[1fr_360px]">
          <div className="relative z-10">
            <p className="public-kicker">{eyebrow}</p>
            <h1 className="public-title mt-7 max-w-3xl text-5xl text-slate-950 md:text-7xl">
              {title}
            </h1>
            <p className="mt-6 max-w-xl border-l-4 border-blue-600 pl-5 text-lg font-semibold leading-8 text-slate-600">
              {description}
            </p>
            <Link
              href="/"
              className="public-button mt-8 inline-flex h-12 items-center gap-2 bg-blue-600 px-6 text-sm font-black uppercase text-white"
            >
              <span className="material-symbols-outlined">arrow_back</span>
              Back to tournaments
            </Link>
          </div>

          <div className="public-panel neo-wiggle relative z-10 flex aspect-square items-center justify-center bg-yellow-200">
            <span className="material-symbols-outlined text-[120px] text-[#07142f]">
              {icon}
            </span>
            <span className="absolute -bottom-4 -left-4 border-3 border-[#07142f] bg-white px-4 py-2 text-xs font-black uppercase tracking-wider shadow-[4px_4px_0_#07142f]">
              Coming soon
            </span>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
