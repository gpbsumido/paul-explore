import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import ClickSpark from "./ClickSpark";

const mocks = vi.hoisted(() => ({ reduced: false }));
vi.mock("@/hooks/usePrefersReducedMotion", () => ({
  usePrefersReducedMotion: () => mocks.reduced,
}));

beforeEach(() => {
  mocks.reduced = false;
});

/**
 * Ends a CSS animation the way React hears about it. React in jsdom listens
 * for the vendor-prefixed name, so the plain "animationend" that
 * fireEvent.animationEnd sends never reaches onAnimationEnd.
 */
const endAnimation = (el: Element) =>
  fireEvent(el, new Event("webkitAnimationEnd", { bubbles: true }));

describe("ClickSpark", () => {
  it("renders its children and leaves their click working", () => {
    const onClick = vi.fn();
    render(
      <ClickSpark>
        <button type="button" onClick={onClick}>
          Nets +150
        </button>
      </ClickSpark>,
    );
    fireEvent.click(screen.getByRole("button", { name: /Nets/ }));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it("bursts sparks from the pointer on press", () => {
    const { container } = render(
      <ClickSpark count={6}>
        <button type="button">pick</button>
      </ClickSpark>,
    );
    expect(container.querySelectorAll(".motion-spark")).toHaveLength(0);
    fireEvent.pointerDown(screen.getByRole("button"), { clientX: 8, clientY: 8 });
    const burst = container.querySelector(".motion-spark");
    expect(burst).not.toBeNull();
    expect(burst?.querySelectorAll(".motion-spark__ray")).toHaveLength(6);
  });

  it("starts the burst where the pointer went down", () => {
    const { container } = render(
      <ClickSpark>
        <button type="button">pick</button>
      </ClickSpark>,
    );
    fireEvent.pointerDown(screen.getByRole("button"), { clientX: 31, clientY: 17 });
    const burst = container.querySelector<HTMLElement>(".motion-spark");
    expect(burst?.style.left).toBe("31px");
    expect(burst?.style.top).toBe("17px");
  });

  it("measures the burst from the wrapper's own corner, not the page's", () => {
    const rect = vi
      .spyOn(HTMLElement.prototype, "getBoundingClientRect")
      .mockReturnValue(new DOMRect(100, 40, 80, 30));
    try {
      const { container } = render(
        <ClickSpark>
          <button type="button">pick</button>
        </ClickSpark>,
      );
      fireEvent.pointerDown(screen.getByRole("button"), { clientX: 130, clientY: 55 });
      const burst = container.querySelector<HTMLElement>(".motion-spark");
      expect(burst?.style.left).toBe("30px");
      expect(burst?.style.top).toBe("15px");
    } finally {
      rect.mockRestore();
    }
  });

  it("spreads the rays evenly around the circle", () => {
    const { container } = render(
      <ClickSpark count={4}>
        <button type="button">pick</button>
      </ClickSpark>,
    );
    fireEvent.pointerDown(screen.getByRole("button"));
    const angles = [...container.querySelectorAll<HTMLElement>(".motion-spark__ray")].map(
      (ray) => ray.style.getPropertyValue("--angle"),
    );
    expect(angles).toEqual(["0deg", "90deg", "180deg", "270deg"]);
  });

  it("clears a burst when its animation ends, leaving any other one alone", () => {
    const { container } = render(
      <ClickSpark>
        <button type="button">pick</button>
      </ClickSpark>,
    );
    fireEvent.pointerDown(screen.getByRole("button"), { clientX: 1, clientY: 1 });
    fireEvent.pointerDown(screen.getByRole("button"), { clientX: 2, clientY: 2 });
    expect(container.querySelectorAll(".motion-spark")).toHaveLength(2);

    endAnimation(container.querySelectorAll(".motion-spark")[0]);

    const left = container.querySelectorAll<HTMLElement>(".motion-spark");
    expect(left).toHaveLength(1);
    expect(left[0].style.left).toBe("2px");
  });

  it("hides the sparks from assistive tech", () => {
    const { container } = render(
      <ClickSpark>
        <button type="button">pick</button>
      </ClickSpark>,
    );
    fireEvent.pointerDown(screen.getByRole("button"));
    expect(container.querySelector(".motion-spark")).toHaveAttribute(
      "aria-hidden",
      "true",
    );
  });

  it("spawns nothing under reduced motion", () => {
    mocks.reduced = true;
    const { container } = render(
      <ClickSpark>
        <button type="button">pick</button>
      </ClickSpark>,
    );
    fireEvent.pointerDown(screen.getByRole("button"));
    expect(container.querySelector(".motion-spark")).toBeNull();
  });
});
