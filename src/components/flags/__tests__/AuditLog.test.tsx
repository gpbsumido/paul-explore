import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import AuditLog from "@/components/flags/AuditLog";
import { buildAuditEntries } from "@/test/factories/flags";

describe("AuditLog pagination", () => {
  it("shows all entries and no pager when they fit on one page", () => {
    render(<AuditLog audit={buildAuditEntries(4)} />);

    expect(screen.getByText("Change number 4")).toBeInTheDocument();
    expect(screen.getByText("Change number 1")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /next/i }),
    ).not.toBeInTheDocument();
  });

  it("caps a long log to one page and reveals the rest via Next", () => {
    render(<AuditLog audit={buildAuditEntries(15)} />);

    // First page only.
    expect(screen.getByText("Change number 15")).toBeInTheDocument();
    expect(screen.queryByText("Change number 1")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /next/i }));

    // Second page reveals older entries.
    expect(screen.getByText("Change number 9")).toBeInTheDocument();
    expect(screen.queryByText("Change number 15")).not.toBeInTheDocument();
  });

  it("disables Previous on the first page", () => {
    render(<AuditLog audit={buildAuditEntries(15)} />);

    expect(screen.getByRole("button", { name: /previous/i })).toBeDisabled();
  });

  it("says so when nothing has been changed yet", () => {
    render(<AuditLog audit={[]} />);

    expect(screen.getByText("No changes yet.")).toBeInTheDocument();
    expect(screen.queryByRole("listitem")).not.toBeInTheDocument();
  });

  it("counts the visible range out of the total as the reader pages", () => {
    render(<AuditLog audit={buildAuditEntries(15)} />);
    expect(screen.getByText("1–6 of 15")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /next/i }));
    expect(screen.getByText("7–12 of 15")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /next/i }));
    expect(screen.getByText("13–15 of 15")).toBeInTheDocument();
    expect(screen.getAllByRole("listitem")).toHaveLength(3);
  });

  it("stops Next on the last page and lets Previous walk back", () => {
    render(<AuditLog audit={buildAuditEntries(15)} />);
    const next = screen.getByRole("button", { name: /next/i });
    fireEvent.click(next);
    fireEvent.click(next);
    expect(next).toBeDisabled();

    fireEvent.click(screen.getByRole("button", { name: /previous/i }));
    expect(screen.getByText("Change number 9")).toBeInTheDocument();
    expect(next).toBeEnabled();
  });

  it("keeps an exactly full page to one page with no pager", () => {
    render(<AuditLog audit={buildAuditEntries(6)} />);

    expect(screen.getAllByRole("listitem")).toHaveLength(6);
    expect(
      screen.queryByRole("button", { name: /previous/i }),
    ).not.toBeInTheDocument();
  });
});
