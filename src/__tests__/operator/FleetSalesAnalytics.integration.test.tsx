import { describe, it, expect, beforeAll } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { server } from "@/test/server";
import { operatorHandlers } from "@/test/handlers/operator";
import FleetSalesAnalytics from "@/components/operator/FleetSalesAnalytics";

beforeAll(() => {
  server.use(...operatorHandlers);
});

function makeWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };
}

describe("FleetSalesAnalytics", () => {
  it("renders the fleet total and a per-store ranking", async () => {
    const { container } = render(<FleetSalesAnalytics />, {
      wrapper: makeWrapper(),
    });
    const view = within(container);

    expect(
      await view.findByText("Top stores by revenue"),
    ).toBeInTheDocument();
    expect(view.getByText(/across the fleet/i)).toBeInTheDocument();
  });

  it("switches the range and keeps rendering analytics", async () => {
    const user = userEvent.setup();
    const { container } = render(<FleetSalesAnalytics />, {
      wrapper: makeWrapper(),
    });
    const view = within(container);

    await view.findByText("Top stores by revenue");

    const yearButton = view.getByRole("button", { name: "Year" });
    await user.click(yearButton);

    await waitFor(() =>
      expect(yearButton).toHaveAttribute("aria-pressed", "true"),
    );
    // The year query reloads, then the ranking renders again.
    expect(await view.findByText("Top stores by revenue")).toBeInTheDocument();
  });
});
