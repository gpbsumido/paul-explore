"use client";

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, m } from "framer-motion";
import { useHubReducedMotion } from "@/app/providers";
import { spring, project } from "@/lib/animations";

/** Projected travel (px) past which a downward flick lets the sheet go. */
const DISMISS_DISTANCE = 120;

export interface SheetProps {
  /** Whether the sheet is open. */
  open: boolean;
  /** Called when the sheet should close (backdrop, Escape, or a flick down). */
  onClose: () => void;
  /** Accessible name for the dialog. */
  label: string;
  children: React.ReactNode;
}

/**
 * A bottom sheet you can throw away. It slides up from the bottom, pairs with a
 * dimming scrim, and can be dragged or flicked down to dismiss — the dismiss
 * decision uses momentum projection (where the flick would come to rest), not
 * just how far it travelled, so a quick flick closes it even if it barely
 * moved. If the throw isn't enough, the elastic constraint springs it back.
 *
 * Under reduced motion it drops the slide and drag for a plain fade. Mirrors
 * the shared Modal's scroll-lock, focus handling, and Escape-to-close.
 */
export default function Sheet({ open, onClose, label, children }: SheetProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const reduced = useHubReducedMotion();

  // The latest onClose, kept in a ref so it isn't an effect dependency. Callers
  // pass a fresh onClose every render, and when it was in the deps the effect
  // re-ran on every keystroke and re-focused the panel — which on mobile
  // dismissed the keyboard the moment you typed into a field inside the sheet.
  // The ref is synced in its own effect (not during render) to match Modal.
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const prevFocus = document.activeElement as HTMLElement | null;
    panelRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCloseRef.current();
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      document.removeEventListener("keydown", onKey);
      prevFocus?.focus?.();
    };
  }, [open]);

  if (typeof document === "undefined") return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <m.div
          data-testid="sheet-backdrop"
          className="fixed inset-0 flex items-end justify-center"
          style={{
            zIndex: "var(--z-modal)",
            background: "var(--modal-backdrop)",
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduced ? 0 : 0.2 }}
          onClick={(e) => {
            if (e.target === e.currentTarget) onClose();
          }}
        >
          <m.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label={label}
            tabIndex={-1}
            className="max-h-[90dvh] w-full max-w-lg overflow-y-auto overscroll-contain rounded-t-2xl border border-border p-6 pb-[max(2rem,env(safe-area-inset-bottom))] focus:outline-none"
            style={{
              background: "var(--modal-bg)",
              backdropFilter: "blur(var(--blur-modal))",
              WebkitBackdropFilter: "blur(var(--blur-modal))",
              border: "1px solid var(--modal-border)",
              boxShadow: "var(--elevation-modal)",
              // pan-y so a tall sheet scrolls its own content on touch; the flick
              // -to-dismiss still works because framer drives it through pointer
              // capture. Was "none", which blocked scrolling entirely.
              touchAction: "pan-y",
            }}
            initial={reduced ? { opacity: 0 } : { y: "100%" }}
            animate={reduced ? { opacity: 1 } : { y: 0 }}
            exit={reduced ? { opacity: 0 } : { y: "100%" }}
            transition={spring.settle}
            drag={reduced ? false : "y"}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.7 }}
            dragTransition={{ bounceStiffness: 300, bounceDamping: 34 }}
            onDragEnd={(_e, info) => {
              // Where would a flick of this speed come to rest? If that's past
              // the dismiss line, let it go; otherwise the elastic constraint
              // springs it back to 0 on its own (apple-design §6).
              const projected = info.offset.y + project(info.velocity.y);
              if (projected > DISMISS_DISTANCE) onClose();
            }}
          >
            <div
              aria-hidden
              className="mx-auto mb-4 h-1 w-10 rounded-full bg-foreground/20"
            />
            {children}
          </m.div>
        </m.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
