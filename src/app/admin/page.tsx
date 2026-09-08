import AdminTournamentList from "@/components/admin/AdminTournamentList";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";

export default function AdminIndexPage() {
  return (
    <>
      <Navbar active="admin" />

      <main className="min-h-screen bg-[#FAF9F6] pt-16">
        <section className="relative overflow-hidden border-b border-[#E6E3DA] bg-[#0C0D11] text-white">
          <div className="relative mx-auto max-w-[1400px] px-6 py-14 md:px-10 md:py-16">
            <span className="inline-flex items-center rounded-full border border-white/20 bg-white/10 px-3.5 py-1 text-xs font-semibold uppercase tracking-wider text-[#F5EEDB] backdrop-blur-xs">
              Tournament administration
            </span>
            <h1 className="mt-5 max-w-3xl text-3xl font-bold tracking-tight text-white md:text-5xl">
              Every tournament, one clear command center.
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-neutral-300 md:text-base">
              Configure teams, build the draw, coordinate courts, open focused
              scoring tabs, and follow results without switching between
              disconnected tools.
            </p>
          </div>
        </section>

        <AdminTournamentList />
      </main>
      <Footer showAdminPortal={false} />
    </>
  );
}
