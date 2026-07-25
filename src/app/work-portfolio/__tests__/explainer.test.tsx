import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  render,
  screen,
  within,
  fireEvent,
  act,
} from "@testing-library/react";
import WorkPortfolioContent from "../WorkPortfolioContent";
import { PROJECTS, FEATURES, projectFor } from "../_data/catalog";

beforeEach(() => window.history.replaceState(null, "", "/work-portfolio"));
afterEach(() => vi.useRealTimers());

describe("explainer window", () => {
  it("opens from a feature chip's info button with the full story", () => {
    render(<WorkPortfolioContent />);
    const bottom = screen.getByLabelText("Features ticker");
    const feature = FEATURES[4];
    fireEvent.click(
      within(bottom).getAllByRole("button", { name: `About ${feature.title}` })[0],
    );

    const dialog = screen.getByRole("dialog", { name: `About ${feature.title}` });
    expect(within(dialog).getByText(feature.explainer.did)).toBeInTheDocument();
    expect(within(dialog).getByText(feature.explainer.mocked)).toBeInTheDocument();
    expect(
      within(dialog).getByText(projectFor(feature).name),
    ).toBeInTheDocument();
  });

  it("opens from a project chip with blurb, stack, and cut features", () => {
    render(<WorkPortfolioContent />);
    const top = screen.getByLabelText("Projects ticker");
    const project = PROJECTS[PROJECTS.length - 1];
    fireEvent.click(
      within(top).getAllByRole("button", { name: `About ${project.name}` })[0],
    );

    const dialog = screen.getByRole("dialog", { name: `About ${project.name}` });
    expect(within(dialog).getByText(project.blurb)).toBeInTheDocument();
    expect(within(dialog).getByText(project.stack)).toBeInTheDocument();
    expect(
      within(dialog).getByText(project.cutFeatures.join(", ")),
    ).toBeInTheDocument();
  });

  it("opens from the stage header for the selected feature", () => {
    render(<WorkPortfolioContent />);
    fireEvent.click(screen.getByRole("button", { name: "Next feature" }));
    // the stage header info button sits outside the tickers
    const stage = screen.getByLabelText("Demo stage");
    fireEvent.click(
      within(stage).getByRole("button", { name: `About ${FEATURES[0].title}` }),
    );
    expect(
      screen.getByRole("dialog", { name: `About ${FEATURES[0].title}` }),
    ).toBeInTheDocument();
  });

  it("closes on Escape and the close button, and stays open on outside presses", () => {
    render(<WorkPortfolioContent />);
    const bottom = screen.getByLabelText("Features ticker");
    const open = () =>
      fireEvent.click(
        within(bottom).getAllByRole("button", {
          name: `About ${FEATURES[0].title}`,
        })[0],
      );

    open();
    fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape" });
    expect(screen.queryByRole("dialog")).toBeNull();

    open();
    fireEvent.click(screen.getByRole("button", { name: "Close explainer" }));
    expect(screen.queryByRole("dialog")).toBeNull();

    open();
    fireEvent.pointerDown(document.body);
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("hover opens the panel after a delay and it stays open on mouse-out", () => {
    vi.useFakeTimers();
    render(<WorkPortfolioContent />);
    const bottom = screen.getByLabelText("Features ticker");
    const info = within(bottom).getAllByRole("button", {
      name: `About ${FEATURES[0].title}`,
    })[0];

    fireEvent.mouseEnter(info);
    expect(screen.queryByRole("dialog")).toBeNull();
    act(() => vi.advanceTimersByTime(400));
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    fireEvent.mouseLeave(info);
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("a click keeps the panel open on mouse-out", () => {
    vi.useFakeTimers();
    render(<WorkPortfolioContent />);
    const bottom = screen.getByLabelText("Features ticker");
    const info = within(bottom).getAllByRole("button", {
      name: `About ${FEATURES[0].title}`,
    })[0];

    fireEvent.mouseEnter(info);
    act(() => vi.advanceTimersByTime(400));
    fireEvent.click(info);
    fireEvent.mouseLeave(info);
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("arrow keys do not change the selection while the explainer has focus", () => {
    render(<WorkPortfolioContent />);
    const bottom = screen.getByLabelText("Features ticker");
    fireEvent.click(
      within(bottom).getAllByRole("button", {
        name: `About ${FEATURES[0].title}`,
      })[0],
    );
    const dialog = screen.getByRole("dialog");
    fireEvent.keyDown(dialog, { key: "ArrowRight" });
    // still on the intro, the arrow press inside the dialog was swallowed
    expect(screen.queryByRole("heading", { name: FEATURES[0].title })).toBeNull();
  });
});
