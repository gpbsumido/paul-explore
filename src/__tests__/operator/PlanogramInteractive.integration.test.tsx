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

// A controlled store so assertions are deterministic.
const items = [
  buildInventoryItem({ id: "it-cola", productName: "Cola", storeId: STORE_ID }),
  buildInventoryItem({ id: "it-water", productName: "Water", storeId: STORE_ID }),
  buildInventoryItem({ id: "it-chips", productName: "Chips", storeId: STORE_ID }),
];

let slots: { itemId: string; sensorMatch: boolean }[];

function installHandlers() {
  server.use(
    http.get(`/api/operator/stores/${STORE_ID}/inventory`, () =>
      HttpResponse.json({ items }),
    ),
    http.get(`/api/operator/stores/${STORE_ID}/planogram`, () =>
      HttpResponse.json({ slots }),
    ),
    http.patch(`/api/operator/stores/${STORE_ID}/planogram`, async ({ request }) => {
      const body = (await request.json()) as {
        order?: string[];
        resyncItemId?: string;
      };
      if (body.order) {
        const byId = new Map(slots.map((s) => [s.itemId, s]));
        slots = body.order
          .map((id) => byId.get(id))
          .filter((s): s is (typeof slots)[number] => s !== undefined);
      } else if (body.resyncItemId) {
        slots = slots.map((s) =>
          s.itemId === body.resyncItemId ? { ...s, sensorMatch: true } : s,
        );
      }
      return HttpResponse.json({ slots });
    }),
  );
}

beforeEach(() => {
  slots = [
    { itemId: "it-cola", sensorMatch: true },
    { itemId: "it-water", sensorMatch: false },
    { itemId: "it-chips", sensorMatch: true },
  ];
  installHandlers();
});

describe("PlanogramTab rearranging", () => {
  it("moves a product to the next slot when its move-right control is used", async () => {
    const user = userEvent.setup();
    const { container } = render(<PlanogramTab storeId={STORE_ID} />, {
      wrapper: makeWrapper(),
    });
    const view = within(container);

    // Cola starts in slot A1 — its move-right control is the first one.
    const colaMoveRight = await view.findByRole("button", {
      name: /move cola to the next slot/i,
    });
    await user.click(colaMoveRight);

    // After the move, order is [Water, Cola, Chips] so the first move-right
    // control now belongs to Water.
    await waitFor(() => {
      const moveRight = view.getAllByRole("button", {
        name: /to the next slot/i,
      });
      expect(moveRight[0].getAttribute("aria-label")).toMatch(/water/i);
    });
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

    await waitFor(() => {
      expect(
        view.queryByRole("button", { name: /re-sync sensor for water/i }),
      ).not.toBeInTheDocument();
    });
    expect(view.queryByText("Mismatch")).not.toBeInTheDocument();
  });
});
