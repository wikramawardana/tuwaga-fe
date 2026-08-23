import Image from "next/image";
import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t-4 border-[#07142f] bg-[#071c4d] py-8 text-white">
      <div className="mx-auto max-w-[1400px] px-6 md:px-10">
        <div className="flex flex-col items-center justify-between gap-5 md:flex-row">
          <Link
            href="/"
            className="inline-flex items-center border-2 border-[#07142f] bg-white px-4 py-2 shadow-[4px_4px_0_#55dfff]"
          >
            <Image
              src="/tuwaga-logo.png"
              alt="TUWAGA"
              width={104}
              height={28}
            />
          </Link>
          <div className="text-center md:text-right">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-cyan-300">
              Play · Score · Repeat
            </p>
            <p className="mt-1 text-xs font-semibold text-blue-100/75">
              © 2026 TUWAGA. Live tournament action for Indonesia.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
