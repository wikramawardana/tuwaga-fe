import { CircleNotchIcon } from "@phosphor-icons/react/dist/ssr";

export default function LoadingMatchScoring() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-ink-950 px-6 text-white">
      <div className="text-center">
        <CircleNotchIcon
          className="admin-spin text-5xl text-brand-400"
          aria-hidden="true"
          weight="duotone"
        />
        <p className="mt-4 text-sm font-extrabold uppercase tracking-[0.2em] text-cream-200">
          Opening scoring room
        </p>
      </div>
    </div>
  );
}
