"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export default function PageTransition({
	children,
}: {
	children: React.ReactNode;
}) {
	const pathname = usePathname();
	const [isAnimating, setIsAnimating] = useState(false);

	useEffect(() => {
		if (!pathname) return;

		setIsAnimating(true);
		const timeout = window.setTimeout(() => setIsAnimating(false), 520);

		return () => window.clearTimeout(timeout);
	}, [pathname]);

	return (
		<>
			<div
				aria-hidden="true"
				className={`route-transition-bar ${isAnimating ? "is-active" : ""}`}
			/>
			<div key={pathname} className="page-transition">
				{children}
			</div>
		</>
	);
}
