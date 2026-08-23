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
    <div className="mx-auto mb-12 w-full max-w-4xl overflow-x-auto pb-2">
      <div className="relative flex items-center justify-between">
        <div className="absolute left-0 top-5 z-0 h-1 w-full -translate-y-1/2 bg-[#07142f]" />
        <div
          className="absolute left-0 top-5 z-0 h-1 -translate-y-1/2 bg-cyan-300 transition-all duration-500"
          style={{ width: `${(current / (labels.length - 1)) * 100}%` }}
        />

        {labels.map((label, i) => {
          const done = i < current;
          const active = i === current;

          return (
            <div
              key={label}
              className="relative z-10 flex min-w-20 flex-col items-center gap-3"
            >
              <div
                className={`flex h-10 w-10 items-center justify-center border-2 border-[#07142f] text-sm font-black shadow-[3px_3px_0_#07142f] transition-all ${
                  active || done
                    ? "bg-blue-600 text-white"
                    : "bg-white text-slate-500"
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
                className={`text-center text-xs font-black uppercase ${
                  active || done ? "text-blue-700" : "text-slate-500"
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
