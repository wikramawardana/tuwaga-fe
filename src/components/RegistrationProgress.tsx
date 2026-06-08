const steps = ["Profile", "Skill Level", "Partner Info", "Payment"];

export default function RegistrationProgress({ current }: { current: number }) {
  return (
    <div className="w-full max-w-3xl mx-auto mb-12">
      <div className="flex items-center justify-between relative">
        <div className="absolute top-5 left-0 w-full h-0.5 bg-surface-container-highest -translate-y-1/2 z-0" />
        <div
          className="absolute top-5 left-0 h-0.5 bg-primary -translate-y-1/2 z-0 transition-all duration-500"
          style={{ width: `${(current / (steps.length - 1)) * 100}%` }}
        />

        {steps.map((label, i) => {
          const done = i < current;
          const active = i === current;

          return (
            <div
              key={label}
              className="relative z-10 flex flex-col items-center gap-3"
            >
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shadow-sm transition-all ${
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
