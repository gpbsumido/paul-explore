import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { http, HttpResponse } from "msw";
import { server } from "@/test/server";
import { resetOperatorWriteState } from "@/test/handlers/operator";

import PromotionsPanel from "@/components/operator/promotions/PromotionsPanel";
import { ToastProvider } from "@/contexts/ToastContext";
import ToastNotification from "@/components/operator/ToastNotification";
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

const PERFORMANCE = {
  window: { units: 40, revenue: 96 },
  baseline: { units: 25, revenue: 75 },
  unitsChangePercent: 60,
  revenueChangePercent: 28,
  measuredFrom: "2026-01-01T00:00:00.000Z",
  measuredTo: "2026-01-11T00:00:00.000Z",
  note: "Comparison against the equal-length period before this promotion. It is not a claim that the promotion caused the difference.",
};

/**
 * Rendered against MSW rather than a stubbed fetch, so the component goes
 * through its real client, react-query and Zod parsing. Stubbing fetch would
 * skip all three and pass even if the payload shape drifted.
 */
function renderPanel(
  promotions: Promotion[],
  percent = 20,
  performance: Record<string, unknown> = PERFORMANCE,
  { listFails = false }: { listFails?: boolean } = {},
) {
  server.use(
    http.get("/api/operator/stores/:id/promotions", () =>
      listFails
        ? HttpResponse.json({ error: "down" }, { status: 500 })
        : HttpResponse.json({ promotions }),
    ),
    http.post("/api/operator/stores/:id/promotions", () =>
      HttpResponse.json({ promotion: promo() }, { status: 201 }),
    ),
    http.patch("/api/operator/promotions/:id/end", () =>
      HttpResponse.json({
        promotion: promo({ endsAt: "2026-01-02T00:00:00.000Z" }),
      }),
    ),
    http.get("/api/operator/promotions/:id/performance", () =>
      HttpResponse.json({ promotion: promo(), ...performance }),
    ),
  );

  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <ToastProvider>
        <ToastNotification />
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

beforeEach(() => resetOperatorWriteState());

describe("PromotionsPanel", () => {
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

  it("refuses an end date equal to the start, since that window is empty", async () => {
    const user = userEvent.setup();
    renderPanel([]);

    await user.click(await screen.findByRole("button", { name: /schedule this/i }));
    await user.clear(screen.getByLabelText(/^starts$/i));
    await user.type(screen.getByLabelText(/^starts$/i), "2026-09-10T10:00");
    await user.type(screen.getByLabelText(/ends/i), "2026-09-10T10:00");
    await user.click(screen.getByRole("button", { name: /^schedule \d+% off$/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent(/end must be after the start/i);
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
  const requested: string[] = [];
  const record = ({ request }: { request: Request }) => {
    requested.push(request.url);
  };
  beforeEach(() => {
    requested.length = 0;
    server.events.on("request:start", record);
  });
  afterEach(() => {
    server.events.removeListener("request:start", record);
  });

  it("does not offer results for a promotion that has not started", async () => {
    renderPanel([promo({ startsAt: "2030-01-01T00:00:00.000Z", endsAt: null })]);
    await screen.findByText("scheduled");
    expect(
      screen.queryByRole("button", { name: /results/i }),
    ).not.toBeInTheDocument();
  });

  it("fetches nothing until results are opened", async () => {
    // Performance is per-promotion, so opening the tab must not fire a query
    // for every promotion a store has ever run.
    renderPanel([promo()]);
    await screen.findByRole("button", { name: /^results$/i });
    // Let anything the mount was going to fire land before counting.
    await screen.findByText(/running now/i);

    expect(requested.filter((u) => u.includes("/performance"))).toHaveLength(0);
  });

  it("shows before and during side by side, not just the delta", async () => {
    const user = userEvent.setup();
    renderPanel([promo()]);

    await user.click(await screen.findByRole("button", { name: /^results$/i }));

    expect(await screen.findByText("25")).toBeInTheDocument();
    expect(screen.getByText("40")).toBeInTheDocument();
    expect(screen.getByText(/up 60%/i)).toBeInTheDocument();
  });

  it("hides the results again when the toggle is pressed a second time", async () => {
    const user = userEvent.setup();
    renderPanel([promo()]);

    await user.click(await screen.findByRole("button", { name: /^results$/i }));
    await screen.findByText("25");
    await user.click(screen.getByRole("button", { name: /hide results/i }));

    expect(screen.queryByText("25")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^results$/i })).toBeInTheDocument();
  });

  it("carries the not-attribution caveat into the readout", async () => {
    const user = userEvent.setup();
    renderPanel([promo()]);

    await user.click(await screen.findByRole("button", { name: /^results$/i }));
    expect(
      await screen.findByText(/not a claim that the promotion caused/i),
    ).toBeInTheDocument();
  });

  it("says down, not up, when a promotion sold less than the period before", async () => {
    const user = userEvent.setup();
    renderPanel([promo()], 20, {
      ...PERFORMANCE,
      unitsChangePercent: -15,
      revenueChangePercent: 0,
    });

    await user.click(await screen.findByRole("button", { name: /^results$/i }));

    expect(await screen.findByText("down 15%")).toBeInTheDocument();
    expect(screen.getByText("flat 0%")).toBeInTheDocument();
  });

  it("says the readout couldn't be loaded instead of leaving it blank", async () => {
    const user = userEvent.setup();
    renderPanel([promo()]);
    server.use(
      http.get("/api/operator/promotions/:id/performance", () =>
        HttpResponse.json({ error: "down" }, { status: 500 }),
      ),
    );

    await user.click(await screen.findByRole("button", { name: /^results$/i }));

    expect(await screen.findByText("Could not load performance for this one.")).toBeInTheDocument();
  });

  it("says no baseline rather than inventing a percentage", async () => {
    const user = userEvent.setup();
    renderPanel([promo()], 20, {
      window: { units: 12, revenue: 30 },
      baseline: { units: 0, revenue: 0 },
      unitsChangePercent: null,
      revenueChangePercent: null,
      measuredFrom: "2026-01-01T00:00:00.000Z",
      measuredTo: "2026-01-11T00:00:00.000Z",
      note: "Comparison against the equal-length period before this promotion.",
    });

    await user.click(await screen.findByRole("button", { name: /^results$/i }));
    // Both rows, rather than a fabricated 0% or Infinity.
    expect(await screen.findAllByText(/no baseline/i)).toHaveLength(2);
  });
});

/** What withOperatorErrors answers when a write ran out of time. */
const TIMED_OUT =
  "The operator API didn't answer in time. The change may have been saved, so reload before trying again.";
/** What withOperatorErrors answers when the API said no to a write. */
const REJECTED = "The operator API rejected this write (409).";

describe("PromotionsPanel scheduling and ending", () => {
  /** Records the body of every promotion the panel posts. */
  const recordPosts = () => {
    const posted: Record<string, unknown>[] = [];
    server.use(
      http.post("/api/operator/stores/:id/promotions", async ({ request }) => {
        posted.push((await request.json()) as Record<string, unknown>);
        return HttpResponse.json({ promotion: promo() }, { status: 201 });
      }),
    );
    return posted;
  };

  it("schedules the modelled discount for the product, tells the operator, and closes the form", async () => {
    const user = userEvent.setup();
    renderPanel([], 30);
    const posted = recordPosts();

    await user.click(await screen.findByRole("button", { name: /schedule this/i }));
    await user.click(screen.getByRole("button", { name: "Schedule 30% off" }));

    expect(await screen.findByText("Scheduled 30% off Energy Bar")).toBeInTheDocument();
    expect(posted).toEqual([
      expect.objectContaining({ productName: "Energy Bar", percent: 30, endsAt: null }),
    ]);
    expect(typeof posted[0].startsAt).toBe("string");
    expect(screen.queryByRole("button", { name: "Schedule 30% off" })).not.toBeInTheDocument();
  });

  it("schedules the whole store when no product is picked", async () => {
    const user = userEvent.setup();
    renderPanel([], 20);
    const posted = recordPosts();

    await user.click(await screen.findByRole("button", { name: /schedule this/i }));
    await user.click(screen.getByRole("button", { name: "Whole store" }));
    await user.click(screen.getByRole("button", { name: "Schedule 20% off" }));

    expect(await screen.findByText("Scheduled 20% off everything")).toBeInTheDocument();
    expect(posted[0]).toMatchObject({ productName: null, percent: 20 });
  });

  it("sends an end date as an ISO timestamp after the start", async () => {
    const user = userEvent.setup();
    renderPanel([], 20);
    const posted = recordPosts();

    await user.click(await screen.findByRole("button", { name: /schedule this/i }));
    await user.clear(screen.getByLabelText(/^starts$/i));
    await user.type(screen.getByLabelText(/^starts$/i), "2026-09-01T10:00");
    await user.type(screen.getByLabelText(/ends/i), "2026-09-10T10:00");
    await user.click(screen.getByRole("button", { name: "Schedule 20% off" }));

    await waitFor(() => expect(posted).toHaveLength(1));
    expect(posted[0].startsAt).toBe(new Date("2026-09-01T10:00").toISOString());
    expect(posted[0].endsAt).toBe(new Date("2026-09-10T10:00").toISOString());
  });

  it("keeps the form open and gives the server's reason when it refuses the promotion", async () => {
    const user = userEvent.setup();
    renderPanel([], 20);
    server.use(
      http.post("/api/operator/stores/:id/promotions", () =>
        HttpResponse.json({ error: REJECTED }, { status: 409 }),
      ),
    );

    await user.click(await screen.findByRole("button", { name: /schedule this/i }));
    await user.click(screen.getByRole("button", { name: "Schedule 20% off" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(REJECTED);
    expect(screen.getByRole("button", { name: "Schedule 20% off" })).toBeEnabled();
  });

  it("says so when the refusal carries no reason", async () => {
    const user = userEvent.setup();
    renderPanel([], 20);
    server.use(
      http.post("/api/operator/stores/:id/promotions", () => new HttpResponse(null, { status: 502 })),
    );

    await user.click(await screen.findByRole("button", { name: /schedule this/i }));
    await user.click(screen.getByRole("button", { name: "Schedule 20% off" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Could not schedule that promotion.");
  });

  it("closes the form and reloads the list when scheduling timed out, rather than inviting a duplicate", async () => {
    // A 504 means the promotion may exist upstream. Leaving the form open with
    // its button enabled is an invitation to post it twice.
    const user = userEvent.setup();
    renderPanel([], 20);
    let landed = false;
    server.use(
      http.post("/api/operator/stores/:id/promotions", () => {
        landed = true;
        return HttpResponse.json({ error: TIMED_OUT }, { status: 504 });
      }),
      http.get("/api/operator/stores/:id/promotions", () =>
        HttpResponse.json({ promotions: landed ? [promo()] : [] }),
      ),
    );

    await user.click(await screen.findByRole("button", { name: /schedule this/i }));
    await user.click(screen.getByRole("button", { name: "Schedule 20% off" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(TIMED_OUT);
    expect(screen.queryByRole("button", { name: "Schedule 20% off" })).not.toBeInTheDocument();
    expect(await screen.findByText("20% off Energy Bar")).toBeInTheDocument();
  });

  it("ends the promotion whose End button was pressed and refreshes the list", async () => {
    const user = userEvent.setup();
    const ended: string[] = [];
    renderPanel([promo({ id: "promo-9" })]);
    server.use(
      http.patch("/api/operator/promotions/:id/end", ({ params }) => {
        ended.push(String(params.id));
        return HttpResponse.json({ promotion: promo({ id: "promo-9", endsAt: "2026-01-02T00:00:00.000Z" }) });
      }),
      http.get("/api/operator/stores/:id/promotions", () =>
        HttpResponse.json({ promotions: [promo({ id: "promo-9", endsAt: "2026-01-02T00:00:00.000Z" })] }),
      ),
    );

    await user.click(await screen.findByRole("button", { name: /^end$/i }));

    expect(await screen.findByText("Promotion ended")).toBeInTheDocument();
    expect(ended).toEqual(["promo-9"]);
    expect(await screen.findByText("ended")).toBeInTheDocument();
  });

  it("says so when a promotion couldn't be ended", async () => {
    const user = userEvent.setup();
    renderPanel([promo()]);
    server.use(
      http.patch("/api/operator/promotions/:id/end", () => new HttpResponse(null, { status: 502 })),
    );

    await user.click(await screen.findByRole("button", { name: /^end$/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Could not end that promotion.");
    expect(screen.getByText("active")).toBeInTheDocument();
  });

  it("gives the server's reason when it refuses to end a promotion", async () => {
    const user = userEvent.setup();
    renderPanel([promo()]);
    server.use(
      http.patch("/api/operator/promotions/:id/end", () =>
        HttpResponse.json({ error: REJECTED }, { status: 409 }),
      ),
    );

    await user.click(await screen.findByRole("button", { name: /^end$/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent(REJECTED);
  });

  it("says ending may have worked and reloads the list when it timed out", async () => {
    const user = userEvent.setup();
    renderPanel([promo()]);
    let landed = false;
    server.use(
      http.patch("/api/operator/promotions/:id/end", () => {
        landed = true;
        return HttpResponse.json({ error: TIMED_OUT }, { status: 504 });
      }),
      http.get("/api/operator/stores/:id/promotions", () =>
        HttpResponse.json({
          promotions: [landed ? promo({ endsAt: "2026-01-02T00:00:00.000Z" }) : promo()],
        }),
      ),
    );

    await user.click(await screen.findByRole("button", { name: /^end$/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent(TIMED_OUT);
    expect(await screen.findByText("ended")).toBeInTheDocument();
  });

  it("says the promotions couldn't be loaded rather than showing none scheduled", async () => {
    renderPanel([], 20, PERFORMANCE, { listFails: true });

    expect(await screen.findByRole("alert")).toHaveTextContent("Could not load promotions.");
  });
});
