import BlobBackground from "@/components/motion/BlobBackground";
import MagneticButton from "@/components/motion/MagneticButton";
import SpotlightCard from "@/components/motion/SpotlightCard";
import TextReveal from "@/components/motion/TextReveal";
import { SHELL, BAND } from "../shell";

/**
 * Every way to act on the page, and nothing invented.
 *
 * There is no LinkedIn link here because no verified URL for one exists
 * anywhere in this project, and a profile link that 404s on the one page meant
 * to close the loop is worse than its absence.
 */
const REACH = [
  { label: "GitHub", href: "https://github.com/gpbsumido" },
  { label: "NPM Packages", href: "https://www.npmjs.com/~psumido" },
  { label: "Resume as PDF", href: "/resume/Resume-Developer-Sumido.pdf" },
  { label: "Resume as Word", href: "/resume/Resume-Developer-Sumido.docx" },
];

/**
 * The closing call to action. v6 sets its background to drifting blobs instead
 * of the cursor spotlight, and drops the card border, so pass variant="blob".
 */
export default function Contact({
  variant = "spotlight",
}: {
  variant?: "spotlight" | "blob";
}) {
  const body = (
    <>
      <div className="max-w-2xl">
        <TextReveal
          as="h2"
          className="font-display text-3xl font-semibold tracking-tight sm:text-4xl"
        >
          If you are hiring a frontend dev
        </TextReveal>
        <p className="mt-5 text-lg leading-relaxed text-muted">
          The resume is one page and the evidence for all of it is on this
          domain. If the fit looks right, the fastest next step is an email.
        </p>
      </div>

      <div className="mt-9 flex flex-wrap items-center gap-4">
        <MagneticButton strength={0.3}>
          <a
            href="mailto:psumido@gmail.com"
            className="inline-flex h-12 items-center rounded-full bg-primary-600 px-7 font-medium text-white transition-colors hover:bg-primary-700 focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-none active:translate-y-px"
          >
            Email me
          </a>
        </MagneticButton>
        <a
          href="https://calendly.com/psumido/30min"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex h-12 items-center rounded-full border border-border px-7 font-medium text-foreground transition-colors hover:bg-surface focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-none"
        >
          Book a 30-min call
        </a>
      </div>

      <ul className="mt-10 flex flex-wrap gap-x-8 gap-y-3 text-sm">
        {REACH.map((item) => (
          <li key={item.href}>
            <a
              href={item.href}
              className="text-muted underline underline-offset-4 transition-colors hover:text-foreground"
            >
              {item.label}
            </a>
          </li>
        ))}
      </ul>
    </>
  );

  return (
    <section
      id="contact"
      className={`${BAND} relative overflow-hidden border-t border-border`}
    >
      {/* Blob variant: the drifting-blob background bleeds to the full section
          width instead of sitting in a boxed card, and only the copy stays in
          the SHELL frame. */}
      {variant === "blob" ? (
        <>
          <BlobBackground
            seeds={[3, 7]}
            colors={[
              "light-dark(var(--color-primary-600), var(--color-primary-400))",
              "light-dark(var(--color-secondary-600), var(--color-secondary-400))",
            ]}
            parallax={40}
          />
          {/* Scrim so the drifting blobs never eat the copy's contrast. */}
          <div
            aria-hidden="true"
            className="absolute inset-0"
            style={{
              background:
                "color-mix(in srgb, var(--color-background) 42%, transparent)",
            }}
          />
        </>
      ) : null}
      <div className={`${SHELL} relative`}>
        {variant === "blob" ? (
          body
        ) : (
          <SpotlightCard
            accent="var(--color-secondary-500)"
            className="p-8 sm:p-12"
          >
            {body}
          </SpotlightCard>
        )}
      </div>
    </section>
  );
}
