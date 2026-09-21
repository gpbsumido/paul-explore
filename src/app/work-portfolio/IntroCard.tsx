import { PROJECTS, FEATURES } from "./_data/catalog";
import FeatureTour from "@/components/GuidedTour/FeatureTour";
import type { TourStep } from "@/components/GuidedTour/types";

/** A quick walk-through of the work portfolio for a first-time visitor. */
const TOUR_STEPS: TourStep[] = [
  {
    title: "Take a quick tour?",
    body: "First time here? I'll show you how these demos work — a few clicks, no commitment.",
  },
  {
    anchor: "wp-hero",
    title: `${FEATURES.length} feature demos`,
    body: "Each one's a self-contained reconstruction of a feature I shipped on a past product — real interaction, not a screenshot.",
  },
  {
    anchor: "wp-projects-ticker",
    title: "Browse by project",
    body: "This ticker scrolls through every project. Click one to jump to its first feature demo.",
  },
  {
    anchor: "wp-features-ticker",
    title: "Or by feature",
    body: "This one lists every demo across every project. Click any to load it, or use the ← → arrow keys to step through.",
  },
];

/**
 * The stage's resting state before anything is selected. Points people at
 * the tickers so the first click is obvious.
 */
export default function IntroCard() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
      <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-muted">
        Work portfolio
      </p>
      <h1
        id="wp-hero"
        className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl"
      >
        {PROJECTS.length} projects &middot; {FEATURES.length} feature demos
      </h1>
      <p className="max-w-md text-[15px] leading-relaxed text-muted">
        Reconstructions of features I shipped on past products, rebuilt as
        self-contained demos. Pick a project from the top ticker or a feature
        from the bottom one.
      </p>
      <FeatureTour
        label="Work portfolio"
        storageKey="work-portfolio-tour-seen"
        steps={TOUR_STEPS}
      />
    </div>
  );
}
