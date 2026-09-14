import Link from "next/link";

/**
 * A breadcrumb back to the ZeroProof lobby, for the admin panels — which
 * otherwise render bare, with no header and no way out. Rendered inside each
 * admin content component (all admin-gated), so it never appears around the
 * 404 a non-admin is shown.
 */
export default function AdminBackLink({ current }: { current: string }) {
  return (
    <nav
      aria-label="Breadcrumb"
      className="mb-5 flex items-center gap-2 text-sm text-muted"
    >
      <Link
        href="/zeroproof"
        className="inline-flex items-center gap-1 rounded transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:outline-none"
      >
        <span aria-hidden="true">←</span> ZeroProof
      </Link>
      <span aria-hidden="true">/</span>
      <span className="text-foreground">{current}</span>
    </nav>
  );
}
