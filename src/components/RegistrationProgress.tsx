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
        <div className="absolute left-0 top-4 z-0 h-[2px] w-full -translate-y-1/2 bg-[#e6e3da]" />
        <div
          className="absolute left-0 top-4 z-0 h-[2px] -translate-y-1/2 bg-[#0c0d11] transition-all duration-500"
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
                    ? "border-[#0c0d11] bg-[#0c0d11] text-[#f5eedb]"
                    : active
                      ? "border-[#0c0d11] bg-white text-[#0c0d11] ring-4 ring-[#f5eedb]"
                      : "border-[#e6e3da] bg-white text-slate-400"
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
                className={`text-center text-[11px] font-semibold uppercase tracking-wider ${
                  active || done ? "text-[#0c0d11]" : "text-slate-400"
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
