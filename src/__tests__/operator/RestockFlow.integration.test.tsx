import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import SlotCounter from "@/components/operator/restock/SlotCounter";
import RestockReview from "@/components/operator/restock/RestockReview";
import RestockFlow from "@/components/operator/restock/RestockFlow";
import { ToastProvider } from "@/contexts/ToastContext";
import { draftFor } from "@/lib/operator-restock";
import type { InventoryItem } from "@/types/operator";

const item = (over: Partial<InventoryItem> = {}): InventoryItem => ({
  id: "item-1",
  storeId: "store-001",
  productName: "Greek Yogurt Cup",
  category: "dairy",
  currentStock: 8,
  capacity: 12,
  price: 3.25,
  lastRestocked: "2026-08-01T12:00:00.000Z",
  ...over,
});

function renderWithProviders(ui: React.ReactElement) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <ToastProvider>{ui}</ToastProvider>
    </QueryClientProvider>,
  );
}

describe("SlotCounter", () => {
  it("shows what the system expects before anything is touched", () => {
    render(
      <SlotCounter
        item={item()}
        draft={draftFor(item())}
        onSave={vi.fn()}
        onCancel={vi.fn()}
      />,
    );
    expect(screen.getByText(/system expects 8/i)).toBeInTheDocument();
    // Starts skipped: nobody has looked at the shelf yet.
    expect(screen.getByRole("button", { name: /skip count/i })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  it("announces the resulting stock as the restocker taps", async () => {
    const user = userEvent.setup();
    render(
      <SlotCounter
        item={item()}
        draft={draftFor(item())}
        onSave={vi.fn()}
        onCancel={vi.fn()}
      />,
    );

    await user.click(screen.getByRole("button", { name: /increase units added/i }));
    await user.click(screen.getByRole("button", { name: /increase units added/i }));

    // 8 expected + 2 added, and it is announced politely rather than silently.
    const live = screen.getByText(/shelf will hold/i);
    expect(live).toHaveTextContent("10");
    expect(live).toHaveAttribute("aria-live", "polite");
  });

  it("refuses to save a removal until a reason is picked", async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();
    render(
      <SlotCounter
        item={item()}
        draft={draftFor(item())}
        onSave={onSave}
        onCancel={vi.fn()}
      />,
    );

    await user.click(screen.getByRole("button", { name: /increase units removed/i }));
    await user.click(screen.getByRole("button", { name: /save slot/i }));

    expect(onSave).not.toHaveBeenCalled();
    expect(screen.getByText(/pick a reason before saving/i)).toBeInTheDocument();
  });

  it("saves once a reason is chosen", async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();
    render(
      <SlotCounter
        item={item()}
        draft={draftFor(item())}
        onSave={onSave}
        onCancel={vi.fn()}
      />,
    );

    await user.click(screen.getByRole("button", { name: /increase units removed/i }));
    await user.click(screen.getByRole("radio", { name: /expired/i }));
    await user.click(screen.getByRole("button", { name: /save slot/i }));

    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({ removed: 1, removalReason: "expired" }),
    );
  });

  it("treats skipping the count as a deliberate choice, not an absence", async () => {
    const user = userEvent.setup();
    render(
      <SlotCounter
        item={item()}
        draft={draftFor(item())}
        onSave={vi.fn()}
        onCancel={vi.fn()}
      />,
    );

    const toggle = screen.getByRole("button", { name: /skip count/i });
    expect(toggle).toHaveAttribute("aria-pressed", "true");

    // Starting a count un-skips it; skipping again is an explicit decision.
    await user.click(toggle);
    expect(toggle).toHaveAttribute("aria-pressed", "false");

    await user.click(toggle);
    expect(toggle).toHaveAttribute("aria-pressed", "true");
  });
});

