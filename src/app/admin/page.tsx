import AdminTournamentList from "@/components/admin/AdminTournamentList";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";

export default function AdminIndexPage() {
  return (
    <div className="flex min-h-screen flex-col bg-canvas">
      <Navbar active="admin" />

      <main className="flex-1 pt-16">
        <section className="border-b border-ink-200 bg-white">
          <div className="container-wide relative py-10 md:py-12">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-brand-200 bg-brand-50 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-brand-600">
              <span className="h-1.5 w-1.5 rounded-full bg-brand-500" />
              Tournament administration
            </span>
            <h1 className="mt-4 max-w-3xl text-3xl font-extrabold tracking-tight text-ink-900 md:text-4xl">
              Every tournament, one clear command center.
            </h1>
            <p className="mt-2.5 max-w-2xl text-sm leading-relaxed text-ink-600 md:text-base">
              Configure teams, build the draw, coordinate courts, open focused
              scoring tabs, and follow results without switching between
              disconnected tools.
            </p>
          </div>
        </section>

        <AdminTournamentList />
      </main>

      <Footer />
    </div>
  );
}
