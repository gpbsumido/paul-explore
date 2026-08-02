import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import PromotionsPanel from "@/components/operator/promotions/PromotionsPanel";
import { ToastProvider } from "@/contexts/ToastContext";
import type { InventoryItem, Promotion } from "@/types/operator";

const items: InventoryItem[] = [
  {
    id: "item-1",
    storeId: "store-001",
    productName: "Energy Bar",
    category: "snacks",
    currentStock: 8,
    capacity: 12,
    price: 2.99,
    lastRestocked: "2026-08-01T12:00:00.000Z",
  },
];

const promo = (over: Partial<Promotion> = {}): Promotion => ({
  id: "promo-1",
  storeId: "store-001",
  productName: "Energy Bar",
  percent: 20,
  startsAt: "2026-01-01T00:00:00.000Z",
  endsAt: null,
  status: "active",
  ...over,
});

function renderPanel(promotions: Promotion[], percent = 20) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string, init?: RequestInit) => {
      if (String(url).includes("/promotions") && init?.method === "POST") {
        return new Response(JSON.stringify({ promotion: promo() }), {
          status: 201,
        });
      }
      if (String(url).includes("/end")) {
        return new Response(
          JSON.stringify({ promotion: promo({ endsAt: "2026-01-02T00:00:00.000Z" }) }),
          { status: 200 },
        );
      }
      if (String(url).includes("/performance")) {
        return new Response(
          JSON.stringify({
            window: { units: 40, revenue: 96 },
            baseline: { units: 25, revenue: 75 },
            unitsChangePercent: 60,
            revenueChangePercent: 28,
            measuredFrom: "2026-01-01T00:00:00.000Z",
            measuredTo: "2026-01-11T00:00:00.000Z",
            note: "Comparison against the equal-length period before this promotion. It is not a claim that the promotion caused the difference.",
          }),
          { status: 200 },
        );
      }
      if (String(url).includes("/promotions")) {
        return new Response(JSON.stringify({ promotions }), { status: 200 });
      }
      return new Response(JSON.stringify({}), { status: 200 });
    }),
  );

  return render(
    <QueryClientProvider client={client}>
      <ToastProvider>
        <PromotionsPanel
          storeId="store-001"
          items={items}
          modelledPercent={percent}
          modelledProduct="Energy Bar"
        />
      </ToastProvider>
    </QueryClientProvider>,
  );
}

afterEach(() => vi.unstubAllGlobals());

