import { describe, it, expect, afterEach, beforeEach, vi } from "vitest";
import {
  render,
  screen,
  within,
  fireEvent,
  waitFor,
} from "@testing-library/react";
import WorkPortfolioContent from "../WorkPortfolioContent";
import { PROJECTS, FEATURES } from "../_data/catalog";

/** Stub matchMedia so the reduced-motion hook sees the given preference. */
function stubReducedMotion(matches: boolean) {
  vi.stubGlobal(
    "matchMedia",
    vi.fn().mockReturnValue({
      matches,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }),
  );
}

afterEach(() => vi.unstubAllGlobals());

// selection writes ?feature= to the URL, reset it so tests stay isolated
beforeEach(() => window.history.replaceState(null, "", "/work-portfolio"));

describe("work-portfolio tickers", () => {
  it("top ticker shows every project chip", () => {
    render(<WorkPortfolioContent />);
    const top = screen.getByLabelText("Projects ticker");
    for (const project of PROJECTS) {
      expect(within(top).getAllByText(project.name).length).toBeGreaterThan(0);
    }
  });

  it("bottom ticker shows every feature chip with its project tag", () => {
    render(<WorkPortfolioContent />);
    const bottom = screen.getByLabelText("Features ticker");
    for (const feature of FEATURES) {
      expect(within(bottom).getAllByText(feature.title).length).toBeGreaterThan(
        0,
      );
    }
  });

  it("stage starts on the intro card", () => {
    render(<WorkPortfolioContent />);
    expect(
      screen.getByText(
        `${PROJECTS.length} projects · ${FEATURES.length} feature demos`,
      ),
    ).toBeInTheDocument();
  });

  it("marquee duplicates the strip for a seamless loop", () => {
    stubReducedMotion(false);
    render(<WorkPortfolioContent />);
    const top = screen.getByLabelText("Projects ticker");
    // two copies: the visible one and the aria-hidden clone
    expect(within(top).getAllByText(PROJECTS[0].name)).toHaveLength(2);
  });

  it("tickers travel in opposite directions", () => {
    stubReducedMotion(false);
    render(<WorkPortfolioContent />);
    // The shared Ticker sets data-direction on the labelled section itself.
    const top = screen.getByLabelText("Projects ticker");
    const bottom = screen.getByLabelText("Features ticker");
    expect(top).toHaveAttribute("data-direction", "left");
    expect(bottom).toHaveAttribute("data-direction", "right");
  });

  it("prefers-reduced-motion renders a single static copy", async () => {
    stubReducedMotion(true);
    render(<WorkPortfolioContent />);
    const top = screen.getByLabelText("Projects ticker");
    // the preference applies on a microtask after mount
    await waitFor(() =>
      expect(within(top).getAllByText(PROJECTS[0].name)).toHaveLength(1),
    );
    // reduced motion drops the ambient scroll, so no direction is marked
    expect(top).not.toHaveAttribute("data-direction");
  });
});

describe("ticker selection", () => {
  it("clicking a feature chip selects that feature on the stage", () => {
    render(<WorkPortfolioContent />);
    const bottom = screen.getByLabelText("Features ticker");
    const chip = within(bottom).getAllByRole("button", {
      name: `Feature: ${FEATURES[3].title}`,
    })[0];
    fireEvent.click(chip);
    expect(
      screen.getByRole("heading", { name: FEATURES[3].title }),
    ).toBeInTheDocument();
    expect(chip).toHaveAttribute("aria-pressed", "true");
  });

  it("clicking a project chip jumps to its first feature and syncs rings", () => {
    render(<WorkPortfolioContent />);
    const top = screen.getByLabelText("Projects ticker");
    const project = PROJECTS[9];
    const chip = within(top).getAllByRole("button", {
      name: `Project: ${project.name}`,
    })[0];
    fireEvent.click(chip);

    const firstFeature = FEATURES.find((f) => f.projectId === project.id)!;
    expect(
      screen.getByRole("heading", { name: firstFeature.title }),
    ).toBeInTheDocument();
    // the owning project chip lights up too
    expect(chip).toHaveAttribute("aria-pressed", "true");
  });

  it("touchstart freezes the marquee so a tap can land", () => {
    stubReducedMotion(false);
    render(<WorkPortfolioContent />);
    const top = screen.getByLabelText("Projects ticker");
    fireEvent.touchStart(top);
    expect(top.querySelector("[data-paused]")).not.toBeNull();
  });
});

describe("every ticker chip stays clickable", () => {
  // The strip duplicates its chips so the ambient loop looks seamless, and the
  // loop wraps at half the scroll width — so roughly half of what is on screen
  // at any moment is the duplicate. When the shared Ticker marked that copy
  // `inert`, those chips silently did nothing when clicked, which reads as the
  // page being broken at random.
  //
  // Asserted on the attribute rather than by clicking, because jsdom does not
  // implement `inert`: a click on the duplicate passes here whether or not the
  // bug is present. This guards the consumer side, so a future version of
  // @paul-portfolio/react cannot bring it back without failing our build.
  it("never renders a duplicate that is inert to the pointer", () => {
    stubReducedMotion(false);
    const { container } = render(<WorkPortfolioContent />);
    const inertGroups = container.querySelectorAll("[inert]");
    expect(inertGroups).toHaveLength(0);
  });

  it("keeps the duplicate out of the accessibility tree without hiding it from the pointer", () => {
    stubReducedMotion(false);
    const { container } = render(<WorkPortfolioContent />);
    const hidden = [...container.querySelectorAll('[aria-hidden="true"]')];
    // There is a duplicate, and it is hidden from assistive tech ...
    expect(hidden.length).toBeGreaterThan(0);
    // ... but nothing on the page is inert, so every chip remains clickable.
    hidden.forEach((el) => expect(el.hasAttribute("inert")).toBe(false));
  });
});
