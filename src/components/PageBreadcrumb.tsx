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
        className="text-on-surface-variant transition-colors hover:text-primary"
      >
        {parentLabel}
      </Link>
      <span className="text-outline">/</span>
      <span className="text-primary">{current}</span>
    </nav>
  );
}
