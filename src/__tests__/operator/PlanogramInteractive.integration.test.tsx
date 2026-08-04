import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { http, HttpResponse } from "msw";
import type { ReactNode } from "react";
import { server } from "@/test/server";
import { ToastProvider } from "@/contexts/ToastContext";
import PlanogramTab from "@/components/operator/PlanogramTab";
import { buildInventoryItem } from "@/test/factories/operator";

const STORE_ID = "store-plano-1";

function makeWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <ToastProvider>{children}</ToastProvider>
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

    // A3 is now empty (Chips left it for A4).
    await waitFor(() =>
      expect(view.getByLabelText("Empty box A3")).toBeInTheDocument(),
    );
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
