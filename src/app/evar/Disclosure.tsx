"use client";

import { useId, useState, type ReactNode } from "react";

/**
 * A labelled show-and-hide for anything that's useful once but in the way
 * every time after: a button that says what's inside and whether it's open,
 * and the content it controls.
 */
export default function Disclosure({
  label,
  hint,
  children,
  className = "",
}: {
  label: string;
  /** A few muted words after the label, like "optional". */
  hint?: string;
  children: ReactNode;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const id = useId();
  return (
    <div className={className}>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 rounded text-left text-[13px] font-medium text-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/40"
      >
        <svg aria-hidden viewBox="0 0 12 12" className={`h-3 w-3 shrink-0 transition-transform motion-reduce:transition-none ${open ? "rotate-90" : ""}`}>
          <path d="M4 2l4 4-4 4" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        {label}
        {hint ? <span className="font-normal text-muted">{hint}</span> : null}
      </button>
      <div id={id} hidden={!open} className="mt-2">
        {children}
      </div>
    </div>
  );
}
