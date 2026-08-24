import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

// The Pocket page is force-dynamic and fetches its sets from tcgdex. When that
// upstream is unreachable the SDK throws, and the page used to let the throw
// propagate — so it rendered nothing, no <main> landmark, and the a11y e2e
// timed out waiting for one. It must degrade to an accessible fallback instead.
vi.mock("next/headers", () => ({
  cookies: async () => ({ get: () => ({ value: "visitor" }) }),
}));
vi.mock("@/lib/flags-gate", () => ({
  loadPocketGate: async () => ({ enabled: true }),
}));
vi.mock("@/components/PageHeader", () => ({ default: () => null }));
vi.mock("@tcgdex/sdk", () => ({
  default: class {
    serie = {
      get: vi.fn(async () => {
        throw new TypeError("fetch failed");
      }),
    };
  },
}));

import PocketPage from "./page";

describe("PocketPage when tcgdex is unreachable", () => {
  it("renders a main landmark with an accessible unavailable message, not a throw", async () => {
    const ui = await PocketPage();
    render(ui);

    expect(screen.getByRole("main")).toBeInTheDocument();
    expect(screen.getByText(/unavailable/i)).toBeInTheDocument();
  });
});
