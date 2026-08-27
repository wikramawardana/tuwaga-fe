import AdminTournamentList from "@/components/admin/AdminTournamentList";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";

export default function AdminIndexPage() {
  return (
    <>
      <Navbar active="admin" />

      <main className="neo-admin min-h-screen pt-16">
        <section className="neo-hero">
          <div className="relative mx-auto max-w-[1400px] px-6 py-14 md:px-10 md:py-16">
            <span className="neo-sticker -rotate-1">
              Admin operations · Control 01
            </span>
            <h1 className="neo-title mt-6 max-w-4xl text-4xl font-black md:text-6xl">
              One loud, clear tournament command center.
            </h1>
            <p className="mt-5 max-w-2xl border-l-4 border-cyan-300 pl-4 text-sm font-semibold leading-7 text-white md:text-base">
              Configure teams, build the draw, coordinate courts, open focused
              scoring tabs, and follow results without switching between
              disconnected tools.
            </p>
          </div>
        </section>

        <div className="neo-ticker" aria-hidden="true">
          <div className="neo-ticker-track">
            <span>
              Draw control • Court assignments • Live scoring • Results desk •
            </span>
            <span>
              Draw control • Court assignments • Live scoring • Results desk •
            </span>
          </div>
        </div>

        <AdminTournamentList />
      </main>
      <Footer showAdminPortal={false} />
    </>
  );
}
