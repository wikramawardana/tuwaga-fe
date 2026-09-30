import Link from "next/link";

type PageBreadcrumbProps = {
  parentLabel?: string;
  parentHref?: string;
  current: string;
};

export default function PageBreadcrumb({
  parentLabel = "Tournaments",
  parentHref = "/tournaments",
  current,
}: PageBreadcrumbProps) {
  return (
    <nav
      aria-label="Breadcrumb"
      className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-widest"
    >
      <Link
        href={parentHref}
        className="text-ink-600 transition-colors hover:text-brand-600"
      >
        {parentLabel}
      </Link>
      <span className="text-ink-500">/</span>
      <span className="text-brand-600">{current}</span>
    </nav>
  );
}
