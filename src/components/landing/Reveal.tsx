"use client";

import { type ReactNode, useEffect, useRef } from "react";

/**
 * Fades its children up when they scroll into view. Content that is already
 * on screen at mount (or when the user prefers reduced motion) is never
 * hidden, so there is no flash and no-JS rendering stays intact.
 */
export default function Reveal({
  children,
  className = "",
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (reduceMotion || el.getBoundingClientRect().top < window.innerHeight) {
      return;
    }

    el.classList.add("reveal-pending");
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        el.style.transitionDelay = `${delay}ms`;
        el.classList.remove("reveal-pending");
        el.classList.add("reveal-in");
        observer.disconnect();
      },
      { threshold: 0.12 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [delay]);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
