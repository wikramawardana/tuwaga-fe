import {
  PingPongIcon,
  RacquetIcon,
  TrophyIcon,
} from "@phosphor-icons/react/dist/ssr";
import {
  type AppIcon,
  PadelRacketIcon,
  ShuttlecockIcon,
} from "@/components/icons/SportIcons";

type SportMeta = { label: string; icon: AppIcon };

const sports: Record<string, SportMeta> = {
  padel: { label: "Padel", icon: PadelRacketIcon },
  tennis: { label: "Tennis", icon: RacquetIcon },
  badminton: { label: "Badminton", icon: ShuttlecockIcon },
  table_tennis: { label: "Table tennis", icon: PingPongIcon },
};

export function sportMeta(sport?: string | null): SportMeta {
  return (sport && sports[sport]) || { label: "Tournament", icon: TrophyIcon };
}

/** Sport chip used in page headers (replaces the old emoji labels). */
export default function SportBadge({
  sport,
  suffix,
  tone = "light",
  className = "",
}: {
  sport?: string | null;
  suffix?: string;
  tone?: "light" | "dark";
  className?: string;
}) {
  const { label, icon: Icon } = sportMeta(sport);
  const toneClass =
    tone === "dark"
      ? "border-cream-200/15 bg-cream-200/5 text-cream-100"
      : "border-ink-200 bg-white text-ink-800";

  return (
    <span
      className={`inline-flex h-7 items-center gap-1.5 rounded-full border px-2.5 text-xs font-semibold ${toneClass} ${className}`}
    >
      <Icon
        className="text-sm text-brand-500"
        weight="bold"
        aria-hidden="true"
      />
      {label}
      {suffix ? <span className="font-normal opacity-60">{suffix}</span> : null}
    </span>
  );
}
