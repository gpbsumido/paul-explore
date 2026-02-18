import { type RefObject } from "react";
import { useInView } from "./useInView";
import Section, { reveal } from "./Section";

export default function DesignSection() {
  const [ref, visible] = useInView();

  return (
    <Section className="bg-background">
      <div ref={ref as RefObject<HTMLDivElement>}>
        <h2
          className={`text-center text-3xl font-bold tracking-tight text-foreground md:text-4xl ${reveal(visible)}`}
        >
          Design System
        </h2>
        <p
          className={`mx-auto mt-3 max-w-lg text-center text-muted ${reveal(visible, "delay-100")}`}
        >
          A token-driven palette with semantic color aliases, consistent
          spacing, and theme toggling.
        </p>

        {/* color swatches */}
        <div
          className={`mt-10 flex flex-wrap justify-center gap-3 ${reveal(visible, "delay-200")}`}
        >
          {[
            ["bg-primary-400", "P400"],
            ["bg-primary-500", "P500"],
            ["bg-primary-600", "P600"],
            ["bg-secondary-400", "S400"],
            ["bg-secondary-500", "S500"],
            ["bg-secondary-600", "S600"],
            ["bg-neutral-300 dark:bg-neutral-600", "N"],
            ["bg-error-500", "Err"],
            ["bg-success-500", "Ok"],
            ["bg-warning-500", "Warn"],
          ].map(([bg, label]) => (
            <div key={label} className="flex flex-col items-center gap-1">
              <div className={`h-10 w-10 rounded-lg ${bg} shadow-sm`} />
              <span className="text-[10px] text-muted">{label}</span>
            </div>
          ))}
        </div>

        {/* button variants */}
        <div
          className={`mt-10 flex flex-wrap justify-center gap-3 ${reveal(visible, "delay-300")}`}
        >
          <span className="inline-flex items-center rounded-full bg-foreground px-5 py-2 text-sm font-medium text-background">
            Primary
          </span>
          <span className="inline-flex items-center rounded-full border border-border bg-surface px-5 py-2 text-sm font-medium text-foreground">
            Secondary
          </span>
          <span className="inline-flex items-center rounded-full bg-primary-500 px-5 py-2 text-sm font-medium text-white">
            Accent
          </span>
          <span className="inline-flex items-center rounded-full bg-error-500 px-5 py-2 text-sm font-medium text-white">
            Destructive
          </span>
        </div>

        {/* radius & shadow demo */}
        <div
          className={`mt-10 flex flex-wrap justify-center gap-4 ${reveal(visible, "delay-[400ms]")}`}
        >
          {(["sm", "md", "lg", "xl", "2xl", "full"] as const).map((r) => (
            <div
              key={r}
              className={`flex h-14 w-14 items-center justify-center border border-border bg-surface-raised text-[10px] text-muted shadow-sm rounded-${r}`}
            >
              {r}
            </div>
          ))}
        </div>
      </div>
    </Section>
  );
}
