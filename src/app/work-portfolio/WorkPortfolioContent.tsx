"use client";

import { useEffect, useRef, useState } from "react";
import { m } from "framer-motion";
import {
  PROJECTS,
  FEATURES,
  projectFor,
  featureIndexBySlug,
} from "./_data/catalog";
import IntroCard from "./IntroCard";
import Ticker from "./Ticker";
import StageArrow from "./StageNav";
import { ProjectChip, FeatureChip } from "./chips";
import { cycleIndex } from "./nav";
import ExplainerWindow, { type ExplainerSubject } from "./ExplainerWindow";
import DemoStage from "./DemoStage";
import IconButton from "@/components/ui/IconButton";

/**
 * Client shell for the work-portfolio page. Owns the single piece of state,
 * the selected feature index (null means the intro card is showing).
 */
export default function WorkPortfolioContent() {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [explainer, setExplainer] = useState<{
    subject: ExplainerSubject;
    edge: "top" | "bottom";
  } | null>(null);

  // Desktop hover opens the panel after a short delay. Once open it stays put
  // until the user dismisses it with the close button or Escape, so leaving
  // the trigger does not close it.
  const hoverTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hoverIntent =
    (subject: ExplainerSubject, edge: "top" | "bottom") =>
    (hovering: boolean) => {
      if (hoverTimer.current) clearTimeout(hoverTimer.current);
      if (hovering) {
        hoverTimer.current = setTimeout(() => setExplainer({ subject, edge }), 350);
      }
    };

  const selected = selectedIndex === null ? null : FEATURES[selectedIndex];
  const selectedProjectId = selected ? selected.projectId : null;

  /** Jump to a project's first feature, used by the top ticker. */
  const selectProject = (projectId: string) => {
    const first = FEATURES.findIndex((f) => f.projectId === projectId);
    if (first !== -1) setSelectedIndex(first);
  };

  const step = (dir: 1 | -1) =>
    setSelectedIndex((current) => cycleIndex(current, dir, FEATURES.length));

  // ?feature=<slug> deep-links straight to a demo. Read once on mount;
  // unknown slugs just leave the intro card up.
  useEffect(() => {
    const slug = new URLSearchParams(window.location.search).get("feature");
    if (!slug) return;
    const index = featureIndexBySlug(slug);
    // microtask defer keeps the effect from setting state synchronously
    if (index !== null) queueMicrotask(() => setSelectedIndex(index));
  }, []);

  // Keep the URL shareable as the selection moves, without history spam.
  useEffect(() => {
    const url = new URL(window.location.href);
    if (selectedIndex === null) {
      if (!url.searchParams.has("feature")) return;
      url.searchParams.delete("feature");
    } else {
      url.searchParams.set("feature", FEATURES[selectedIndex].slug);
    }
    window.history.replaceState(null, "", url);
  }, [selectedIndex]);

  // Keyboard arrows drive the same cycle. Skipped while typing in a form
  // control or while focus sits inside an isolated scope (the explainer
  // window marks itself with data-keyboard-scope).
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
      // events can target window itself, which has no DOM element API
      if (e.target instanceof HTMLElement) {
        const tag = e.target.tagName;
        if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
        if (e.target.isContentEditable) return;
        if (e.target.closest('[data-keyboard-scope="isolated"]')) return;
      }
      setSelectedIndex((current) =>
        cycleIndex(current, e.key === "ArrowRight" ? 1 : -1, FEATURES.length),
      );
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-background">
      <Ticker label="Projects ticker" edge="top" direction="left">
        {PROJECTS.map((project) => (
          <ProjectChip
            key={project.id}
            project={project}
            active={project.id === selectedProjectId}
            onSelect={() => selectProject(project.id)}
            onInfo={() =>
              setExplainer({
                subject: { kind: "project", project },
                edge: "top",
              })
            }
            onInfoHover={hoverIntent({ kind: "project", project }, "top")}
          />
        ))}
      </Ticker>
      <main
        className="flex min-h-0 flex-1 items-center gap-1 px-1 py-1.5"
        aria-label="Demo stage"
      >
        <StageArrow dir="prev" onClick={() => step(-1)} />
        {/* scroll the demo area when it needs more height than the space between
            the tickers, so both tickers stay pinned and visible */}
        <div className="h-full min-h-0 w-full overflow-y-auto">
          {/* keying by slug remounts on change, giving a quick fade-in
              without AnimatePresence exit-waits (which stall in jsdom) */}
          <m.div
            key={selected ? selected.slug : "intro"}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.18 }}
            className="h-full"
          >
              {selected === null ? (
                <IntroCard />
              ) : (
                <div className="flex h-full flex-col gap-1.5">
                  {/* compact header row so the demo surface gets ~95% of the space */}
                  <div className="flex flex-wrap items-baseline justify-center gap-x-2 gap-y-0.5">
                  <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-muted">
                    {projectFor(selected).name}
                  </p>
                  <div className="flex items-center gap-2">
                    <h1 className="text-lg font-bold text-foreground">
                      {selected.title}
                    </h1>
                    <IconButton
                      size="sm"
                      aria-label={`About ${selected.title}`}
                      onClick={() =>
                        setExplainer({
                          subject: {
                            kind: "feature",
                            feature: selected,
                            project: projectFor(selected),
                          },
                          edge: "bottom",
                        })
                      }
                      onMouseEnter={() =>
                        hoverIntent(
                          {
                            kind: "feature",
                            feature: selected,
                            project: projectFor(selected),
                          },
                          "bottom",
                        )(true)
                      }
                      onMouseLeave={() =>
                        hoverIntent(
                          {
                            kind: "feature",
                            feature: selected,
                            project: projectFor(selected),
                          },
                          "bottom",
                        )(false)
                      }
                      className="!h-5 !w-5 border border-border text-[10px] font-bold"
                    >
                      i
                    </IconButton>
                  </div>
                  <p className="hidden text-[13px] text-muted sm:block">
                    {selected.tagline}
                  </p>
                  </div>
                  <div className="min-h-0 flex-1">
                    <DemoStage
                      feature={selected}
                      project={projectFor(selected)}
                    />
                  </div>
                </div>
              )}
          </m.div>
        </div>
        <StageArrow dir="next" onClick={() => step(1)} />
      </main>
      <Ticker label="Features ticker" edge="bottom" direction="right">
        {FEATURES.map((feature, i) => (
          <FeatureChip
            key={feature.slug}
            feature={feature}
            project={projectFor(feature)}
            active={i === selectedIndex}
            onSelect={() => setSelectedIndex(i)}
            onInfo={() =>
              setExplainer({
                subject: {
                  kind: "feature",
                  feature,
                  project: projectFor(feature),
                },
                edge: "bottom",
              })
            }
            onInfoHover={hoverIntent(
              { kind: "feature", feature, project: projectFor(feature) },
              "bottom",
            )}
          />
        ))}
      </Ticker>
      {explainer && (
        <ExplainerWindow
          subject={explainer.subject}
          edge={explainer.edge}
          onClose={() => {
            // Cancel any pending hover-to-open timer so a still-hovering
            // pointer can't immediately reopen what the user just closed.
            if (hoverTimer.current) clearTimeout(hoverTimer.current);
            setExplainer(null);
          }}
        />
      )}
      {/* announces selection changes to screen readers without stealing focus */}
      <div role="status" aria-live="polite" className="sr-only">
        {selected
          ? `Showing ${selected.title} from ${projectFor(selected).name}`
          : ""}
      </div>
    </div>
  );
}
