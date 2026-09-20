import { type ReactNode } from "react";

type Props = {
  /** Small uppercase label above the title, matching the landing's eyebrow. */
  eyebrow?: string;
  /** The page title. Rendered as the page's single h1 in the display face. */
  title: string;
  /** Optional supporting sentence under the title. */
  lede?: ReactNode;
  /** Extra classes on the wrapping header (spacing overrides, etc.). */
  className?: string;
};

/**
 * The standard page intro for interior pages: an eyebrow, a confident display
 * title, and an optional lede. This is the same type language the v6 landing
 * uses (`.eyebrow` and `.sectionHeading`) so every page reads like it belongs
 * to the same site rather than a stack of separately styled screens.
 *
 * The h1 inherits Bricolage and tight tracking from the global base rule; the
 * clamp size gives it the landing's editorial confidence instead of a flat
 * text-3xl. The eyebrow is a plain paragraph, not a heading, so it stays out of
 * the document outline.
 */
export default function PageIntro({ eyebrow, title, lede, className }: Props) {
  return (
    <header className={`mb-10${className ? ` ${className}` : ""}`}>
      {eyebrow ? (
        <p className="mb-2.5 text-[0.7rem] font-semibold uppercase tracking-[0.13em] text-muted">
          {eyebrow}
        </p>
      ) : null}
      <h1 className="text-[clamp(2.6rem,6vw,4.25rem)] font-bold leading-[0.98] tracking-[-0.03em] text-foreground">
        {title}
      </h1>
      {lede ? (
        <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-muted">
          {lede}
        </p>
      ) : null}
    </header>
  );
}
