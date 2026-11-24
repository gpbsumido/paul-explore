import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";
import { axe } from "@/test/a11y";
import TicketBoardContent from "./TicketBoardContent";
import { resetTicketStore } from "./useTicketBoard";
import { SEED_TICKETS } from "@/lib/updates/tickets.data";
import { UPDATE_ENTRIES } from "@/lib/updates/entries.data";

vi.mock("@/components/PageHeader", () => ({ default: () => null }));

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** Every test starts from a clean browser store and a cleared snapshot cache. */
const fresh = () => {
  window.localStorage.clear();
  resetTicketStore();
  return render(<TicketBoardContent />);
};

/** A new visit: same browser storage, but the in-memory snapshot is read again. */
const revisit = (previous: { unmount: () => void }) => {
  previous.unmount();
  resetTicketStore();
  return render(<TicketBoardContent />);
};

const suggest = (title: string, details: string) => {
  fireEvent.click(screen.getByRole("button", { name: /suggest an idea/i }));
  fireEvent.change(screen.getByLabelText("Title"), { target: { value: title } });
  fireEvent.change(screen.getByLabelText("Details"), { target: { value: details } });
  fireEvent.click(screen.getByRole("button", { name: /add suggestion/i }));
};

const column = (name: string) => screen.getByRole("region", { name });

const digits = (el: HTMLElement) => Number(el.textContent!.replace(/\D/g, ""));

describe("TicketBoardContent", () => {
  it("renders one card per seeded ticket", () => {
    fresh();
    expect(screen.getAllByRole("article")).toHaveLength(SEED_TICKETS.length);
  });

  it("puts each ticket in the column for its status", () => {
    fresh();
    const shipped = SEED_TICKETS.find((t) => t.status === "shipped")!;
    const open = SEED_TICKETS.find((t) => t.status === "open")!;

    expect(within(column("Shipped")).getByText(shipped.title)).toBeInTheDocument();
    expect(within(column("Open")).getByText(open.title)).toBeInTheDocument();
    expect(within(column("Open")).queryByText(shipped.title)).not.toBeInTheDocument();
  });

  it("adds a suggestion to the Open column and closes the form", () => {
    fresh();
    suggest("A calendar dark theme", "It is too bright at night");

    expect(within(column("Open")).getByText("A calendar dark theme")).toBeInTheDocument();
    expect(screen.queryByRole("form", { name: /suggest an idea/i })).not.toBeInTheDocument();
  });

  it("keeps a suggestion after the page is reopened", () => {
    const first = fresh();
    suggest("A calendar dark theme", "It is too bright at night");

    revisit(first);

    expect(screen.getByText("A calendar dark theme")).toBeInTheDocument();
  });

  it("will not add a suggestion with a blank title or details", () => {
    fresh();
    fireEvent.click(screen.getByRole("button", { name: /suggest an idea/i }));
    fireEvent.change(screen.getByLabelText("Title"), { target: { value: "   " } });
    fireEvent.change(screen.getByLabelText("Details"), { target: { value: "something" } });
    fireEvent.click(screen.getByRole("button", { name: /add suggestion/i }));

    expect(screen.getAllByRole("article")).toHaveLength(SEED_TICKETS.length);
    expect(screen.getByRole("form", { name: /suggest an idea/i })).toBeInTheDocument();
  });

  it("closes the form without adding anything when cancelled", () => {
    fresh();
    fireEvent.click(screen.getByRole("button", { name: /suggest an idea/i }));
    fireEvent.change(screen.getByLabelText("Title"), { target: { value: "Never mind" } });
    fireEvent.click(screen.getByRole("button", { name: /cancel/i }));

    expect(screen.queryByRole("form", { name: /suggest an idea/i })).not.toBeInTheDocument();
    expect(screen.queryByText("Never mind")).not.toBeInTheDocument();
  });

  it("upvotes a ticket, increments its count, and takes the vote back on a second click", () => {
    fresh();
    const target = SEED_TICKETS.find((t) => t.status === "open")!;
    const name = new RegExp(`upvote ${escape(target.title)}`, "i");

    const before = digits(screen.getByRole("button", { name }));
    fireEvent.click(screen.getByRole("button", { name }));
    expect(digits(screen.getByRole("button", { name }))).toBe(before + 1);
    expect(screen.getByRole("button", { name })).toHaveAttribute("aria-pressed", "true");

    fireEvent.click(screen.getByRole("button", { name }));
    expect(digits(screen.getByRole("button", { name }))).toBe(before);
    expect(screen.getByRole("button", { name })).toHaveAttribute("aria-pressed", "false");
  });

  it("remembers a vote after the page is reopened", () => {
    const first = fresh();
    const target = SEED_TICKETS.find((t) => t.status === "open")!;
    const name = new RegExp(`upvote ${escape(target.title)}`, "i");
    const before = digits(screen.getByRole("button", { name }));
    fireEvent.click(screen.getByRole("button", { name }));

    revisit(first);

    expect(digits(screen.getByRole("button", { name }))).toBe(before + 1);
    expect(screen.getByRole("button", { name })).toHaveAttribute("aria-pressed", "true");
  });

  it("links a shipped ticket to the update that closed it, by that update's title", () => {
    fresh();
    const shipped = SEED_TICKETS.find((t) => t.status === "shipped")!;
    const entry = UPDATE_ENTRIES.find((e) => e.id === shipped.resolvedByEntryId)!;

    const link = screen.getByRole("link", { name: new RegExp(`Shipped in .${escape(entry.title)}`) });

    expect(link).toHaveAttribute("href", `/updates#entry-${shipped.resolvedByEntryId}`);
  });

  it("narrows to the tickets of one type", () => {
    fresh();
    const bugs = SEED_TICKETS.filter((t) => t.type === "bug").length;
    expect(bugs).toBeGreaterThan(0);
    expect(bugs).toBeLessThan(SEED_TICKETS.length);

    fireEvent.click(screen.getByRole("button", { name: "Bug" }));

    expect(screen.getAllByRole("article")).toHaveLength(bugs);
  });

  it("narrows to the tickets matching a search, and says a column is empty when nothing is left in it", () => {
    fresh();
    const target = SEED_TICKETS[0];

    fireEvent.change(screen.getByRole("searchbox", { name: /search tickets/i }), {
      target: { value: target.title },
    });

    const cards = screen.getAllByRole("article");
    expect(cards.length).toBeGreaterThan(0);
    expect(cards.length).toBeLessThan(SEED_TICKETS.length);
    expect(screen.getAllByText(/nothing here yet/i).length).toBeGreaterThan(0);
  });

  it("has no axe violations", async () => {
    const { container } = fresh();
    expect(await axe(container)).toHaveNoViolations();
  });
});