describe("RestockReview", () => {
  const drafts = [
    { ...draftFor(item()), countedQty: 5 },
    {
      ...draftFor(item({ id: "item-2", productName: "Energy Bar", currentStock: 4 })),
      countedQty: null,
      added: 6,
    },
  ];
  const itemsById = new Map([
    ["item-1", item()],
    ["item-2", item({ id: "item-2", productName: "Energy Bar", currentStock: 4 })],
  ]);

  it("badges each line as a correction or not counted", () => {
    render(
      <RestockReview
        drafts={drafts}
        itemsById={itemsById}
        isCompleting={false}
        error={null}
        onComplete={vi.fn()}
        onBack={vi.fn()}
      />,
    );

    expect(screen.getByText("Correction")).toBeInTheDocument();
    expect(screen.getByText("Not counted")).toBeInTheDocument();
  });

  it("says nothing has been applied yet, because nothing has", () => {
    render(
      <RestockReview
        drafts={drafts}
        itemsById={itemsById}
        isCompleting={false}
        error={null}
        onComplete={vi.fn()}
        onBack={vi.fn()}
      />,
    );
    expect(screen.getByText(/nothing has been applied yet/i)).toBeInTheDocument();
  });

  it("passes trimmed notes through on complete", async () => {
    const user = userEvent.setup();
    const onComplete = vi.fn();
    render(
      <RestockReview
        drafts={drafts}
        itemsById={itemsById}
        isCompleting={false}
        error={null}
        onComplete={onComplete}
        onBack={vi.fn()}
      />,
    );

    await user.type(screen.getByLabelText(/notes/i), "  front row rotated  ");
    await user.click(screen.getByRole("button", { name: /complete restock/i }));

    expect(onComplete).toHaveBeenCalledWith("front row rotated");
  });

  it("surfaces a failed completion without losing the review", () => {
    render(
      <RestockReview
        drafts={drafts}
        itemsById={itemsById}
        isCompleting={false}
        error="Could not finish the restock. Your counts are still here."
        onComplete={vi.fn()}
        onBack={vi.fn()}
      />,
    );

    expect(screen.getByRole("alert")).toHaveTextContent(/still here/i);
    expect(screen.getByText("Correction")).toBeInTheDocument();
  });
});

describe("RestockFlow", () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string, init?: RequestInit) => {
        if (String(url).includes("/inventory")) {
          return new Response(
            JSON.stringify({ items: [item(), item({ id: "item-2", productName: "Energy Bar" })] }),
            { status: 200 },
          );
        }
        if (String(url).includes("restock-sessions") && init?.method === "POST") {
          return new Response(
            JSON.stringify({
              session: {
                id: "session-001",
                storeId: "store-001",
                startedAt: "2026-08-02T15:00:00.000Z",
                completedAt: null,
                actor: null,
                notes: null,
              },
            }),
            { status: 201 },
          );
        }
        return new Response(JSON.stringify({}), { status: 200 });
      }),
    );
  });

  afterEach(() => vi.unstubAllGlobals());

  it("walks from the slot list into a slot and back", async () => {
    const user = userEvent.setup();
    renderWithProviders(<RestockFlow storeId="store-001" onClose={vi.fn()} />);

    await user.click(await screen.findByRole("button", { name: /start restock/i }));

    const slot = await screen.findByRole("button", { name: /greek yogurt cup/i });
    await user.click(slot);

    expect(await screen.findByText(/system expects/i)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /cancel/i }));
    await waitFor(() =>
      expect(screen.getByText(/slots done/i)).toBeInTheDocument(),
    );
  });

  it("offers to resume a session left in progress", async () => {
    window.localStorage.setItem(
      "operator-restock-session:store-001",
      "session-001",
    );
    renderWithProviders(<RestockFlow storeId="store-001" onClose={vi.fn()} />);

    expect(
      await screen.findByRole("button", { name: /resume restock/i }),
    ).toBeInTheDocument();
  });

  it("cannot review until at least one slot was touched", async () => {
    const user = userEvent.setup();
    renderWithProviders(<RestockFlow storeId="store-001" onClose={vi.fn()} />);

    await user.click(await screen.findByRole("button", { name: /start restock/i }));

    expect(
      await screen.findByRole("button", { name: /review 0 changes/i }),
    ).toBeDisabled();
  });
});
