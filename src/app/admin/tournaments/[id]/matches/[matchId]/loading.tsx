export default function LoadingMatchScoring() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#06163b] px-6 text-white">
      <div className="text-center">
        <span className="material-symbols-outlined admin-spin text-5xl text-blue-400">
          progress_activity
        </span>
        <p className="mt-4 text-sm font-extrabold uppercase tracking-[0.2em] text-blue-200">
          Opening scoring room
        </p>
      </div>
    </div>
  );
}
