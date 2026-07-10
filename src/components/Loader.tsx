"use client";

import { useEffect, useState } from "react";

export default function Loader() {
	const [loading, setLoading] = useState(true);
	const [fading, setFading] = useState(false);

	useEffect(() => {
		// Wait for fonts to be ready before showing the page
		document.fonts.ready.then(() => {
			// Small artificial delay to ensure smooth rendering
			setTimeout(() => {
				setFading(true);
				// Wait for the fade-out animation to finish before unmounting
				setTimeout(() => setLoading(false), 300);
			}, 100);
		});
	}, []);

	if (!loading) return null;

	return (
		<div
			className={`fixed inset-0 z-[10000] flex flex-col items-center justify-center bg-surface-bright transition-opacity duration-300 ${
				fading ? "opacity-0 pointer-events-none" : "opacity-100"
			}`}
		>
			<div className="flex flex-col items-center gap-6">
				<span className="text-[32px] font-bold leading-[1.4] text-primary animate-pulse">
					TUWAGA
				</span>
				{/* Simple elegant spinner matching the theme */}
				<div className="w-10 h-10 border-4 border-surface-container-highest border-t-primary rounded-full animate-spin"></div>
			</div>
		</div>
	);
}
