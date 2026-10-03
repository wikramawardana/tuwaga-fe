"use client";

import {
  ArrowRightIcon,
  LinkSimpleIcon,
  MagnifyingGlassIcon,
} from "@phosphor-icons/react/dist/ssr";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Reveal from "./Reveal";

export default function TournamentLinkLookup() {
  const router = useRouter();
  const [inputVal, setInputVal] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const handleLookup = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = inputVal.trim();
    if (!trimmed) {
      setErrorMsg("Please enter a tournament slug or URL.");
      return;
    }

    // Extract slug whether user pasted full URL, relative path, or just slug
    let slug = trimmed;
    try {
      if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
        const url = new URL(trimmed);
        const pathParts = url.pathname.split("/").filter(Boolean);
        const tourneyIdx = pathParts.indexOf("tournaments");
        if (tourneyIdx !== -1 && pathParts[tourneyIdx + 1]) {
          slug = pathParts[tourneyIdx + 1];
        } else if (pathParts.length > 0) {
          slug = pathParts[pathParts.length - 1];
        }
      } else if (trimmed.includes("/")) {
        const parts = trimmed.split("/").filter(Boolean);
        slug = parts[parts.length - 1];
      }
    } catch {
      slug = trimmed;
    }

    slug = slug.toLowerCase().replace(/[^a-z0-9-_]/g, "");

    if (!slug) {
      setErrorMsg("Could not detect a valid tournament identifier.");
      return;
    }

    setErrorMsg("");
    router.push(`/tournaments/${slug}`);
  };

  return (
    <section
      id="lookup"
      className="bg-ink-950 py-16 text-cream-100 border-t border-cream-200/10"
    >
      <div className="container-page">
        <Reveal className="mx-auto max-w-2xl text-center">
          <span className="eyebrow inline-flex items-center gap-2 rounded-full border border-cream-200/20 bg-cream-200/5 px-3 py-1 text-cream-100/70">
            <LinkSimpleIcon className="text-brand-500" weight="bold" />
            Private Tournament Access
          </span>
          <h2 className="mt-4 text-2xl font-bold tracking-tight text-cream-50 sm:text-3xl">
            Received a tournament link from your organizer?
          </h2>
          <p className="mt-2.5 text-sm leading-relaxed text-cream-100/60">
            Tuwaga tournaments are invitation-based and private to each
            community. Paste the link or enter the tournament code below to go
            straight to your portal.
          </p>

          <form
            onSubmit={handleLookup}
            className="mt-7 flex flex-col sm:flex-row gap-2"
          >
            <div className="relative flex-1">
              <MagnifyingGlassIcon
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-lg text-cream-100/40"
                weight="bold"
              />
              <input
                type="text"
                value={inputVal}
                onChange={(e) => {
                  setInputVal(e.target.value);
                  if (errorMsg) setErrorMsg("");
                }}
                placeholder="Paste tournament link or enter slug (e.g. event-slug)..."
                className="w-full h-12 rounded-xl border border-cream-200/20 bg-ink-900/90 pl-11 pr-4 text-sm text-cream-50 placeholder:text-cream-100/30 outline-none transition focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
              />
            </div>
            <button
              type="submit"
              className="btn btn-primary h-12 px-6 shrink-0"
            >
              Access Portal
              <ArrowRightIcon weight="bold" />
            </button>
          </form>

          {errorMsg && (
            <p className="mt-3 text-xs font-semibold text-rose-400">
              {errorMsg}
            </p>
          )}

          <p className="mt-4 text-xs text-cream-100/40">
            Organizers provide links in the format:{" "}
            <code className="rounded bg-ink-900 px-1.5 py-0.5 text-brand-400 font-mono">
              tuwaga.wikra.my.id/tournaments/your-slug
            </code>
          </p>
        </Reveal>
      </div>
    </section>
  );
}
