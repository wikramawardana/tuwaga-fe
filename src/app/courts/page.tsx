import Link from "next/link";
import Navbar from "@/components/Navbar";

export default function CourtsPage() {
	return (
		<>
			<Navbar />
			<main className="pt-24 min-h-[calc(100vh-200px)] flex flex-col items-center justify-center bg-surface-container-lowest px-4">
				<h1 className="text-4xl font-bold text-primary mb-4">Courts</h1>
				<p className="text-on-surface-variant mb-8 text-center max-w-lg text-lg">
					Find and book padel courts near you. Check availability, compare
					prices, and secure your spot instantly.
				</p>
				<Link
					href="/"
					className="bg-primary text-on-primary px-8 py-3 rounded-xl font-medium hover:brightness-110 transition-all shadow-lg"
				>
					Back to Home
				</Link>
			</main>
		</>
	);
}
