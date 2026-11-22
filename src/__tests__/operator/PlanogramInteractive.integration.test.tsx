import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MutationCache, QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@paul-portfolio/react";
import { notifyMutationError } from "@/lib/mutationErrorToast";
import { http, HttpResponse } from "msw";
import type { ReactNode } from "react";
import { server } from "@/test/server";
import { ToastProvider } from "@/contexts/ToastContext";
import PlanogramTab from "@/components/operator/PlanogramTab";
import ToastNotification from "@/components/operator/ToastNotification";
import { buildInventoryItem } from "@/test/factories/operator";

const STORE_ID = "store-plano-1";

function makeWrapper() {
  // Same wiring as providers.tsx: a failed write is toasted once, app-wide.
  const queryClient = new QueryClient({
    mutationCache: new MutationCache({
      onError: (error, _variables, _context, mutation) =>
        notifyMutationError(error, mutation.meta),
    }),
    defaultOptions: { queries: { retry: false } },
  });
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <ToastProvider>
          {children}
          <ToastNotification />
        </ToastProvider>
        <Toaster />
      </QueryClientProvider>
    );
  };
}

// A controlled store with three products and one trailing empty box.
const items = [
  buildInventoryItem({ id: "it-cola", productName: "Cola", storeId: STORE_ID }),
  buildInventoryItem({ id: "it-water", productName: "Water", storeId: STORE_ID }),
  buildInventoryItem({ id: "it-chips", productName: "Chips", storeId: STORE_ID }),
];

type Box = { itemId: string | null; sensorMatch: boolean };
let slots: Box[];

function installHandlers() {
  server.use(
    http.get(`/api/operator/stores/${STORE_ID}/inventory`, () =>
      HttpResponse.json({ items }),
    ),
    http.get(`/api/operator/stores/${STORE_ID}/planogram`, () =>
      HttpResponse.json({ slots }),
    ),
    http.patch(
      `/api/operator/stores/${STORE_ID}/planogram`,
      async ({ request }) => {
        const body = (await request.json()) as {
          boxes?: Box[];
          resyncItemId?: string;
        };
        if (body.boxes) {
          slots = body.boxes.map((b) => ({ ...b }));
        } else if (body.resyncItemId) {
          slots = slots.map((s) =>
            s.itemId === body.resyncItemId ? { ...s, sensorMatch: true } : s,
          );
        }
        return HttpResponse.json({ slots });
      },
    ),
  );
}

/** The address (A1, B2...) printed on the box holding this product. */
function boxLabel(view: ReturnType<typeof within>, productName: string): string | null | undefined {
  return view.getByText(productName, { selector: "p" }).nextElementSibling?.textContent;
}

beforeEach(() => {
  slots = [
    { itemId: "it-cola", sensorMatch: true },
    { itemId: "it-water", sensorMatch: false },
    { itemId: "it-chips", sensorMatch: true },
    { itemId: null, sensorMatch: true },
  ];
  installHandlers();
});

describe("PlanogramTab moving into an empty box", () => {
  it("vacates the source box when a product moves into the empty box", async () => {
    const user = userEvent.setup();
    const { container } = render(<PlanogramTab storeId={STORE_ID} />, {
      wrapper: makeWrapper(),
    });
    const view = within(container);

    // Chips sits in A3; A4 is empty. Move Chips to the next box (A4).
    const chipsMoveRight = await view.findByRole("button", {
      name: /move chips to the next box/i,
    });
    await user.click(chipsMoveRight);

    // A3 is now empty (Chips left it for A4), and the move was saved.
    await waitFor(() =>
      expect(view.getByLabelText("Empty box A3")).toBeInTheDocument(),
    );
    expect(view.queryByLabelText("Empty box A4")).not.toBeInTheDocument();
    expect(boxLabel(view, "Chips")).toBe("A4");
    expect(slots.map((b) => b.itemId)).toEqual(["it-cola", "it-water", null, "it-chips"]);
  });

  it("swaps two products when one is moved onto the other", async () => {
    const user = userEvent.setup();
    const { container } = render(<PlanogramTab storeId={STORE_ID} />, {
      wrapper: makeWrapper(),
    });
    const view = within(container);

    await user.click(await view.findByRole("button", { name: /move cola to the next box/i }));

    await waitFor(() =>
      expect(slots.map((b) => b.itemId)).toEqual(["it-water", "it-cola", "it-chips", null]),
    );
    expect(boxLabel(view, "Water")).toBe("A1");
    expect(boxLabel(view, "Cola")).toBe("A2");
  });

  it("can't move the first product earlier or the last product later", async () => {
    const user = userEvent.setup();
    const { container } = render(<PlanogramTab storeId={STORE_ID} />, {
      wrapper: makeWrapper(),
    });
    const view = within(container);

    expect(await view.findByRole("button", { name: /move cola to the previous box/i })).toBeDisabled();
    const chipsNext = view.getByRole("button", { name: /move chips to the next box/i });
    expect(chipsNext).toBeEnabled();

    // Chips now sits in the final box, with nowhere further to go.
    await user.click(chipsNext);
    await waitFor(() =>
      expect(view.getByRole("button", { name: /move chips to the next box/i })).toBeDisabled(),
    );
  });

  it("tells the operator when a move couldn't be saved", async () => {
    server.use(
      http.patch(`/api/operator/stores/${STORE_ID}/planogram`, () =>
        HttpResponse.json({ error: "The shelf didn't save" }, { status: 500 }),
      ),
    );
    const user = userEvent.setup();
    const { container } = render(<PlanogramTab storeId={STORE_ID} />, {
      wrapper: makeWrapper(),
    });

    await user.click(await within(container).findByRole("button", { name: /move chips to the next box/i }));

    expect(await screen.findByText("The shelf didn't save")).toBeInTheDocument();
    expect(screen.getAllByText("The shelf didn't save")).toHaveLength(1);
    expect(screen.queryByText("Failed to move product")).not.toBeInTheDocument();
    expect(within(container).getByLabelText("Empty box A4")).toBeInTheDocument();
  });
});

