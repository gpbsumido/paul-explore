import { describe, it, expect } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { UpdateTimeline, Update, WhatsNext } from "./ThoughtUpdates";

const entries = [
  { id: "update-2026-08-08-counts", date: "Aug 8, 2026", title: "Counts view" },
  { id: "update-2026-07-01-first", date: "Jul 1, 2026", title: "First pass" },
];

describe("UpdateTimeline", () => {
  it("links to every update by its anchor", () => {
    render(<UpdateTimeline entries={entries} />);
    const nav = screen.getByRole("navigation", { name: /update timeline/i });
    expect(
      within(nav).getByRole("link", { name: "Counts view" }),
    ).toHaveAttribute("href", "#update-2026-08-08-counts");
    expect(
      within(nav).getByRole("link", { name: "First pass" }),
    ).toHaveAttribute("href", "#update-2026-07-01-first");
  });

  it("renders nothing when there is nothing to jump to", () => {
    const { container } = render(<UpdateTimeline entries={[]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("shows each date beside its entry", () => {
    render(<UpdateTimeline entries={entries} />);
    expect(screen.getByText("Aug 8, 2026")).toBeInTheDocument();
  });
});

describe("Update", () => {
  it("carries the anchor the timeline points at", () => {
    const { container } = render(
      <Update
        id="update-2026-08-08-counts"
        date="Aug 8, 2026"
        title="Counts view"
      >
        <p>Body.</p>
      </Update>,
    );
    expect(container.querySelector("#update-2026-08-08-counts")).not.toBeNull();
  });

  it("heads the section with its date and title", () => {
    render(
      <Update id="u1" date="Aug 8, 2026" title="Counts view">
        <p>Body.</p>
      </Update>,
    );
    expect(screen.getByText(/Aug 8, 2026/)).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Counts view" }),
    ).toBeInTheDocument();
  });

  it("leaves room for the sticky header when jumped to", () => {
    const { container } = render(
      <Update id="u1" date="d" title="t">
        <p>b</p>
      </Update>,
    );
    expect(container.querySelector("section")?.className).toContain(
      "scroll-mt-24",
    );
  });
});

describe("WhatsNext", () => {
  it("separates what shipped from what is still open", () => {
    render(
      <WhatsNext
        nowShipped={["The thing I would do now is the thing I did."]}
        couldImprove={["A better way to do it."]}
        upcoming={["The next thing."]}
      />,
    );
    expect(
      screen.getByRole("heading", { name: /what I'd do now/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /where it could go further/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /next/i })).toBeInTheDocument();
  });

  it("puts each list under its own heading", () => {
    render(
      <WhatsNext
        nowShipped={["shipped item"]}
        couldImprove={["improve item"]}
        upcoming={["upcoming item"]}
      />,
    );
    const underHeading = (name: RegExp) =>
      screen.getByRole("heading", { name }).nextElementSibling as HTMLElement;
    expect(underHeading(/what I'd do now/i)).toHaveTextContent("shipped item");
    expect(underHeading(/where it could go further/i)).toHaveTextContent(
      "improve item",
    );
    expect(underHeading(/next/i)).toHaveTextContent("upcoming item");
    expect(underHeading(/next/i)).not.toHaveTextContent("shipped item");
  });

  it("drops a section whose list is empty, and the whole block when all are", () => {
    const { container, rerender } = render(
      <WhatsNext nowShipped={["Only this."]} couldImprove={[]} upcoming={[]} />,
    );
    expect(screen.getAllByRole("heading")).toHaveLength(1);

    rerender(<WhatsNext nowShipped={[]} couldImprove={[]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("omits a section entirely rather than showing an empty heading", () => {
    render(<WhatsNext nowShipped={["Only this."]} />);
    expect(
      screen.queryByRole("heading", { name: /where it could go further/i }),
    ).not.toBeInTheDocument();
  });
});
