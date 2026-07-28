import type { Metadata } from "next";
import PageHeader from "@/components/PageHeader";
import { SITE_URL, OG_IMAGE } from "@/lib/site";

// Files live in /public/resume, so they are served statically at these paths.
const PDF_HREF = "/resume/Resume-Developer-Sumido.pdf";
const DOCX_HREF = "/resume/Resume-Developer-Sumido.docx";

const TITLE = "Résumé";
const DESCRIPTION =
  "Paul Sumido's résumé — experience, skills, and the projects behind this site.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  openGraph: {
    type: "website",
    url: `${SITE_URL}/resume`,
    title: TITLE,
    description: DESCRIPTION,
    images: [OG_IMAGE],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: [OG_IMAGE.url],
  },
};

// Static page — the résumé changes rarely, so cache it at the CDN for a day.
export const revalidate = 86400;

/** A compact pill download link for the header — icon plus a short label so it
 * stays on one line and doesn't balloon the fixed-height bar on narrow screens. */
function DownloadLink({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      download
      className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border border-border bg-surface/70 px-3 py-1.5 text-sm font-medium text-muted transition-colors hover:text-foreground"
    >
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden
        className="shrink-0"
      >
        <path
          d="M12 3v11m0 0 4-4m-4 4-4-4M5 20h14"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      {label}
    </a>
  );
}

/**
 * Public résumé page: embeds the PDF inline with download links to the PDF and
 * Word versions. Not auth-gated — a résumé is meant to be shared.
 */
export default function ResumePage() {
  return (
    <div className="min-h-dvh bg-background">
      <PageHeader
        breadcrumbs={[{ label: "Dashboard", href: "/" }, { label: "Résumé" }]}
      />

      <main className="mx-auto max-w-5xl px-4 py-6 sm:py-8">
        <div className="mb-5">
          <h1 className="text-xl font-bold text-foreground sm:text-2xl">Résumé</h1>
          <p className="mt-1 text-[13px] text-muted">
            Experience, skills, and the projects behind this site. Prefer a file?
            Grab a copy below.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <DownloadLink href={PDF_HREF} label="Download PDF" />
            <DownloadLink href={DOCX_HREF} label="Download Word" />
          </div>
        </div>

        {/* Inline PDF viewer. Some browsers (notably mobile Safari) render a
            blank iframe for PDFs, so a direct link sits just below it. */}
        <iframe
          title="Résumé PDF"
          src={PDF_HREF}
          className="h-[calc(100dvh-14rem)] min-h-[540px] w-full rounded-xl border border-border bg-surface"
        />
        <p className="mt-2 text-center text-[13px] text-muted">
          Can&apos;t see it?{" "}
          <a
            href={PDF_HREF}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-foreground underline underline-offset-2"
          >
            Open the PDF in a new tab
          </a>
          .
        </p>
      </main>
    </div>
  );
}
