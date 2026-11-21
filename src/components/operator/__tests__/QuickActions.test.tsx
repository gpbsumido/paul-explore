import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import QuickActions from "../QuickActions";
import {
  buildAlert,
  buildInventoryItem,
} from "@/test/factories/operator";
import type { Alert, InventoryItem } from "@/types/operator";

const hooks = vi.hoisted(() => ({
  items: [] as InventoryItem[],
  alerts: [] as Alert[],
  restockStore: vi.fn(),
  dismissAlert: vi.fn(),
  addToast: vi.fn(),
  isRestocking: false,
  isDismissing: false,
}));

vi.mock("@/hooks/useOperatorInventory", () => ({
  useOperatorInventory: () => ({ items: hooks.items }),
}));
vi.mock("@/hooks/useOperatorAlerts", () => ({
  useOperatorAlerts: () => ({ alerts: hooks.alerts }),
}));
vi.mock("@/hooks/useOperatorMutations", () => ({
  useRestockStore: () => ({
    restockStore: hooks.restockStore,
    isRestocking: hooks.isRestocking,
  }),
  useDismissAlert: () => ({
    dismissAlert: hooks.dismissAlert,
    isDismissing: hooks.isDismissing,
  }),
}));
vi.mock("@/contexts/ToastContext", () => ({
  useToast: () => ({ addToast: hooks.addToast }),
}));

const low = (id: string) =>
  buildInventoryItem({ id, currentStock: 1, capacity: 10 });
const healthy = (id: string) =>
  buildInventoryItem({ id, currentStock: 9, capacity: 10 });
const alert = (id: string, severity: Alert["severity"], acknowledged = false) =>
  buildAlert({ id, severity, acknowledged, storeId: "store-1" });

function renderActions() {
  const client = new QueryClient();
  const invalidate = vi.spyOn(client, "invalidateQueries");
  render(
    <QueryClientProvider client={client}>
      <QuickActions storeId="store-1" />
    </QueryClientProvider>,
  );
  return { invalidate, user: userEvent.setup() };
}

beforeEach(() => {
  hooks.items = [];
  hooks.alerts = [];
  hooks.isRestocking = false;
  hooks.isDismissing = false;
  hooks.restockStore.mockReset().mockResolvedValue(undefined);
  hooks.dismissAlert.mockReset().mockResolvedValue(undefined);
  hooks.addToast.mockReset();
});

describe("QuickActions restock", () => {
  it("says everything is stocked, and disables the button, when nothing is low", () => {
    hooks.items = [healthy("a")];
    renderActions();
    expect(screen.getByRole("button", { name: "All Stocked" })).toBeDisabled();
  });

  it("counts the low items on the button", () => {
    hooks.items = [low("a"), low("b"), healthy("c")];
    renderActions();
    expect(screen.getByRole("button", { name: "Restock All (2)" })).toBeEnabled();
  });

  it("asks first, and restocks only the low items once confirmed", async () => {
    hooks.items = [low("a"), low("b"), healthy("c")];
    const { user } = renderActions();

    await user.click(screen.getByRole("button", { name: "Restock All (2)" }));
    expect(hooks.restockStore).not.toHaveBeenCalled();
    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveTextContent("restock 2 items");

    await user.click(within(dialog).getByRole("button", { name: "Restock All" }));

    await waitFor(() =>
      expect(hooks.restockStore).toHaveBeenCalledWith({
        storeId: "store-1",
        itemIds: ["a", "b"],
      }),
    );
    await waitFor(() =>
      expect(hooks.addToast).toHaveBeenCalledWith({ message: "Restocked 2 items" }),
    );
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  });

  it("uses the singular for one item", async () => {
    hooks.items = [low("a")];
    const { user } = renderActions();
    await user.click(screen.getByRole("button", { name: "Restock All (1)" }));
    await user.click(
      within(screen.getByRole("dialog")).getByRole("button", { name: "Restock All" }),
    );
    await waitFor(() =>
      expect(hooks.addToast).toHaveBeenCalledWith({ message: "Restocked 1 item" }),
    );
  });

  it("restocks nothing when the confirmation is cancelled", async () => {
    hooks.items = [low("a")];
    const { user } = renderActions();
    await user.click(screen.getByRole("button", { name: "Restock All (1)" }));
    await user.click(screen.getByRole("button", { name: "Cancel" }));

    expect(hooks.restockStore).not.toHaveBeenCalled();
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  });

  it("locks the button while a restock is already running", () => {
    hooks.items = [low("a")];
    hooks.isRestocking = true;
    renderActions();
    expect(screen.getByRole("button", { name: "Restock All (1)" })).toBeDisabled();
  });
});

describe("QuickActions alerts", () => {
  it("leaves critical alerts alone and says so when only they are active", () => {
    hooks.alerts = [alert("c1", "critical")];
    renderActions();
    expect(screen.getByRole("button", { name: "Critical only" })).toBeDisabled();
  });

  it("says there are no alerts when nothing is active", () => {
    hooks.alerts = [alert("w1", "warning", true)];
    renderActions();
    expect(screen.getByRole("button", { name: "No Alerts" })).toBeDisabled();
  });

  it("locks the acknowledge button while a dismissal is already running", () => {
    hooks.alerts = [alert("w1", "warning")];
    hooks.isDismissing = true;
    renderActions();
    expect(screen.getByRole("button", { name: "Acknowledge All (1)" })).toBeDisabled();
  });

  it("dismisses every non-critical, unacknowledged alert and nothing else", async () => {
    hooks.alerts = [
      alert("w1", "warning"),
      alert("i1", "info"),
      alert("c1", "critical"),
      alert("w2", "warning", true),
    ];
    const { user } = renderActions();

    await user.click(screen.getByRole("button", { name: "Acknowledge All (2)" }));
    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveTextContent("acknowledge 2 warning and info alerts");
    await user.click(within(dialog).getByRole("button", { name: "Dismiss All" }));

    await waitFor(() =>
      expect(hooks.dismissAlert.mock.calls.map(([input]) => input)).toEqual([
        { alertId: "w1", storeId: "store-1" },
        { alertId: "i1", storeId: "store-1" },
      ]),
    );
    await waitFor(() =>
      expect(hooks.addToast).toHaveBeenCalledWith({ message: "Dismissed 2 alerts" }),
    );
  });
});

describe("QuickActions refresh", () => {
  it("reloads the store's readings and says when they are in", async () => {
    const { user, invalidate } = renderActions();

    await user.click(screen.getByRole("button", { name: "Refresh Readings" }));

    await waitFor(() =>
      expect(hooks.addToast).toHaveBeenCalledWith({
        message: "Latest readings loaded",
        variant: "info",
      }),
    );
    expect(invalidate).toHaveBeenCalledWith({
      queryKey: expect.arrayContaining(["store-1"]),
    });
    expect(screen.getByRole("button", { name: "Refresh Readings" })).toBeEnabled();
  });
});
