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
    <div className="flex min-h-screen flex-col bg-[#FAF9F6]">
      <Navbar />
      <main className="relative flex flex-1 items-center overflow-hidden px-6 pb-20 pt-32 md:px-10">
        <div className="mx-auto grid w-full max-w-[1200px] items-center gap-10 lg:grid-cols-[1fr_360px]">
          <div className="relative z-10">
            <span className="inline-flex items-center rounded-full border border-[#E6E3DA] bg-white px-3.5 py-1 text-xs font-semibold uppercase tracking-wider text-[#0C0D11]">
              {eyebrow}
            </span>
            <h1 className="mt-5 max-w-3xl text-4xl font-extrabold tracking-tight text-[#0C0D11] md:text-5xl">
              {title}
            </h1>
            <p className="mt-4 max-w-xl text-base leading-relaxed text-[#5A5751]">
              {description}
            </p>
            <Link
              href="/"
              className="mt-8 inline-flex h-11 items-center gap-2 rounded-lg bg-[#0C0D11] px-5 text-sm font-semibold text-[#F5EEDB] shadow-xs transition-colors hover:bg-neutral-800"
            >
              <span className="material-symbols-outlined text-lg">
                arrow_back
              </span>
              Back to tournaments
            </Link>
          </div>

          <div className="relative z-10 flex aspect-square items-center justify-center rounded-2xl border border-[#E6E3DA] bg-white p-8 shadow-xs">
            <div className="flex h-36 w-36 items-center justify-center rounded-2xl border border-[#E6E3DA] bg-[#FAF9F6]">
              <span className="material-symbols-outlined text-[72px] text-[#0C0D11]">
                {icon}
              </span>
            </div>
            <span className="absolute -bottom-3 -left-3 rounded-md bg-[#0C0D11] px-3.5 py-1 text-xs font-semibold uppercase tracking-wider text-[#F5EEDB] shadow-xs">
              Coming soon
            </span>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
