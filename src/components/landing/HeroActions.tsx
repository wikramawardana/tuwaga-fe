"use client";

import { ArrowRightIcon } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { primaryAction } from "@/lib/featuredTournament";
import { useFeaturedTournament } from "./FeaturedTournamentContext";

/** Hero CTA row: points at the featured tournament when there is one. */
export default function HeroActions() {
  const { tournament, loading } = useFeaturedTournament();

  if (loading) {
    return (
      <div className="cta-row" aria-hidden="true">
        <span className="h-[3.25rem] w-full animate-pulse rounded-[10px] bg-cream-200/10 sm:w-52" />
        <span className="h-[3.25rem] w-full animate-pulse rounded-[10px] bg-cream-200/5 sm:w-44" />
      </div>
    );
  }

  if (!tournament) {
    return (
      <div className="cta-row">
        <Link href="/tournaments/live" className="btn btn-lg btn-primary">
          Watch live scores
          <ArrowRightIcon weight="bold" aria-hidden="true" />
        </Link>
        <Link
          href="/tournaments/bracket"
          className="btn btn-lg btn-outline-dark"
        >
          Explore brackets
        </Link>
      </div>
    );
  }

  const action = primaryAction(tournament);
  return (
    <div className="cta-row">
      <Link href={action.href} className="btn btn-lg btn-primary">
        {action.label}
        <ArrowRightIcon weight="bold" aria-hidden="true" />
      </Link>
      <Link
        href={`/tournaments/${tournament.slug}`}
        className="btn btn-lg btn-outline-dark"
      >
        Portal & Cek Status
      </Link>
    </div>
  );
}
