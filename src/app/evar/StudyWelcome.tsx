"use client";

import Modal from "@/components/ui/Modal";
import type { Participant } from "@/lib/evar/research";
import { JoinForm } from "./ResearchPanel";

const button =
  "paul-touch-min inline-flex items-center rounded-lg border border-border bg-surface px-4 py-2 text-[14px] text-foreground transition-colors hover:bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/40";

/**
 * The first thing a new visitor sees: an invitation to the research study,
 * before the tour and before any practice, so the choice is made up front
 * rather than found at the bottom of the page afterwards. Signed in, it's the
 * consent form itself. Signed out, it's sign in or carry on.
 */
export default function StudyWelcome({
  open,
  signedIn,
  onJoined,
  onDecline,
}: {
  open: boolean;
  signedIn: boolean;
  onJoined: (participant: Participant) => void;
  onDecline: () => void;
}) {
  return (
    <Modal open={open} onClose={onDecline} aria-labelledby="evar-study-welcome-heading" className="w-full max-w-2xl">
      <Modal.Header>
        <h2 id="evar-study-welcome-heading" className="text-lg font-bold text-foreground">
          Before you start: a research study
        </h2>
      </Modal.Header>
      <Modal.Body>
        <p className="text-[14px] leading-relaxed text-foreground">
          This practice is also a study of how EVAR sizing skill develops over training. Joining is
          optional, practice works exactly the same without it, and you can withdraw at any time from
          the bottom of the page.
        </p>
        {signedIn ? (
          <div className="mt-4">
            <JoinForm onJoined={onJoined} />
          </div>
        ) : (
          <p className="mt-3 text-[14px] leading-relaxed text-muted">
            Joining needs an account, so your attempts can be kept under a random participant id.
            Practising doesn&apos;t.
          </p>
        )}
      </Modal.Body>
      <Modal.Footer>
        <div className="flex flex-wrap justify-end gap-2">
          {signedIn ? null : (
            <a href="/auth/login?returnTo=%2Fevar" className={`${button} border-foreground font-semibold`}>
              Sign in to join
            </a>
          )}
          <button type="button" className={button} onClick={onDecline}>
            {signedIn ? "Not now, just practise" : "Practise without joining"}
          </button>
        </div>
      </Modal.Footer>
    </Modal>
  );
}
