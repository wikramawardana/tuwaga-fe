import type { IconWeight } from "@phosphor-icons/react";
import type { ComponentType, ReactNode, SVGProps } from "react";

/** Any icon component we render: Phosphor icons and the sport glyphs below. */
export type AppIcon = ComponentType<{
  className?: string;
  weight?: IconWeight;
  size?: number | string;
  "aria-hidden"?: boolean | "true" | "false";
}>;

/*
 * Sport-specific glyphs Phosphor does not ship (scoreboard, whistle,
 * shuttlecock, padel racket). Drawn on Phosphor's 256 grid with its stroke
 * widths so they sit next to library icons without looking foreign, and they
 * accept the same `size` / `weight` / `className` props.
 */

type SportIconProps = Omit<SVGProps<SVGSVGElement>, "ref"> & {
  size?: number | string;
  weight?: IconWeight;
};

const strokeByWeight: Record<IconWeight, number> = {
  thin: 8,
  light: 12,
  regular: 16,
  bold: 24,
  fill: 16,
  duotone: 16,
};

function createSportIcon(
  displayName: string,
  draw: (tone: { duo: boolean }) => ReactNode,
) {
  function SportIcon({
    size = "1em",
    weight = "regular",
    ...rest
  }: SportIconProps) {
    const duo = weight === "duotone" || weight === "fill";
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        viewBox="0 0 256 256"
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeByWeight[weight]}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        {...rest}
      >
        {draw({ duo })}
      </svg>
    );
  }
  SportIcon.displayName = displayName;
  return SportIcon;
}

export const ScoreboardIcon = createSportIcon("ScoreboardIcon", ({ duo }) => (
  <>
    {duo && (
      <rect
        x="24"
        y="48"
        width="208"
        height="136"
        rx="16"
        fill="currentColor"
        stroke="none"
        opacity="0.2"
      />
    )}
    <rect x="24" y="48" width="208" height="136" rx="16" />
    <rect x="52" y="84" width="52" height="68" rx="10" />
    <rect x="152" y="84" width="52" height="68" rx="10" />
    <line x1="128" y1="104" x2="128" y2="104.5" strokeWidth="20" />
    <line x1="128" y1="132" x2="128" y2="132.5" strokeWidth="20" />
    <line x1="80" y1="184" x2="80" y2="216" />
    <line x1="176" y1="184" x2="176" y2="216" />
  </>
));

export const WhistleIcon = createSportIcon("WhistleIcon", ({ duo }) => (
  <>
    {duo && (
      <path
        d="M96,96H224v32l-72,16a56,56,0,1,1-56-48Z"
        fill="currentColor"
        stroke="none"
        opacity="0.2"
      />
    )}
    <path d="M96,96H224v32l-72,16a56,56,0,1,1-56-48Z" />
    <circle cx="96" cy="152" r="20" />
    <line x1="152" y1="96" x2="152" y2="72" />
    <path d="M72,100,48,64" />
    <circle cx="40" cy="52" r="14" />
  </>
));

export const ShuttlecockIcon = createSportIcon("ShuttlecockIcon", ({ duo }) => (
  <g transform="rotate(-32 128 128)">
    {duo && (
      <path
        d="M100,172,56,48Q128,26,200,48L156,172Z"
        fill="currentColor"
        stroke="none"
        opacity="0.2"
      />
    )}
    <path d="M100,172,56,48Q128,26,200,48L156,172" />
    <path d="M98,172h60v10a30,30,0,0,1-60,0Z" />
    <line x1="84" y1="126" x2="172" y2="126" />
    <line x1="115" y1="172" x2="100" y2="40" />
    <line x1="141" y1="172" x2="156" y2="40" />
  </g>
));

export const PadelRacketIcon = createSportIcon("PadelRacketIcon", ({ duo }) => (
  <g transform="rotate(40 128 128)">
    {duo && (
      <path
        d="M128,18c46,0,78,32,78,78,0,38-24,62-54,72l-6,16H110l-6-16C74,158,50,134,50,96,50,50,82,18,128,18Z"
        fill="currentColor"
        stroke="none"
        opacity="0.2"
      />
    )}
    <path d="M128,18c46,0,78,32,78,78,0,38-24,62-54,72l-6,16H110l-6-16C74,158,50,134,50,96,50,50,82,18,128,18Z" />
    <path d="M112,184h32v44a10,10,0,0,1-10,10H122a10,10,0,0,1-10-10Z" />
    <g stroke="none" fill="currentColor">
      <circle cx="104" cy="70" r="9" />
      <circle cx="152" cy="70" r="9" />
      <circle cx="128" cy="96" r="9" />
      <circle cx="100" cy="118" r="9" />
      <circle cx="156" cy="118" r="9" />
      <circle cx="128" cy="140" r="9" />
    </g>
  </g>
));
