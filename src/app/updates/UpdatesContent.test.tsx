import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";
import { axe } from "@/test/a11y";
import UpdatesContent from "./UpdatesContent";
import { UPDATE_ENTRIES } from "@/lib/updates/entries.data";
import { SEED_TICKETS } from "@/lib/updates/tickets.data";

vi.mock("@/components/PageHeader", () => ({ default: () => null }));

// Most of these tests render and re-render every update card, and the list
// grows with each release. Idle they take under a second; under heavy CPU
// contention (seed 1234 with 8 busy processes per core) the axe and sort tests
// passed 5s and timed out, and four more sat above 4s. That is the "failed once
// on a loaded machine" this used to be.
const WHOLE_LIST_TIMEOUT_MS = 30_000;

const escapeRegExp = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

describe("UpdatesContent", { timeout: WHOLE_LIST_TIMEOUT_MS }, () => {
  it("renders one article per update by default", () => {
    render(<UpdatesContent />);
    expect(screen.getAllByRole("article")).toHaveLength(UPDATE_ENTRIES.length);
  });

  it("shows an empty message and no articles when nothing matches the search", () => {
    render(<UpdatesContent />);
    fireEvent.change(screen.getByRole("searchbox"), {
      target: { value: "zzzznomatch" },
    });
    expect(screen.queryAllByRole("article")).toHaveLength(0);
    expect(screen.getByText(/no updates match/i)).toBeInTheDocument();
  });

  it("narrows to a single category when its chip is clicked", () => {
    render(<UpdatesContent />);
    const featureCount = UPDATE_ENTRIES.filter((e) => e.category === "feature").length;
    expect(featureCount).toBeGreaterThan(0);
    expect(featureCount).toBeLessThan(UPDATE_ENTRIES.length);

    fireEvent.click(screen.getByRole("button", { name: "Feature" }));
    expect(screen.getAllByRole("article")).toHaveLength(featureCount);
  });

  it("expands an update to reveal its body", () => {
    render(<UpdatesContent />);
    const first = UPDATE_ENTRIES[0];
    const toggle = screen.getByRole("button", {
      name: new RegExp(escapeRegExp(first.title)),
    });
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByText(first.body[0])).not.toBeInTheDocument();
    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByText(first.body[0])).toBeInTheDocument();
    fireEvent.click(toggle);
    expect(screen.queryByText(first.body[0])).not.toBeInTheDocument();
  });

  it("has no axe violations", async () => {
    const { container } = render(<UpdatesContent />);
    expect(await axe(container)).toHaveNoViolations();
  });

  /** The dates on the rendered cards, top to bottom. */
  const renderedDates = () =>
    screen
      .getAllByRole("article")
      .map((card) => card.querySelector("time")?.getAttribute("datetime") ?? "");

  it("lists the newest update first, and the oldest first once the order is flipped", () => {
    render(<UpdatesContent />);

    const newestFirst = renderedDates();
    expect(newestFirst).toEqual([...newestFirst].sort().reverse());
    expect(newestFirst[0]).toBe(UPDATE_ENTRIES.map((e) => e.date).sort().reverse()[0]);

    fireEvent.click(screen.getByRole("button", { name: "Newest first" }));

    const oldestFirst = renderedDates();
    expect(oldestFirst).toEqual([...oldestFirst].sort());
    expect(screen.getByRole("button", { name: "Oldest first" })).toBeInTheDocument();
  });

  it("finds an update by a word in its title, and drops the ones that do not match", () => {
    render(<UpdatesContent />);
    const target = UPDATE_ENTRIES[0];

    fireEvent.change(screen.getByRole("searchbox"), { target: { value: target.title } });

    const cards = screen.getAllByRole("article");
    expect(cards.length).toBeGreaterThan(0);
    expect(cards.length).toBeLessThan(UPDATE_ENTRIES.length);
    expect(
      cards.some((card) => within(card).queryByText(target.title) !== null),
    ).toBe(true);
  });

  it("keeps only the updates with a tag when the tag is picked, and brings them all back when it is picked again", () => {
    render(<UpdatesContent />);
    const tag = UPDATE_ENTRIES.flatMap((e) => e.tags).find(
      (t) => UPDATE_ENTRIES.filter((e) => e.tags.includes(t)).length < UPDATE_ENTRIES.length,
    )!;
    const expected = UPDATE_ENTRIES.filter((e) => e.tags.includes(tag)).length;

    fireEvent.click(screen.getByRole("button", { name: `#${tag}` }));
    expect(screen.getAllByRole("article")).toHaveLength(expected);
    expect(screen.getByRole("button", { name: `#${tag}` })).toHaveAttribute("aria-pressed", "true");

    fireEvent.click(screen.getByRole("button", { name: `#${tag}` }));
    expect(screen.getAllByRole("article")).toHaveLength(UPDATE_ENTRIES.length);
  });

  it("says how many updates are showing, in the singular when there is one", () => {
    render(<UpdatesContent />);
    expect(screen.getByText(`${UPDATE_ENTRIES.length} updates`)).toBeInTheDocument();

    fireEvent.change(screen.getByRole("searchbox"), { target: { value: "zzzznomatch" } });
    expect(screen.getByText("0 updates")).toBeInTheDocument();

    fireEvent.change(screen.getByRole("searchbox"), {
      target: { value: UPDATE_ENTRIES[0].title },
    });
    expect(screen.getByText("1 update")).toBeInTheDocument();
  });

  it("links an update that closed a ticket to that ticket on the board, by title", () => {
    render(<UpdatesContent />);
    const entry = UPDATE_ENTRIES.find((e) => e.resolvedTicketIds.length > 0)!;
    const ticket = SEED_TICKETS.find((t) => t.id === entry.resolvedTicketIds[0])!;

    fireEvent.click(
      screen.getByRole("button", { name: new RegExp(escapeRegExp(entry.title)) }),
    );

    expect(screen.getByRole("link", { name: ticket.title })).toHaveAttribute(
      "href",
      `/updates/tickets#ticket-${ticket.id}`,
    );
  });
});
