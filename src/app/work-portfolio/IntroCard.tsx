import { PROJECTS, FEATURES } from "./_data/catalog";

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
      <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
        {PROJECTS.length} projects &middot; {FEATURES.length} feature demos
      </h1>
      <p className="max-w-md text-[15px] leading-relaxed text-muted">
        Reconstructions of features I shipped on past products, rebuilt as
        self-contained demos. Pick a project from the top ticker or a feature
        from the bottom one.
      </p>
    </div>
  );
}
