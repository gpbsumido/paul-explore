import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { axe } from "@/test/a11y";
import TicketBoardContent from "./TicketBoardContent";
import { resetTicketStore } from "./useTicketBoard";
import { SEED_TICKETS } from "@/lib/updates/tickets.data";

vi.mock("@/components/PageHeader", () => ({ default: () => null }));

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** Every test starts from a clean browser store and a cleared snapshot cache. */
const fresh = () => {
  window.localStorage.clear();
  resetTicketStore();
  return render(<TicketBoardContent />);
};

describe("TicketBoardContent", () => {
  it("renders one card per seeded ticket", () => {
    fresh();
    expect(screen.getAllByRole("article")).toHaveLength(SEED_TICKETS.length);
  });

  it("adds a suggestion to the board and persists it", () => {
    fresh();
    fireEvent.click(screen.getByRole("button", { name: /suggest an idea/i }));
    fireEvent.change(screen.getByLabelText("Title"), {
      target: { value: "A calendar dark theme" },
    });
    fireEvent.change(screen.getByLabelText("Details"), {
      target: { value: "It is too bright at night" },
    });
    fireEvent.click(screen.getByRole("button", { name: /add suggestion/i }));

    expect(screen.getByText("A calendar dark theme")).toBeInTheDocument();
    expect(window.localStorage.length).toBeGreaterThan(0);

    // survives a remount from the same storage
    screen.getByText("A calendar dark theme");
    render(<TicketBoardContent />);
    expect(
      screen.getAllByText("A calendar dark theme").length,
    ).toBeGreaterThan(0);
  });

  it("upvotes a ticket and increments its count", () => {
    fresh();
    const target = SEED_TICKETS.find((t) => t.status === "open")!;
    const name = new RegExp(`upvote ${escape(target.title)}`, "i");
    const digits = (el: HTMLElement) => Number(el.textContent!.replace(/\D/g, ""));

    const before = digits(screen.getByRole("button", { name }));
    fireEvent.click(screen.getByRole("button", { name }));
    const after = digits(screen.getByRole("button", { name }));
    expect(after).toBe(before + 1);
  });

  it("links a shipped ticket to the update that closed it", () => {
    const { container } = fresh();
    const shipped = SEED_TICKETS.find((t) => t.status === "shipped")!;
    const link = container.querySelector(
      `a[href="/updates#entry-${shipped.resolvedByEntryId}"]`,
    );
    expect(link).not.toBeNull();
  });

  it("has no axe violations", async () => {
    const { container } = fresh();
    expect(await axe(container)).toHaveNoViolations();
  });
});
