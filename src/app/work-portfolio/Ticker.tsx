"use client";

/**
 * A horizontal ticker strip. Static and scrollable for now, the marquee
 * animation lands separately so each piece stays testable.
 */
export default function Ticker({
  label,
  edge,
  children,
}: {
  /** accessible name, also used by tests to find each strip */
  label: string;
  /** which edge of the page this strip sits on */
  edge: "top" | "bottom";
  children: React.ReactNode;
}) {
  const borderSide = edge === "top" ? "border-b" : "border-t";
  return (
    <section
      aria-label={label}
      className={`w-full overflow-x-auto ${borderSide} border-border bg-surface/30`}
    >
      <div className="flex w-max items-center gap-2 px-4 py-2.5">{children}</div>
    </section>
  );
}