describe("PlanogramTab resolving a sensor mismatch", () => {
  it("clears the mismatch when the slot is re-synced", async () => {
    const user = userEvent.setup();
    const { container } = render(<PlanogramTab storeId={STORE_ID} />, {
      wrapper: makeWrapper(),
    });
    const view = within(container);

    const resync = await view.findByRole("button", {
      name: /re-sync sensor for water/i,
    });
    await user.click(resync);

    await waitFor(() =>
      expect(
        view.queryByRole("button", { name: /re-sync sensor for water/i }),
      ).not.toBeInTheDocument(),
    );
    expect(view.queryByText("Mismatch")).not.toBeInTheDocument();
  });
});

describe("PlanogramTab layout and refill run", () => {
  it("counts the sensor mismatches and sends the re-sync for the right product", async () => {
    const user = userEvent.setup();
    const { container } = render(<PlanogramTab storeId={STORE_ID} />, {
      wrapper: makeWrapper(),
    });
    const view = within(container);

    expect(await view.findByText("1 sensor mismatch")).toBeInTheDocument();
    await user.click(view.getByRole("button", { name: /re-sync sensor for water/i }));

    await waitFor(() => expect(slots.find((b) => b.itemId === "it-water")?.sensorMatch).toBe(true));
    expect(slots.filter((b) => !b.sensorMatch)).toEqual([]);
  });

  it("tells the operator when a re-sync couldn't be saved", async () => {
    server.use(
      http.patch(`/api/operator/stores/${STORE_ID}/planogram`, () =>
        HttpResponse.json({ error: "The sensor didn't re-sync" }, { status: 500 }),
      ),
    );
    const user = userEvent.setup();
    const { container } = render(<PlanogramTab storeId={STORE_ID} />, {
      wrapper: makeWrapper(),
    });

    await user.click(await within(container).findByRole("button", { name: /re-sync sensor for water/i }));

    expect(await screen.findByText("The sensor didn't re-sync")).toBeInTheDocument();
    expect(screen.getAllByText("The sensor didn't re-sync")).toHaveLength(1);
    expect(screen.queryByText("Failed to re-sync sensor")).not.toBeInTheDocument();
    expect(within(container).getByText("Mismatch")).toBeInTheDocument();
  });

  it("lists the slots to refill, emptiest first, and leaves healthy ones out", async () => {
    const stocked = [
      buildInventoryItem({ id: "it-cola", productName: "Cola", storeId: STORE_ID, currentStock: 5, capacity: 12 }),
      buildInventoryItem({ id: "it-water", productName: "Water", storeId: STORE_ID, currentStock: 1, capacity: 12 }),
      buildInventoryItem({ id: "it-chips", productName: "Chips", storeId: STORE_ID, currentStock: 12, capacity: 12 }),
    ];
    server.use(
      http.get(`/api/operator/stores/${STORE_ID}/inventory`, () => HttpResponse.json({ items: stocked })),
    );
    const { container } = render(<PlanogramTab storeId={STORE_ID} />, {
      wrapper: makeWrapper(),
    });
    const view = within(container);

    const refill = (await view.findByText("Refill run")).closest("div")?.parentElement as HTMLElement;
    await waitFor(() => expect(within(refill).getAllByRole("listitem")).toHaveLength(2));

    const rows = within(refill).getAllByRole("listitem").map((li) => li.textContent);
    expect(rows).toEqual(["A2Water1/12", "A1Cola5/12"]);
    expect(within(refill).getByText("2 slots to refill")).toBeInTheDocument();
  });

  it("says every stocked slot is healthy when nothing needs refilling", async () => {
    const full = items.map((item) => ({ ...item, currentStock: item.capacity }));
    server.use(
      http.get(`/api/operator/stores/${STORE_ID}/inventory`, () => HttpResponse.json({ items: full })),
    );
    const { container } = render(<PlanogramTab storeId={STORE_ID} />, {
      wrapper: makeWrapper(),
    });

    expect(await within(container).findByText(/nothing to refill/i)).toBeInTheDocument();
  });

  it("says there is no planogram data for a store with no boxes", async () => {
    slots = [];
    const { container } = render(<PlanogramTab storeId={STORE_ID} />, {
      wrapper: makeWrapper(),
    });

    expect(await within(container).findByText("No planogram data available.")).toBeInTheDocument();
  });

  it("shows the error rather than an empty store when the layout fails to load", async () => {
    server.use(
      http.get(`/api/operator/stores/${STORE_ID}/planogram`, () =>
        HttpResponse.json({ error: "down" }, { status: 500 }),
      ),
    );
    const { container } = render(<PlanogramTab storeId={STORE_ID} />, {
      wrapper: makeWrapper(),
    });

    expect(await within(container).findByText("Failed to fetch planogram")).toBeInTheDocument();
    expect(within(container).queryByText("No planogram data available.")).not.toBeInTheDocument();
  });
});
