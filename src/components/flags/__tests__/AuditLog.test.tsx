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
});
