"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import Modal from "@/components/ui/Modal";

/** The gated write-up links here with this marker so the résumé knows why you came. */
const FROM_GATE = "interview";

const EMAIL = "psumido@gmail.com";
const MAILTO = `mailto:${EMAIL}?subject=Interview%20%E2%80%94%20visual-plan%20write-up`;

/**
 * Greets anyone who lands on the résumé from the "interview me first" gate on a
 * write-up. The gate deliberately doesn't hand over a mailto -- it sends people
 * here instead, so they see the actual work before they see the address. This
 * explains why they were bounced and where the email is, then gets out of the
 * way. Dismissing it is local state, so it doesn't rewrite the URL and break the
 * back button.
 */
export default function InterviewNotice() {
  const cameFromGate = useSearchParams().get("from") === FROM_GATE;
  const [dismissed, setDismissed] = useState(false);

  return (
    <Modal
      open={cameFromGate && !dismissed}
      onClose={() => setDismissed(true)}
      aria-labelledby="interview-notice-title"
      aria-describedby="interview-notice-body"
    >
      <h2
        id="interview-notice-title"
        className="text-lg font-bold text-foreground"
      >
        Here&rsquo;s the résumé — the email&rsquo;s on it
      </h2>
      <div
        id="interview-notice-body"
        className="mt-2 space-y-3 text-[15px] leading-relaxed text-muted"
      >
        <p>
          You clicked through from a write-up I keep half-locked. Rather than
          hand you an address and hope for the best, I&rsquo;d rather you see the
          work first. It&rsquo;s all below, and my email is right there on it.
        </p>
        <p>
          Use it. Tell me what you&rsquo;re building and I&rsquo;ll tell you
          honestly whether I&rsquo;m the right fit — and I&rsquo;ll open up the
          rest of that write-up while I&rsquo;m at it.
        </p>
      </div>
      <div className="mt-5 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => setDismissed(true)}
          className="inline-flex items-center justify-center rounded-lg bg-foreground px-4 py-2 text-sm font-semibold text-background transition-opacity hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          Got it, let me read
        </button>
        <a
          href={MAILTO}
          className="text-sm font-medium text-foreground underline underline-offset-4 transition-opacity hover:opacity-80"
        >
          {EMAIL}
        </a>
      </div>
    </Modal>
  );
}
