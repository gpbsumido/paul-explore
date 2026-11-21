import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import type { Store } from "@/types/operator";
import StoreDetail from "./StoreDetail";

const state = vi.hoisted(() => ({
  hook: {
    store: undefined as Store | undefined,
    loading: false,
    error: null as string | null,
  },
  seenInitialData: undefined as Store | undefined,
}));

vi.mock("@/hooks/useOperatorStore", () => ({
  useOperatorStore: (_id: string, options: { initialData?: Store }) => {
    state.seenInitialData = options.initialData;
    return state.hook;
  },
}));

// The pieces around the detail view have their own tests. Each one is reduced
// to a marker so this file only asks which of them the view chose to show.
vi.mock("@/components/operator/StoreHeader", () => ({
  default: ({ store }: { store: Store }) => <h1>{`header for ${store.id}`}</h1>,
}));
vi.mock("@/components/operator/QuickActions", () => ({
  default: ({ storeId }: { storeId: string }) => <div>{`actions for ${storeId}`}</div>,
}));
vi.mock("@/components/operator/StoreTabs", () => ({
  default: ({ storeId }: { storeId: string }) => <div>{`tabs for ${storeId}`}</div>,
}));
vi.mock("@/components/operator/ToastNotification", () => ({
  default: () => <div>toasts</div>,
}));

const aStore = (overrides: Partial<Store> = {}): Store =>
  ({ id: "store-7", name: "Queen St", ...overrides }) as unknown as Store;

beforeEach(() => {
  state.hook = { store: undefined, loading: false, error: null };
  state.seenInitialData = undefined;
});

describe("StoreDetail", () => {
  it("shows the loaded store with its header, actions, tabs and a way back to the fleet", () => {
    state.hook = { store: aStore(), loading: false, error: null };
    render(<StoreDetail storeId="store-7" />);

    expect(screen.getByText("header for store-7")).toBeInTheDocument();
    expect(screen.getByText("actions for store-7")).toBeInTheDocument();
    expect(screen.getByText("tabs for store-7")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /back to fleet/i })).toHaveAttribute(
      "href",
      "/operator",
    );
  });

  it("hands the server-loaded store to the hook, so the header can paint on the first render", () => {
    const seeded = aStore();
    state.hook = { store: seeded, loading: false, error: null };
    render(<StoreDetail storeId="store-7" initialStore={seeded} />);

    expect(state.seenInitialData).toBe(seeded);
  });

  it("shows a skeleton, not the header, while the store is still loading", () => {
    state.hook = { store: undefined, loading: true, error: null };
    render(<StoreDetail storeId="store-7" />);

    expect(screen.queryByText("header for store-7")).toBeNull();
    expect(screen.queryByText(/store not found/i)).toBeNull();
    expect(screen.queryByRole("link", { name: /back to fleet/i })).toBeNull();
  });

  it("keeps showing the store it has while a refresh is in flight", () => {
    state.hook = { store: aStore(), loading: true, error: null };
    render(<StoreDetail storeId="store-7" />);

    expect(screen.getByText("header for store-7")).toBeInTheDocument();
  });

  it("says the store was not found when the load finished with nothing", () => {
    state.hook = { store: undefined, loading: false, error: null };
    render(<StoreDetail storeId="store-7" />);

    expect(screen.getByText("Store not found.")).toBeInTheDocument();
    expect(screen.queryByText("header for store-7")).toBeNull();
  });

  it("shows the error, and nothing of the store, when the load failed", () => {
    state.hook = { store: aStore(), loading: false, error: "Failed to fetch store" };
    render(<StoreDetail storeId="store-7" />);

    expect(screen.getByText("Failed to fetch store")).toBeInTheDocument();
    expect(screen.queryByText("header for store-7")).toBeNull();
  });
});
