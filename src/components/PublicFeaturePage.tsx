import { ArrowLeftIcon } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import Footer from "@/components/Footer";
import type { AppIcon } from "@/components/icons/SportIcons";
import RadarArt from "@/components/landing/RadarArt";
import Navbar from "@/components/Navbar";

export default function PublicFeaturePage({
  eyebrow,
  title,
  description,
  icon: FeatureIcon,
}: {
  eyebrow: string;
  title: string;
  description: string;
  icon: AppIcon;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-canvas">
      <Navbar />
      <main className="relative isolate flex flex-1 items-center overflow-hidden bg-ink-950 pb-24 pt-32 text-cream-100">
        <div className="texture-grain pointer-events-none absolute inset-0 -z-10 opacity-60" />

        <div className="container-page grid items-center gap-16 lg:grid-cols-[1fr_420px]">
          <div>
            <p className="eyebrow flex items-center gap-2.5 text-cream-100/60">
              <span className="h-1.5 w-1.5 bg-brand-500" />
              {eyebrow} · Coming soon
            </p>
            <h1 className="mt-6 max-w-2xl text-[clamp(2.5rem,6vw,4.75rem)] font-medium leading-[0.95] tracking-[-0.045em] text-cream-50">
              {title}
            </h1>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-cream-100/65 md:text-lg">
              {description}
            </p>
            <div className="cta-row mt-10">
              <Link href="/" className="btn btn-lg btn-primary">
                <ArrowLeftIcon weight="bold" aria-hidden="true" />
                Back to tournaments
              </Link>
              <Link
                href="/tournaments/live"
                className="btn btn-lg btn-outline-dark"
              >
                Watch live scores
              </Link>
            </div>
          </div>

          <div className="relative mx-auto aspect-square w-full max-w-[420px]">
            <RadarArt
              className="absolute inset-0 h-full w-full"
              showCourts={false}
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="flex h-28 w-28 items-center justify-center rounded-3xl border border-cream-200/15 bg-ink-900/90 shadow-2xl backdrop-blur">
                <FeatureIcon
                  className="text-6xl text-brand-500"
                  weight="duotone"
                  aria-hidden="true"
                />
              </span>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
