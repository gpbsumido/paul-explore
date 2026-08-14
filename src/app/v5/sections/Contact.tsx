"use client";

import MagneticButton from "@/components/motion/MagneticButton";
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
  { label: "Resume as PDF", href: "/resume/Resume-Developer-Sumido.pdf" },
  { label: "Resume as Word", href: "/resume/Resume-Developer-Sumido.docx" },
  { label: "github.com/gpbsumido", href: "https://github.com/gpbsumido" },
];

export default function Contact() {
  return (
    <section id="contact" className={`${BAND} border-t border-border`}>
      <div className={SHELL}>
        <div className="max-w-2xl">
          <TextReveal
            as="h2"
            className="font-display text-3xl font-semibold tracking-tight sm:text-4xl"
          >
            If you are hiring a frontend lead
          </TextReveal>
          <p className="mt-5 text-lg leading-relaxed text-muted">
            The resume is one page and the evidence for all of it is on this
            domain. If the fit looks right, the fastest next step is an email.
          </p>
        </div>

        <div className="mt-9">
          <MagneticButton strength={0.3}>
            <a
              href="mailto:psumido@gmail.com"
              className="inline-flex h-12 items-center rounded-full bg-primary-600 px-7 font-medium text-white transition-colors hover:bg-primary-700 focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-none active:translate-y-px"
            >
              Email me
            </a>
          </MagneticButton>
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
      </div>
    </section>
  );
}
