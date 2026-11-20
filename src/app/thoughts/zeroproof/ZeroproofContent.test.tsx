import { describe, it, expect, vi } from "vitest";
import { render } from "@testing-library/react";
import ZeroproofContent from "./ZeroproofContent";

vi.mock("@/components/PageHeader", () => ({ default: () => null }));

describe("ZeroproofContent", () => {
  it("carries the signed-out bets update after the earlier ones", () => {
    render(<ZeroproofContent />);
    const update = document.getElementById(
      "update-2026-11-18-signed-out-bets",
    );
    const previous = document.getElementById("update-2026-10-02-go-to-date");
    expect(update).not.toBeNull();
    expect(
      previous!.compareDocumentPosition(update!) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });
});
