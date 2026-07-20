import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import WorkPortfolioContent from "../WorkPortfolioContent";
import { FEATURES } from "../_data/catalog";
import { cycleIndex } from "../nav";

// the URL-sync effect writes ?feature= as tests select things, so reset
// the jsdom URL before every test or state leaks across them
beforeEach(() => window.history.replaceState(null, "", "/work-portfolio"));

describe("cycleIndex", () => {
  it("steps forward and wraps at the end", () => {
    expect(cycleIndex(0, 1, 24)).toBe(1);
    expect(cycleIndex(23, 1, 24)).toBe(0);
  });

  it("steps back and wraps at the start", () => {
    expect(cycleIndex(5, -1, 24)).toBe(4);
    expect(cycleIndex(0, -1, 24)).toBe(23);
  });

  it("from intro, next lands on the first and prev on the last", () => {
    expect(cycleIndex(null, 1, 24)).toBe(0);
    expect(cycleIndex(null, -1, 24)).toBe(23);
  });
});

describe("stage arrows", () => {
  it("next from the intro selects the first feature", () => {
    render(<WorkPortfolioContent />);
    fireEvent.click(screen.getByRole("button", { name: "Next feature" }));
    expect(
      screen.getByRole("heading", { name: FEATURES[0].title }),
    ).toBeInTheDocument();
  });

  it("prev from the intro selects the last feature", () => {
    render(<WorkPortfolioContent />);
    fireEvent.click(screen.getByRole("button", { name: "Previous feature" }));
    expect(
      screen.getByRole("heading", { name: FEATURES[FEATURES.length - 1].title }),
    ).toBeInTheDocument();
  });

  it("wraps from the last feature back to the first", () => {
    render(<WorkPortfolioContent />);
    fireEvent.click(screen.getByRole("button", { name: "Previous feature" }));
    fireEvent.click(screen.getByRole("button", { name: "Next feature" }));
    expect(
      screen.getByRole("heading", { name: FEATURES[0].title }),
    ).toBeInTheDocument();
  });
});

describe("keyboard navigation", () => {
  it("ArrowRight and ArrowLeft cycle the selection", () => {
    render(<WorkPortfolioContent />);
    fireEvent.keyDown(window, { key: "ArrowRight" });
    expect(
      screen.getByRole("heading", { name: FEATURES[0].title }),
    ).toBeInTheDocument();
    fireEvent.keyDown(window, { key: "ArrowRight" });
    expect(
      screen.getByRole("heading", { name: FEATURES[1].title }),
    ).toBeInTheDocument();
    fireEvent.keyDown(window, { key: "ArrowLeft" });
    expect(
      screen.getByRole("heading", { name: FEATURES[0].title }),
    ).toBeInTheDocument();
  });

  it("ignores arrows while typing in an input", () => {
    render(
      <div>
        <input aria-label="scratch" />
        <WorkPortfolioContent />
      </div>,
    );
    const input = screen.getByLabelText("scratch");
    input.focus();
    fireEvent.keyDown(input, { key: "ArrowRight" });
    // still on the intro card, nothing selected
    expect(screen.queryByRole("heading", { name: FEATURES[0].title })).toBeNull();
  });

  it("ignores arrows inside an isolated keyboard scope", () => {
    render(
      <div>
        <div data-keyboard-scope="isolated">
          <button>inside</button>
        </div>
        <WorkPortfolioContent />
      </div>,
    );
    const inside = screen.getByRole("button", { name: "inside" });
    inside.focus();
    fireEvent.keyDown(inside, { key: "ArrowRight" });
    expect(screen.queryByRole("heading", { name: FEATURES[0].title })).toBeNull();
  });
});

describe("deep links", () => {
  it("?feature= selects that feature on load", async () => {
    const slug = FEATURES[7].slug;
    window.history.replaceState(null, "", `/work-portfolio?feature=${slug}`);
    render(<WorkPortfolioContent />);
    // the deep-link read applies on a microtask, so wait for it
    expect(
      await screen.findByRole("heading", { name: FEATURES[7].title }),
    ).toBeInTheDocument();
    window.history.replaceState(null, "", "/work-portfolio");
  });

  it("an unknown slug leaves the intro card up", () => {
    window.history.replaceState(null, "", "/work-portfolio?feature=nope");
    render(<WorkPortfolioContent />);
    expect(screen.queryByRole("heading", { name: FEATURES[0].title })).toBeNull();
    window.history.replaceState(null, "", "/work-portfolio");
  });

  it("selection writes the slug back to the URL", () => {
    window.history.replaceState(null, "", "/work-portfolio");
    render(<WorkPortfolioContent />);
    fireEvent.click(screen.getByRole("button", { name: "Next feature" }));
    expect(window.location.search).toBe(`?feature=${FEATURES[0].slug}`);
    window.history.replaceState(null, "", "/work-portfolio");
  });
});
