import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { render } from "@testing-library/react";
import { ThoughtCard, THOUGHTS } from "../featureData";
import CountdownCard from "@/app/calendar/countdown/CountdownCard";
import type { Countdown } from "@/types/calendar";

// The colored left-border stripe is the single most-cited "vibecoded" tell.
// These cards carried their category color as a 2-3px left stripe; the color
// now lives in a small dot instead. This guard keeps the stripe from creeping
// back onto the live card surfaces. Genuine uses of a left rail stay out of the
// list on purpose: calendar event chips (a real calendar convention), state
// rails (operator critical, warning callouts), team-color pick cards, and the
// neutral typographic rails in /learn.
const STRIPED_CARD_FILES = [
  "src/app/_shared/featureData.tsx",
  "src/app/thoughts/ThoughtsIndexContent.tsx",
  "src/app/updates/UpdatesContent.tsx",
  "src/app/craft/CraftContent.tsx",
  "src/app/fantasy/nba/FantasyHubContent.tsx",
  "src/app/calendar/countdown/CountdownCard.tsx",
];

describe("card left-border stripe is retired", () => {
  it.each(STRIPED_CARD_FILES)(
    "%s sets no colored left-border stripe",
    (file) => {
      const src = readFileSync(join(process.cwd(), file), "utf8");
      const offenders = src
        .split("\n")
        .map((line, i) => ({ line: line.trim(), n: i + 1 }))
        .filter(({ line }) => /border-?left/i.test(line));
      expect(offenders).toEqual([]);
    },
  );
});

describe("thought card keeps its color as a dot", () => {
  it("renders no inline left border, and a color dot instead", () => {
    const { container } = render(
      <ThoughtCard thought={THOUGHTS[0]} delayMs={0} visible />,
    );
    expect(container.querySelector('[style*="border-left"]')).toBeNull();
    expect(
      container.querySelector('[style*="background-color"]'),
    ).not.toBeNull();
  });
});

describe("countdown card keeps its color as a dot", () => {
  const countdown: Countdown = {
    id: "c1",
    title: "Launch day",
    targetDate: "2027-01-01",
    color: "#219b84",
    createdAt: "2026-09-20T00:00:00.000Z",
  };

  it("renders no inline left border, and a color dot instead", () => {
    const { container } = render(
      <CountdownCard countdown={countdown} onClick={() => {}} />,
    );
    expect(container.querySelector('[style*="border-left"]')).toBeNull();
    expect(
      container.querySelector('[style*="background-color"]'),
    ).not.toBeNull();
  });
});
