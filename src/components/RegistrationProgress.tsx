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
    <div className="mx-auto mb-12 w-full max-w-3xl">
      <div className="relative flex items-center justify-between">
        <div className="absolute left-0 top-5 z-0 h-0.5 w-full -translate-y-1/2 bg-surface-container-highest" />
        <div
          className="absolute left-0 top-5 z-0 h-0.5 -translate-y-1/2 bg-primary transition-all duration-500"
          style={{ width: `${(current / (labels.length - 1)) * 100}%` }}
        />

        {labels.map((label, i) => {
          const done = i < current;
          const active = i === current;

          return (
            <div
              key={label}
              className="relative z-10 flex flex-col items-center gap-3"
            >
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold shadow-sm transition-all ${
                  active || done
                    ? "bg-primary text-on-primary"
                    : "bg-surface-container-highest text-on-surface-variant"
                }`}
              >
                {done ? (
                  <span className="material-symbols-outlined text-[18px]">
                    check
                  </span>
                ) : (
                  i + 1
                )}
              </div>
              <span
                className={`text-sm font-semibold ${
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
