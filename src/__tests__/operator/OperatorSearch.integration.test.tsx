import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { http, HttpResponse } from "msw";
import type { ReactNode } from "react";
import { server } from "@/test/server";
import OperatorSearch from "@/components/operator/OperatorSearch";
import { OPERATOR_TOOLS } from "@/lib/operator-search";

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

describe("OperatorSearch keyboard and pointer use", () => {
  const lastTool = OPERATOR_TOOLS[OPERATOR_TOOLS.length - 1];

  const renderSearch = (onSelect = vi.fn()) => {
    const { container } = render(<OperatorSearch onSelect={onSelect} />, {
      wrapper: makeWrapper(),
    });
    return { view: within(container), onSelect };
  };

  const selectedOption = (view: ReturnType<typeof within>) =>
    view.getAllByRole("option").find((option: HTMLElement) => option.getAttribute("aria-selected") === "true");

  it("wraps from the first result up to the last with ArrowUp, and back down with ArrowDown", async () => {
    const { view } = renderSearch();
    const user = userEvent.setup();
    await user.click(await view.findByRole("combobox"));

    await user.keyboard("{ArrowUp}");
    expect(selectedOption(view)).toHaveTextContent(lastTool.label);

    await user.keyboard("{ArrowDown}");
    expect(selectedOption(view)).toHaveTextContent(OPERATOR_TOOLS[0].label);
  });

  it("selects the highlighted result on Enter, not just the first", async () => {
    const { view, onSelect } = renderSearch();
    const user = userEvent.setup();
    await user.click(await view.findByRole("combobox"));

    await user.keyboard("{ArrowDown}{Enter}");

    expect(onSelect).toHaveBeenCalledExactlyOnceWith(OPERATOR_TOOLS[1]);
  });

  it("highlights the option under the mouse", async () => {
    const { view } = renderSearch();
    const user = userEvent.setup();
    await view.findByRole("combobox");

    await user.hover(view.getAllByRole("option")[2]);

    expect(selectedOption(view)).toBe(view.getAllByRole("option")[2]);
    expect(view.getByRole("combobox")).toHaveAttribute("aria-activedescendant", "operator-search-option-2");
  });

  it("selects the result that was clicked when several match", async () => {
    const { view, onSelect } = renderSearch();
    const user = userEvent.setup();
    await user.type(await view.findByRole("combobox"), "b");

    // Both Cold Brew Coffee and Lobby Fridge - Building A start a word with b;
    // the shorter coffee label ranks first, so picking the lobby is the second.
    await user.click(await view.findByRole("option", { name: /Lobby Fridge/ }));

    expect(onSelect).toHaveBeenCalledExactlyOnceWith(
      expect.objectContaining({ type: "store", href: "/operator/stores/s2" }),
    );
  });

  it("goes back to the first result when the query changes", async () => {
    const { view } = renderSearch();
    const user = userEvent.setup();
    const combobox = await view.findByRole("combobox");
    await user.click(combobox);
    await user.keyboard("{ArrowDown}{ArrowDown}");

    await user.type(combobox, "b");

    expect(combobox).toHaveAttribute("aria-activedescendant", "operator-search-option-0");
  });

  it("clears the query on Escape and shows the tools again", async () => {
    const { view } = renderSearch();
    const user = userEvent.setup();
    const combobox = await view.findByRole("combobox");
    await user.type(combobox, "gym");
    expect(view.queryByRole("option", { name: /Plan a location/ })).toBeNull();

    await user.keyboard("{Escape}");

    expect(combobox).toHaveValue("");
    expect(view.getByRole("option", { name: /Plan a location/ })).toBeInTheDocument();
  });

  it("says nothing matches, and selects nothing on Enter, for a query with no results", async () => {
    const { view, onSelect } = renderSearch();
    const user = userEvent.setup();
    await user.type(await view.findByRole("combobox"), "zzzz");

    await user.keyboard("{Enter}");

    expect(view.getByText(/nothing matches/i)).toHaveTextContent("zzzz");
    expect(view.queryByRole("option")).toBeNull();
    expect(onSelect).not.toHaveBeenCalled();
  });
});