describe("PromotionsPanel", () => {
  beforeEach(() => vi.useRealTimers());

  it("says what it is for: the calculator predicts, these run", async () => {
    renderPanel([]);
    expect(
      await screen.findByText(/the calculator above predicts/i),
    ).toBeInTheDocument();
  });

  it("shows an empty state pointing back at the calculator", async () => {
    renderPanel([]);
    expect(
      await screen.findByText(/model a discount above, then schedule it/i),
    ).toBeInTheDocument();
  });

  it("lists a scheduled promotion with a derived status", async () => {
    renderPanel([promo()]);
    expect(await screen.findByText("20% off Energy Bar")).toBeInTheDocument();
    expect(screen.getByText("active")).toBeInTheDocument();
  });

  it("derives status from the window rather than the payload", async () => {
    // The server said active; the window says it finished. The UI must not
    // keep calling a finished promotion live just because a tab stayed open.
    renderPanel([
      promo({ status: "active", endsAt: "2026-01-02T00:00:00.000Z" }),
    ]);
    expect(await screen.findByText("ended")).toBeInTheDocument();
  });

  it("does not offer to end an already-ended promotion", async () => {
    renderPanel([promo({ endsAt: "2026-01-02T00:00:00.000Z" })]);
    await screen.findByText("ended");
    expect(screen.queryByRole("button", { name: /^end$/i })).not.toBeInTheDocument();
  });

  it("pre-fills the form from whatever the calculator is modelling", async () => {
    const user = userEvent.setup();
    renderPanel([], 30);

    await user.click(await screen.findByRole("button", { name: /schedule this/i }));

    expect(screen.getByRole("button", { name: "30%" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByRole("button", { name: "Energy Bar" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  it("refuses an end date that is not after the start", async () => {
    const user = userEvent.setup();
    renderPanel([]);

    await user.click(await screen.findByRole("button", { name: /schedule this/i }));
    await user.clear(screen.getByLabelText(/^starts$/i));
    await user.type(screen.getByLabelText(/^starts$/i), "2026-09-10T10:00");
    await user.type(screen.getByLabelText(/ends/i), "2026-09-01T10:00");
    await user.click(screen.getByRole("button", { name: /^schedule \d+% off$/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      /end must be after the start/i,
    );
  });

  it("names the timezone a promotion window is measured in", async () => {
    const user = userEvent.setup();
    renderPanel([]);

    await user.click(await screen.findByRole("button", { name: /schedule this/i }));
    expect(screen.getByText(/days start at midnight in/i)).toBeInTheDocument();
  });

  it("says performance is a comparison, not proof of cause", async () => {
    renderPanel([promo()]);
    await waitFor(() =>
      expect(
        screen.getByText(/not proof it caused the change/i),
      ).toBeInTheDocument(),
    );
  });
});

describe("PromotionPerformance in the panel", () => {
  it("does not offer results for a promotion that has not started", async () => {
    renderPanel([promo({ startsAt: "2030-01-01T00:00:00.000Z", endsAt: null })]);
    await screen.findByText("scheduled");
    expect(
      screen.queryByRole("button", { name: /results/i }),
    ).not.toBeInTheDocument();
  });

  it("fetches nothing until results are opened", async () => {
    renderPanel([promo()]);
    await screen.findByRole("button", { name: /^results$/i });

    const calls = (global.fetch as unknown as { mock: { calls: unknown[][] } })
      .mock.calls;
    expect(
      calls.filter((c) => String(c[0]).includes("/performance")),
    ).toHaveLength(0);
  });

  it("shows before and during side by side, not just the delta", async () => {
    const user = userEvent.setup();
    renderPanel([promo()]);

    await user.click(await screen.findByRole("button", { name: /^results$/i }));

    expect(await screen.findByText("25")).toBeInTheDocument();
    expect(screen.getByText("40")).toBeInTheDocument();
    expect(screen.getByText(/up 60%/i)).toBeInTheDocument();
  });

  it("carries the not-attribution caveat into the readout", async () => {
    const user = userEvent.setup();
    renderPanel([promo()]);

    await user.click(await screen.findByRole("button", { name: /^results$/i }));
    expect(
      await screen.findByText(/not a claim that the promotion caused/i),
    ).toBeInTheDocument();
  });

  it("says no baseline rather than inventing a percentage", async () => {
    const user = userEvent.setup();
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string) => {
        if (String(url).includes("/performance")) {
          return new Response(
            JSON.stringify({
              window: { units: 12, revenue: 30 },
              baseline: { units: 0, revenue: 0 },
              unitsChangePercent: null,
              revenueChangePercent: null,
              measuredFrom: "2026-01-01T00:00:00.000Z",
              measuredTo: "2026-01-11T00:00:00.000Z",
              note: "Comparison against the equal-length period before this promotion.",
            }),
            { status: 200 },
          );
        }
        return new Response(JSON.stringify({ promotions: [promo()] }), {
          status: 200,
        });
      }),
    );

    render(
      <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
        <ToastProvider>
          <PromotionsPanel
            storeId="store-001"
            items={items}
            modelledPercent={20}
            modelledProduct="Energy Bar"
          />
        </ToastProvider>
      </QueryClientProvider>,
    );

    await user.click(await screen.findByRole("button", { name: /^results$/i }));
    expect(await screen.findAllByText(/no baseline/i)).toHaveLength(2);
  });
});
