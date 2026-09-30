import { CheckIcon } from "@phosphor-icons/react/dist/ssr";

export default function RegistrationProgress({
  steps,
  current,
}: {
  steps?: string[];
  current: number;
}) {
  const labels = steps ?? [
    "Category",
    "Player",
    "Partner",
    "Qualification",
    "Review",
  ];

  return (
    <div className="mx-auto mb-10 w-full max-w-4xl overflow-x-auto pb-2">
      <div className="relative flex items-center justify-between">
        <div className="absolute left-0 top-4 z-0 h-[2px] w-full -translate-y-1/2 bg-ink-300/30" />
        <div
          className="absolute left-0 top-4 z-0 h-[2px] -translate-y-1/2 bg-brand-500 transition-all duration-500"
          style={{ width: `${(current / (labels.length - 1)) * 100}%` }}
        />

        {labels.map((label, i) => {
          const done = i < current;
          const active = i === current;

          return (
            <div
              key={label}
              className="relative z-10 flex min-w-20 flex-col items-center gap-2"
            >
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full border text-xs font-bold transition-all ${
                  done
                    ? "border-brand-500 bg-brand-500 text-ink-950"
                    : active
                      ? "border-brand-500 bg-white text-brand-600 ring-4 ring-brand-500/15"
                      : "border-ink-300 bg-white text-ink-500"
                }`}
              >
                {done ? (
                  <CheckIcon
                    className="text-[16px]"
                    aria-hidden="true"
                    weight="bold"
                  />
                ) : (
                  i + 1
                )}
              </div>
              <span
                className={`eyebrow text-center text-[10px] ${
                  active || done ? "text-ink-950" : "text-ink-400"
                }`}
              >
                {label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
