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

/** A small pill link, used for the download actions in the header. */
function DownloadLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      download
      className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface/70 px-3 py-1.5 text-sm font-medium text-muted transition-colors hover:text-foreground"
    >
      {children}
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
        showLogout={false}
        right={
          <div className="flex items-center gap-2">
            <DownloadLink href={PDF_HREF}>Download PDF</DownloadLink>
            <DownloadLink href={DOCX_HREF}>Word</DownloadLink>
          </div>
        }
      />

      <main className="mx-auto max-w-5xl px-4 py-6 sm:py-8">
        <div className="mb-5">
          <h1 className="text-xl font-bold text-foreground sm:text-2xl">Résumé</h1>
          <p className="mt-1 text-[13px] text-muted">
            Experience, skills, and the projects behind this site. Prefer a file?
            Grab the PDF or Word version above.
          </p>
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
