import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { LazyMotion, domAnimation } from "framer-motion";
import { axe } from "@/test/a11y";
import TiltCard from "./TiltCard";

const mocks = vi.hoisted(() => ({ reduced: false }));
vi.mock("@/app/providers", () => ({
  useHubReducedMotion: () => mocks.reduced,
}));

beforeEach(() => {
  mocks.reduced = false;
  // jsdom has no layout, so give the card a 200 x 100 box at the origin.
  vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockReturnValue(
    new DOMRect(0, 0, 200, 100),
  );
});
afterEach(() => vi.restoreAllMocks());

/**
 * Motion values only reach the DOM once a feature bundle is loaded, which the
 * app does at its root.
 */
const renderCard = () =>
  render(
    <LazyMotion features={domAnimation}>
      <TiltCard maxTiltDeg={10}>
        <article aria-label="a card">contents</article>
      </TiltCard>
    </LazyMotion>,
  );
const card = () => screen.getByRole("article").parentElement as HTMLElement;

describe("TiltCard", () => {
  it("turns its top-right corner toward a mouse pointer up there, and flattens when it leaves", async () => {
    renderCard();
    fireEvent.pointerMove(card(), { pointerType: "mouse", clientX: 200, clientY: 0 });

    // Pointer right of centre turns the card around its vertical axis one way,
    // and a pointer above centre tips the top edge back the other way.
    await waitFor(() => {
      expect(card().style.transform).toMatch(/rotateY\((?!-)[1-9]/);
      expect(card().style.transform).toMatch(/rotateX\((?!-)[1-9]/);
    });

    fireEvent.pointerLeave(card());
    await waitFor(() =>
      expect(card().style.transform).not.toMatch(/rotate[XY]\((?!-)[1-9]/),
    );
  });

  it("turns the other way for a pointer at the bottom-left", async () => {
    renderCard();
    fireEvent.pointerMove(card(), { pointerType: "mouse", clientX: 0, clientY: 100 });

    await waitFor(() => {
      expect(card().style.transform).toMatch(/rotateY\(-[1-9]/);
      expect(card().style.transform).toMatch(/rotateX\(-[1-9]/);
    });
  });

  const rotateYDegrees = () =>
    Number(/rotateY\((-?[\d.]+)/.exec(card().style.transform)?.[1] ?? Number.NaN);

  /** Waits for the spring to stop moving, then reads where it stopped. */
  const settledRotateY = async () => {
    let previous = Number.NaN;
    for (let attempt = 0; attempt < 40; attempt += 1) {
      await new Promise((resolve) => setTimeout(resolve, 100));
      const current = rotateYDegrees();
      if (current === previous) return current;
      previous = current;
    }
    throw new Error("the tilt never settled");
  };

  it("tilts in proportion to how far the pointer is from the centre", async () => {
    renderCard();
    // A quarter of the card's width right of centre is half the way to the edge.
    fireEvent.pointerMove(card(), { pointerType: "mouse", clientX: 150, clientY: 50 });

    expect(await settledRotateY()).toBeCloseTo(5, 0);
  });

  it("never tilts further than its maximum, however far out the pointer is", async () => {
    renderCard();
    fireEvent.pointerMove(card(), { pointerType: "mouse", clientX: 2000, clientY: 50 });

    expect(await settledRotateY()).toBeCloseTo(10, 1);
  });

  it("stays flat for a finger", async () => {
    renderCard();
    fireEvent.pointerMove(card(), { pointerType: "touch", clientX: 200, clientY: 0 });
    await new Promise((resolve) => setTimeout(resolve, 150));
    expect(card().style.transform).not.toMatch(/rotate[XY]\((?!-)[1-9]/);
  });

  it("stays flat under reduced motion", async () => {
    mocks.reduced = true;
    renderCard();
    fireEvent.pointerMove(card(), { pointerType: "mouse", clientX: 200, clientY: 0 });
    await new Promise((resolve) => setTimeout(resolve, 150));
    expect(card().style.transform).not.toMatch(/rotate[XY]\((?!-)[1-9]/);
  });

  it("renders its children untouched", () => {
    render(
      <TiltCard>
        <article aria-label="a card">contents</article>
      </TiltCard>,
    );
    expect(screen.getByRole("article", { name: "a card" })).toHaveTextContent(
      "contents",
    );
  });

  it("adds no role of its own around the content", () => {
    render(
      <TiltCard>
        <article aria-label="a card">contents</article>
      </TiltCard>,
    );
    // The wrapper is decorative; only the child's article role exists.
    expect(screen.getAllByRole("article")).toHaveLength(1);
  });

  it("has no axe violations", async () => {
    const { container } = render(
      <TiltCard>
        <article aria-label="a card">contents</article>
      </TiltCard>,
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
