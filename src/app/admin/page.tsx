import AdminTournamentList from "@/components/admin/AdminTournamentList";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";

export default function AdminIndexPage() {
	return (
		<>
			<Navbar active="admin" />

			<main className="min-h-screen bg-background pt-16">
				<section className="border-b border-outline-variant/20 bg-white">
					<div className="mx-auto max-w-[1200px] px-6 py-10 md:px-10">
						<p className="text-xs font-bold uppercase tracking-widest text-primary">
							Admin
						</p>
						<h1 className="mt-2 text-3xl font-extrabold tracking-tight text-on-surface md:text-4xl">
							Select tournament control room
						</h1>
						<p className="mt-3 max-w-2xl text-sm leading-relaxed text-on-surface-variant md:text-base">
							Each tournament has its own registrations, draw setup, match
							drawer, court allocation, and configuration.
						</p>
					</div>
				</section>

				<AdminTournamentList />
			</main>
			<Footer />
		</>
	);
}
