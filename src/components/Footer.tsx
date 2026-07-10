import Image from "next/image";
import Link from "next/link";

export default function Footer() {
	return (
		<footer className="bg-white border-t border-outline-variant/20 py-6">
			<div className="max-w-[1200px] mx-auto px-6 md:px-10">
				<div className="flex flex-col md:flex-row items-center justify-between gap-2">
					<Link href="/" className="inline-flex items-center">
						<Image
							src="/tuwaga-logo.png"
							alt="TUWAGA"
							width={104}
							height={28}
							className="h-7 w-auto"
						/>
					</Link>
					<p className="text-center md:text-right text-xs font-semibold text-on-surface-variant">
						© 2026 TUWAGA. Live scoring and tournament operations for Indonesia.
					</p>
				</div>
			</div>
		</footer>
	);
}
