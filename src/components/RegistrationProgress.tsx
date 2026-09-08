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
        <div className="absolute left-0 top-4 z-0 h-[2px] w-full -translate-y-1/2 bg-outline-variant/30" />
        <div
          className="absolute left-0 top-4 z-0 h-[2px] -translate-y-1/2 bg-primary transition-all duration-500"
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
                    ? "border-primary bg-primary text-on-primary"
                    : active
                      ? "border-primary bg-white text-primary ring-4 ring-primary/15"
                      : "border-outline-variant/40 bg-white text-on-surface-variant"
                }`}
              >
                {done ? (
                  <span className="material-symbols-outlined text-[16px]">
                    check
                  </span>
                ) : (
                  i + 1
                )}
              </div>
              <span
                className={`text-center text-[11px] font-bold uppercase tracking-wider ${
                  active || done ? "text-primary" : "text-on-surface-variant"
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
