import AdminTournamentList from "@/components/admin/AdminTournamentList";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";

export default function AdminIndexPage() {
  return (
    <>
      <Navbar active="admin" />

      <main className="min-h-screen bg-[#f6f8fc] pt-16">
        <section className="relative overflow-hidden border-b border-blue-900/10 bg-[#071c4d] text-white">
          <div className="admin-orb absolute -right-24 -top-40 h-96 w-96 rounded-full bg-blue-500/25 blur-3xl" />
          <div className="admin-orb admin-orb-delay absolute -bottom-56 left-1/3 h-96 w-96 rounded-full bg-cyan-400/15 blur-3xl" />
          <div className="relative mx-auto max-w-[1400px] px-6 py-14 md:px-10 md:py-16">
            <span className="inline-flex rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-extrabold uppercase tracking-[0.18em] text-blue-100 backdrop-blur">
              Tournament administration
            </span>
            <h1 className="mt-5 max-w-3xl text-3xl font-black tracking-[-0.035em] md:text-5xl">
              Every tournament, one clear command center.
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-blue-100/70 md:text-base">
              Configure teams, build the draw, coordinate courts, open focused
              scoring tabs, and follow results without switching between
              disconnected tools.
            </p>
          </div>
        </section>

        <AdminTournamentList />
      </main>
      <Footer />
    </>
  );
}
