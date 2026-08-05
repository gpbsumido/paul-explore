import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { http, HttpResponse } from "msw";
import type { ReactNode } from "react";
import { server } from "@/test/server";
import OperatorSearch from "@/components/operator/OperatorSearch";

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

beforeEach(() => {
  server.use(
    http.get("/api/operator/search-index", () =>
      HttpResponse.json({
        stores: [
          { id: "s1", name: "Gym Vending - Rec Center", status: "online" },
          { id: "s2", name: "Lobby Fridge - Building A", status: "degraded" },
        ],
        products: [{ name: "Cold Brew Coffee 350ml", category: "beverages" }],
      }),
    ),
  );
});

describe("OperatorSearch", () => {
  it("offers the tools as a launcher before anything is typed", async () => {
    const { container } = render(<OperatorSearch onSelect={() => {}} />, {
      wrapper: makeWrapper(),
    });
    const view = within(container);

    expect(await view.findByRole("option", { name: /Plan a location/ })).toBeInTheDocument();
    const combobox = view.getByRole("combobox");
    expect(combobox).toHaveAttribute(
      "aria-activedescendant",
      "operator-search-option-0",
    );
  });

  it("moves the active option with the arrow keys, keeping focus in the field", async () => {
    const { container } = render(<OperatorSearch onSelect={() => {}} />, {
      wrapper: makeWrapper(),
    });
    const view = within(container);
    const user = userEvent.setup();

    const combobox = await view.findByRole("combobox");
    await user.click(combobox);
    await user.keyboard("{ArrowDown}");

    expect(combobox).toHaveAttribute(
      "aria-activedescendant",
      "operator-search-option-1",
    );
    expect(combobox).toHaveFocus();
  });

  it("filters to a matching store and selects it on Enter", async () => {
    const onSelect = vi.fn();
    const { container } = render(<OperatorSearch onSelect={onSelect} />, {
      wrapper: makeWrapper(),
    });
    const view = within(container);
    const user = userEvent.setup();

    await view.findByRole("combobox");
    await user.type(view.getByRole("combobox"), "gym");

    // Only the Gym store matches; the tools are gone.
    expect(view.getByRole("option", { name: /Gym Vending/ })).toBeInTheDocument();
    expect(view.queryByRole("option", { name: /Plan a location/ })).toBeNull();

    await user.keyboard("{Enter}");
    expect(onSelect).toHaveBeenCalledWith(
      expect.objectContaining({ type: "store", href: "/operator/stores/s1" }),
    );
  });

  it("selects a result on click", async () => {
    const onSelect = vi.fn();
    const { container } = render(<OperatorSearch onSelect={onSelect} />, {
      wrapper: makeWrapper(),
    });
    const view = within(container);
    const user = userEvent.setup();

    await user.type(await view.findByRole("combobox"), "coffee");
    await user.click(view.getByRole("option", { name: /Cold Brew Coffee/ }));

    expect(onSelect).toHaveBeenCalledWith(
      expect.objectContaining({ type: "product", label: "Cold Brew Coffee 350ml" }),
    );
  });

  it("exposes a combobox controlling a listbox", async () => {
    const { container } = render(<OperatorSearch onSelect={() => {}} />, {
      wrapper: makeWrapper(),
    });
    const view = within(container);
    await view.findByRole("combobox");
    expect(view.getByRole("listbox")).toBeInTheDocument();
  });
});
