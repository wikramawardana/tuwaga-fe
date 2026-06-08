import Navbar from "@/components/Navbar";
import Link from "next/link";

export default function DashboardPage() {
  return (
    <>
      <Navbar />
      <main className="pt-24 min-h-[calc(100vh-200px)] flex flex-col items-center justify-center bg-surface-container-lowest px-4">
        <h1 className="text-4xl font-bold text-primary mb-4">Dashboard</h1>
        <p className="text-on-surface-variant mb-8 text-center max-w-lg text-lg">
          Welcome to your player dashboard. Here you will be able to track your statistics, upcoming matches, and performance.
        </p>
        <Link href="/" className="bg-primary text-on-primary px-8 py-3 rounded-xl font-medium hover:brightness-110 transition-all shadow-lg">
          Back to Home
        </Link>
      </main>
    </>
  );
}
