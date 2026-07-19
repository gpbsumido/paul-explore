"use client";

import { useEffect, useRef } from "react";
import type { WorkProject, WorkFeature } from "./_data/types";

/** What the explainer is currently describing. */
export type ExplainerSubject =
  | { kind: "project"; project: WorkProject }
  | { kind: "feature"; feature: WorkFeature; project: WorkProject };

/**
 * The floating explainer panel. Anchored toward the edge its trigger came
 * from (top ticker opens below the strip, everything else above the bottom
 * one). Focus is trapped inside while open; Esc, outside clicks, and the
 * close button dismiss it.
 */
export default function ExplainerWindow({
  subject,
  edge,
  onClose,
}: {
  subject: ExplainerSubject;
  edge: "top" | "bottom";
  onClose: () => void;
}) {
  const panelRef = useRef<HTMLDivElement>(null);

  // focus the panel on open so Esc and the tab trap work immediately
  useEffect(() => {
    panelRef.current?.focus();
  }, [subject]);

  // outside pointer presses dismiss
  useEffect(() => {
    const onPointerDown = (e: PointerEvent) => {
      if (!panelRef.current) return;
      if (e.target instanceof Node && panelRef.current.contains(e.target)) return;
      onClose();
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [onClose]);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      onClose();
      return;
    }
    // minimal focus trap: keep Tab cycling inside the panel
    if (e.key === "Tab" && panelRef.current) {
      const focusables = panelRef.current.querySelectorAll<HTMLElement>(
        "button, a[href], [tabindex]:not([tabindex='-1'])",
      );
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  };

  const project = subject.project;
  const feature = subject.kind === "feature" ? subject.feature : null;
  const position = edge === "top" ? "top-16" : "bottom-16";

  return (
    <div
      ref={panelRef}
      tabIndex={-1}
      role="dialog"
      aria-label={feature ? `About ${feature.title}` : `About ${project.name}`}
      data-keyboard-scope="isolated"
      onKeyDown={onKeyDown}
      className={`fixed left-1/2 z-50 w-[min(28rem,calc(100vw-2rem))] -translate-x-1/2 rounded-xl border border-border bg-background p-4 shadow-xl outline-none ${position}`}
    >
      <div className="mb-2 flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-muted">
            {project.name}
          </p>
          {feature && (
            <p className="text-[15px] font-bold text-foreground">
              {feature.icon} {feature.title}
            </p>
          )}
        </div>
        <button
          type="button"
          aria-label="Close explainer"
          onClick={onClose}
          className="flex h-6 w-6 shrink-0 cursor-pointer items-center justify-center rounded-full text-muted hover:bg-surface hover:text-foreground"
        >
          ✕
        </button>
      </div>

      <div className="space-y-2 text-[13px] leading-relaxed text-muted">
        {feature ? (
          <>
            <p>{feature.explainer.did}</p>
            <p>
              <span className="font-semibold text-foreground">Originally: </span>
              {feature.explainer.stack}
            </p>
            <p>
              <span className="font-semibold text-foreground">In this demo: </span>
              {feature.explainer.mocked}
            </p>
          </>
        ) : (
          <>
            <p>{project.blurb}</p>
            <p>
              <span className="font-semibold text-foreground">Stack: </span>
              {project.stack}
            </p>
            {project.cutFeatures.length > 0 && (
              <p>
                <span className="font-semibold text-foreground">
                  Also shipped:{" "}
                </span>
                {project.cutFeatures.join(", ")}
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
