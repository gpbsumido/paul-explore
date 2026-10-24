"use client";

import { createContext, useContext, useId, useState, type ReactNode } from "react";

const ResidentTime = createContext<{ on: boolean; set: (on: boolean) => void }>({ on: false, set: () => {} });

/**
 * Whether the plan's figures count a resident's time to set each scan's
 * answers. One switch, read by the calculator and both tables, so they never
 * disagree. Off unless told otherwise, since the answers may well be set for
 * free.
 */
export function ResidentTimeProvider({ children, initiallyOn = false }: { children: ReactNode; initiallyOn?: boolean }) {
  const [on, set] = useState(initiallyOn);
  return <ResidentTime.Provider value={{ on, set }}>{children}</ResidentTime.Provider>;
}

/** Whether a resident's time is being counted. */
export const useCountResident = () => useContext(ResidentTime).on;

/** The switch itself, with what it changes said under it. */
export function ResidentTimeSwitch() {
  const { on, set } = useContext(ResidentTime);
  const id = useId();
  return (
    <div className="mt-6 flex items-start gap-3 rounded-2xl border border-border bg-surface p-4">
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={on}
        aria-describedby={`${id}-what`}
        onClick={() => set(!on)}
        className="paul-touch-min group -m-2 inline-flex shrink-0 items-center justify-center p-2 focus-visible:outline-none"
      >
        <span
          aria-hidden
          className={`relative inline-block h-6 w-11 rounded-full border transition-colors group-focus-visible:ring-2 group-focus-visible:ring-foreground/40 ${
            on ? "border-foreground bg-foreground" : "border-border bg-background"
          }`}
        >
          <span
            className={`absolute top-0.5 size-[18px] rounded-full transition-transform motion-reduce:transition-none ${
              on ? "translate-x-[22px] bg-background" : "translate-x-0.5 bg-muted"
            }`}
          />
        </span>
      </button>
      <div className="min-w-0">
        <label htmlFor={id} className="cursor-pointer text-[15px] font-semibold text-foreground">
          Count a resident&apos;s time to set each scan&apos;s answers
        </label>
        <p id={`${id}-what`} className="mt-1 text-[14px] leading-relaxed text-muted">
          {on
            ? "On: every total below adds a resident measuring each scan, at the rate and minutes on the sliders."
            : "Off: every total below is what running the site costs. Turn it on if the resident is paid for each scan."}
        </p>
      </div>
    </div>
  );
}
