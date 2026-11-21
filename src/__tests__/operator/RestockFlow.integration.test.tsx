import { describe, it, expect, vi, beforeEach } from "vitest";
import { http, HttpResponse } from "msw";
import { server } from "@/test/server";
import { resetOperatorWriteState } from "@/test/handlers/operator";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import SlotCounter from "@/components/operator/restock/SlotCounter";
import RestockReview from "@/components/operator/restock/RestockReview";
import RestockFlow from "@/components/operator/restock/RestockFlow";
import ToastNotification from "@/components/operator/ToastNotification";
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
  /**
   * MSW rather than a stubbed fetch, so the flow goes through its real client
   * and Zod parsing. The earlier version stubbed fetch and would have passed
   * even if the session payload shape drifted.
   */
  beforeEach(() => {
    window.localStorage.clear();
    resetOperatorWriteState();
    server.use(
      http.get("/api/operator/stores/:id/inventory", () =>
        HttpResponse.json({
          items: [item(), item({ id: "item-2", productName: "Energy Bar" })],
        }),
      ),
      http.post("/api/operator/stores/:id/restock-sessions", () =>
        HttpResponse.json(
          {
            session: {
              id: "session-001",
              storeId: "store-001",
              startedAt: "2026-08-02T15:00:00.000Z",
              completedAt: null,
              actor: null,
              notes: null,
            },
          },
          { status: 201 },
        ),
      ),
    );
  });

  it("opens a session on entry rather than asking a second time", async () => {
    // The regression this covers: InventoryTab's "Start restock" used to lead
    // to another "Start restock" inside the flow, two taps for one action.
    renderWithProviders(<RestockFlow storeId="store-001" onClose={vi.fn()} />);

    expect(await screen.findByText(/slots done/i)).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /^start restock$/i }),
    ).not.toBeInTheDocument();
  });

  it("walks from the slot list into a slot and back", async () => {
    const user = userEvent.setup();
    renderWithProviders(<RestockFlow storeId="store-001" onClose={vi.fn()} />);

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

  describe("resuming a session left in progress", () => {
    const openSession = {
      id: "session-left",
      storeId: "store-001",
      startedAt: "2026-08-02T15:00:00.000Z",
      completedAt: null,
      actor: null,
      notes: null,
    };

    const savedLine = {
      id: "line-1",
      sessionId: "session-left",
      itemId: "item-1",
      expectedQty: 8,
      countedQty: 5,
      added: 4,
      removed: 0,
      removalReason: null,
      resultingStock: null,
      countStatus: "correction",
    };

    async function clickResume() {
      window.localStorage.setItem(
        "operator-restock-session:store-001",
        "session-left",
      );
      const user = userEvent.setup();
      renderWithProviders(
        <>
          <RestockFlow storeId="store-001" onClose={vi.fn()} />
          <ToastNotification />
        </>,
      );
      await user.click(
        await screen.findByRole("button", { name: /resume restock/i }),
      );
    }

    const storedId = () =>
      window.localStorage.getItem("operator-restock-session:store-001");

    it("picks up the slots that were already saved", async () => {
      server.use(
        http.get("/api/operator/restock-sessions/:sessionId", () =>
          HttpResponse.json({ session: openSession, lines: [savedLine] }),
        ),
      );
      await clickResume();

      expect(await screen.findByText(/1 of 2 slots done/i)).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /review 1 change/i }),
      ).toBeEnabled();
    });

    it("lets go of a session the server no longer has", async () => {
      server.use(
        http.get("/api/operator/restock-sessions/:sessionId", () =>
          HttpResponse.json(
            { error: "Restock session not found" },
            { status: 404 },
          ),
        ),
      );
      await clickResume();

      // Dropping it starts a fresh session, so the slot holds a new id.
      await waitFor(() => expect(storedId()).not.toBe("session-left"));
      expect(
        screen.queryByRole("button", { name: /resume restock/i }),
      ).not.toBeInTheDocument();
      // The toast store is a module singleton, so an earlier test's toast can
      // still be up. At least one saying so is what matters.
      expect(
        (await screen.findAllByText(/no longer open/i)).length,
      ).toBeGreaterThan(0);
    });

    it("lets go of a session someone already completed", async () => {
      server.use(
        http.get("/api/operator/restock-sessions/:sessionId", () =>
          HttpResponse.json({
            session: { ...openSession, completedAt: "2026-08-02T16:00:00.000Z" },
            lines: [savedLine],
          }),
        ),
      );
      await clickResume();

      // Dropping it starts a fresh session, so the slot holds a new id.
      await waitFor(() => expect(storedId()).not.toBe("session-left"));
      expect(
        screen.queryByRole("button", { name: /resume restock/i }),
      ).not.toBeInTheDocument();
      // The toast store is a module singleton, so an earlier test's toast can
      // still be up. At least one saying so is what matters.
      expect(
        (await screen.findAllByText(/no longer open/i)).length,
      ).toBeGreaterThan(0);
    });

    it("keeps the session when the server fails, so it can be retried", async () => {
      server.use(
        http.get("/api/operator/restock-sessions/:sessionId", () =>
          HttpResponse.json({ error: "Backend unavailable" }, { status: 502 }),
        ),
      );
      await clickResume();

      expect(await screen.findByRole("alert")).toHaveTextContent(
        /could not load/i,
      );
      expect(
        screen.getByRole("button", { name: /resume restock/i }),
      ).toBeInTheDocument();
      expect(storedId()).toBe("session-left");
    });

    it("keeps the session when the connection drops, so it can be retried", async () => {
      server.use(
        http.get("/api/operator/restock-sessions/:sessionId", () =>
          HttpResponse.error(),
        ),
      );
      await clickResume();

      expect(await screen.findByRole("alert")).toHaveTextContent(
        /could not load/i,
      );
      expect(
        screen.getByRole("button", { name: /resume restock/i }),
      ).toBeInTheDocument();
      expect(storedId()).toBe("session-left");
    });
  });

  it("cannot review until at least one slot was touched", async () => {
    renderWithProviders(<RestockFlow storeId="store-001" onClose={vi.fn()} />);

    expect(
      await screen.findByRole("button", { name: /review 0 changes/i }),
    ).toBeDisabled();
  });
});

describe("SlotCounter steppers and saving", () => {
  const renderCounter = () => {
    const onSave = vi.fn();
    const onCancel = vi.fn();
    render(<SlotCounter item={item()} draft={draftFor(item())} onSave={onSave} onCancel={onCancel} />);
    return { onSave, onCancel, user: userEvent.setup() };
  };

  it("never lets units added go below zero", async () => {
    const { user } = renderCounter();

    await user.click(screen.getByRole("button", { name: /decrease units added/i }));
    // A press that went nowhere leaves no debt: one tap up is exactly one.
    await user.click(screen.getByRole("button", { name: /increase units added/i }));

    expect(screen.getByText(/shelf will hold/i)).toHaveTextContent("9");
  });

  it("never lets units removed go below zero", async () => {
    const { user } = renderCounter();

    await user.click(screen.getByRole("button", { name: /decrease units removed/i }));
    expect(screen.queryByText(/why was it removed/i)).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /increase units removed/i }));
    expect(screen.getByText(/why was it removed/i)).toBeInTheDocument();
    expect(screen.getByText(/shelf will hold/i)).toHaveTextContent("7");
  });

  /** The number shown between the counted quantity's minus and plus buttons. */
  const countedValue = () =>
    screen.getByRole("button", { name: /increase counted quantity/i }).previousElementSibling
      ?.textContent;

  it("starts a count from what the system expects, then steps from there", async () => {
    const { user } = renderCounter();

    await user.click(screen.getByRole("button", { name: /increase counted quantity/i }));
    expect(countedValue()).toBe("9");

    await user.click(screen.getByRole("button", { name: /decrease counted quantity/i }));
    await user.click(screen.getByRole("button", { name: /decrease counted quantity/i }));
    expect(countedValue()).toBe("7");
  });

  it("can't count below zero", async () => {
    const lowItem = item({ currentStock: 0 });
    render(<SlotCounter item={lowItem} draft={draftFor(lowItem)} onSave={vi.fn()} onCancel={vi.fn()} />);

    await userEvent.click(screen.getByRole("button", { name: /decrease counted quantity/i }));

    expect(
      screen.getByRole("button", { name: /increase counted quantity/i }).previousElementSibling,
    ).toHaveTextContent(/^0$/);
  });

  it("saves the whole count, additions and removals as entered", async () => {
    const { user, onSave } = renderCounter();

    await user.click(screen.getByRole("button", { name: /increase counted quantity/i }));
    await user.click(screen.getByRole("button", { name: /increase units added/i }));
    await user.click(screen.getByRole("button", { name: /increase units added/i }));
    await user.click(screen.getByRole("button", { name: /increase units removed/i }));
    await user.click(screen.getByRole("radio", { name: /damaged/i }));
    await user.click(screen.getByRole("button", { name: /save slot/i }));

    expect(onSave).toHaveBeenCalledExactlyOnceWith({
      itemId: "item-1",
      expectedQty: 8,
      countedQty: 9,
      added: 2,
      removed: 1,
      removalReason: "damaged",
    });
  });

  it("goes back without saving on Cancel", async () => {
    const { user, onSave, onCancel } = renderCounter();
    await user.click(screen.getByRole("button", { name: /increase units added/i }));

    await user.click(screen.getByRole("button", { name: /cancel/i }));

    expect(onCancel).toHaveBeenCalledOnce();
    expect(onSave).not.toHaveBeenCalled();
  });

  it("drops the missing-reason warning once a reason is picked", async () => {
    const { user } = renderCounter();
    await user.click(screen.getByRole("button", { name: /increase units removed/i }));
    await user.click(screen.getByRole("button", { name: /save slot/i }));
    expect(screen.getByText(/pick a reason before saving/i)).toBeInTheDocument();

    await user.click(screen.getByRole("radio", { name: /other/i }));

    expect(screen.queryByText(/pick a reason before saving/i)).not.toBeInTheDocument();
  });
});

describe("RestockReview details", () => {
  const untouched = draftFor(item({ id: "item-3", productName: "Untouched Chips" }));
  const touchedDrafts = [
    { ...draftFor(item()), countedQty: 8, added: 4, removed: 1, removalReason: "expired" as const },
    untouched,
  ];
  const itemsById = new Map([
    ["item-1", item()],
    ["item-3", item({ id: "item-3", productName: "Untouched Chips" })],
  ]);

  const renderReview = (props: Partial<React.ComponentProps<typeof RestockReview>> = {}) => {
    const onComplete = vi.fn();
    const onBack = vi.fn();
    render(
      <RestockReview
        drafts={touchedDrafts}
        itemsById={itemsById}
        isCompleting={false}
        error={null}
        onComplete={onComplete}
        onBack={onBack}
        {...props}
      />,
    );
    return { onComplete, onBack };
  };

  it("lists only the slots that changed, with what changed and where the shelf ends up", () => {
    renderReview();

    expect(screen.getByRole("heading", { name: "Review 1 change" })).toBeInTheDocument();
    expect(screen.getByText("Greek Yogurt Cup")).toBeInTheDocument();
    expect(screen.queryByText("Untouched Chips")).not.toBeInTheDocument();
    expect(screen.getByText(/\+4/)).toBeInTheDocument();
    expect(screen.getByText(/−1 \(expired\)/)).toBeInTheDocument();
    // 8 expected + 4 added - 1 removed
    expect(screen.getByText("11/12")).toBeInTheDocument();
  });

  it("totals what came off the shelves by reason", () => {
    renderReview();

    expect(screen.getByText(/1 unit came off the shelves: 1 expired/i)).toBeInTheDocument();
  });

  it("sends no notes at all when the notes box was left blank", async () => {
    const { onComplete } = renderReview();

    await userEvent.type(screen.getByLabelText(/notes/i), "   ");
    await userEvent.click(screen.getByRole("button", { name: /complete restock/i }));

    expect(onComplete).toHaveBeenCalledExactlyOnceWith(null);
  });

  it("goes back to the list on Back", async () => {
    const { onBack } = renderReview();

    await userEvent.click(screen.getByRole("button", { name: /back/i }));

    expect(onBack).toHaveBeenCalledOnce();
  });

  it("can't complete a restock with nothing changed", () => {
    renderReview({ drafts: [untouched] });

    expect(screen.getByText(/no slots were counted or changed/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /complete restock/i })).toBeDisabled();
  });

  it("shows it is completing, and can't be pressed again meanwhile", () => {
    renderReview({ isCompleting: true });

    expect(screen.getByRole("button", { name: "Completing…" })).toBeDisabled();
  });
});

describe("RestockFlow counting through to completion", () => {
  type SavedLine = { itemId: string; body: Record<string, unknown> };

  beforeEach(() => {
    window.localStorage.clear();
    resetOperatorWriteState();
  });

  /** A server that remembers each line it was sent and each completion. */
  function installSessionServer({ completeStatus = 200 }: { completeStatus?: number } = {}) {
    const saved: SavedLine[] = [];
    const completions: unknown[] = [];
    server.use(
      http.get("/api/operator/stores/:id/inventory", () =>
        HttpResponse.json({ items: [item(), item({ id: "item-2", productName: "Energy Bar" })] }),
      ),
      http.post("/api/operator/stores/:id/restock-sessions", () =>
        HttpResponse.json(
          {
            session: {
              id: "session-777",
              storeId: "store-001",
              startedAt: "2026-08-02T15:00:00.000Z",
              completedAt: null,
              actor: null,
              notes: null,
            },
          },
          { status: 201 },
        ),
      ),
      http.put("/api/operator/restock-sessions/:sessionId/lines/:itemId", async ({ params, request }) => {
        const body = (await request.json()) as Record<string, unknown>;
        saved.push({ itemId: String(params.itemId), body });
        return HttpResponse.json({
          line: {
            id: "line-1",
            sessionId: String(params.sessionId),
            itemId: String(params.itemId),
            ...body,
            resultingStock: null,
            countStatus: "not-counted",
          },
        });
      }),
      http.post("/api/operator/restock-sessions/:sessionId/complete", async ({ request }) => {
        completions.push(await request.json());
        return completeStatus === 200
          ? HttpResponse.json({ ok: true })
          : HttpResponse.json({ error: "Could not finish the restock." }, { status: completeStatus });
      }),
    );
    return { saved, completions };
  }

  /** Opens the first slot, adds two units and saves it. */
  async function addTwoToTheFirstSlot(user: ReturnType<typeof userEvent.setup>) {
    await user.click(await screen.findByRole("button", { name: /greek yogurt cup/i }));
    await user.click(await screen.findByRole("button", { name: /increase units added/i }));
    await user.click(screen.getByRole("button", { name: /increase units added/i }));
    await user.click(screen.getByRole("button", { name: /save slot/i }));
  }

  it("pushes a saved slot to the session and counts it as done", async () => {
    const { saved } = installSessionServer();
    const user = userEvent.setup();
    renderWithProviders(<RestockFlow storeId="store-001" onClose={vi.fn()} />);

    await addTwoToTheFirstSlot(user);

    expect(await screen.findByText(/1 of 2 slots done/i)).toBeInTheDocument();
    await waitFor(() => expect(saved).toHaveLength(1));
    expect(saved[0]).toEqual({
      itemId: "item-1",
      body: { expectedQty: 8, countedQty: null, added: 2, removed: 0, removalReason: null },
    });
  });

  it("sends the reason with a removal", async () => {
    const { saved } = installSessionServer();
    const user = userEvent.setup();
    renderWithProviders(<RestockFlow storeId="store-001" onClose={vi.fn()} />);

    await user.click(await screen.findByRole("button", { name: /greek yogurt cup/i }));
    await user.click(await screen.findByRole("button", { name: /increase units removed/i }));
    await user.click(screen.getByRole("radio", { name: /expired/i }));
    await user.click(screen.getByRole("button", { name: /save slot/i }));

    await waitFor(() => expect(saved).toHaveLength(1));
    expect(saved[0].body).toMatchObject({ removed: 1, removalReason: "expired" });
  });

  it("does not push a slot that was opened and left untouched", async () => {
    const { saved } = installSessionServer();
    const user = userEvent.setup();
    renderWithProviders(<RestockFlow storeId="store-001" onClose={vi.fn()} />);

    await user.click(await screen.findByRole("button", { name: /greek yogurt cup/i }));
    await user.click(await screen.findByRole("button", { name: /save slot/i }));

    expect(await screen.findByText(/0 of 2 slots done/i)).toBeInTheDocument();
    expect(saved).toEqual([]);
  });

  it("completes the restock with the notes, tells the operator, and closes", async () => {
    const { completions } = installSessionServer();
    const user = userEvent.setup();
    const onClose = vi.fn();
    renderWithProviders(
      <>
        <RestockFlow storeId="store-001" onClose={onClose} />
        <ToastNotification />
      </>,
    );
    await addTwoToTheFirstSlot(user);

    await user.click(await screen.findByRole("button", { name: /review 1 change/i }));
    await user.type(screen.getByLabelText(/notes/i), "  front row rotated ");
    await user.click(screen.getByRole("button", { name: /complete restock/i }));

    await waitFor(() => expect(onClose).toHaveBeenCalledOnce());
    expect(completions).toEqual([{ notes: "front row rotated" }]);
    expect((await screen.findAllByText("Restock complete — 1 slot recorded")).length).toBeGreaterThan(0);
    expect(window.localStorage.getItem("operator-restock-session:store-001")).toBeNull();
  });

  it("keeps the review and the counts when completing fails", async () => {
    installSessionServer({ completeStatus: 500 });
    const user = userEvent.setup();
    const onClose = vi.fn();
    renderWithProviders(<RestockFlow storeId="store-001" onClose={onClose} />);
    await addTwoToTheFirstSlot(user);

    await user.click(await screen.findByRole("button", { name: /review 1 change/i }));
    await user.click(screen.getByRole("button", { name: /complete restock/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent(/could not finish the restock/i);
    expect(onClose).not.toHaveBeenCalled();
    expect(screen.getByText("Greek Yogurt Cup")).toBeInTheDocument();
    expect(window.localStorage.getItem("operator-restock-session:store-001")).toBe("session-777");
  });

  it("pauses without completing", async () => {
    installSessionServer();
    const user = userEvent.setup();
    const onClose = vi.fn();
    renderWithProviders(<RestockFlow storeId="store-001" onClose={onClose} />);

    await user.click(await screen.findByRole("button", { name: /pause/i }));

    expect(onClose).toHaveBeenCalledOnce();
    expect(window.localStorage.getItem("operator-restock-session:store-001")).toBe("session-777");
  });

  it("goes back from review to the list with the counts intact", async () => {
    installSessionServer();
    const user = userEvent.setup();
    renderWithProviders(<RestockFlow storeId="store-001" onClose={vi.fn()} />);
    await addTwoToTheFirstSlot(user);

    await user.click(await screen.findByRole("button", { name: /review 1 change/i }));
    await user.click(screen.getByRole("button", { name: /^back$/i }));

    expect(await screen.findByText(/1 of 2 slots done/i)).toBeInTheDocument();
  });

  it("discards a session left in progress and starts a fresh one in its place", async () => {
    installSessionServer();
    window.localStorage.setItem("operator-restock-session:store-001", "session-old");
    const user = userEvent.setup();
    renderWithProviders(<RestockFlow storeId="store-001" onClose={vi.fn()} />);

    await user.click(await screen.findByRole("button", { name: /discard/i }));

    expect(await screen.findByText(/0 of 2 slots done/i)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /resume restock/i })).not.toBeInTheDocument();
    // The old id is gone and the new session's id took its place.
    expect(window.localStorage.getItem("operator-restock-session:store-001")).toBe("session-777");
  });

  it("forgets the abandoned session on Discard even when a fresh one can't be opened", async () => {
    server.use(
      http.get("/api/operator/stores/:id/inventory", () => HttpResponse.json({ items: [item()] })),
      http.post("/api/operator/stores/:id/restock-sessions", () =>
        HttpResponse.json({ error: "Could not start a restock." }, { status: 500 }),
      ),
    );
    window.localStorage.setItem("operator-restock-session:store-001", "session-old");
    renderWithProviders(<RestockFlow storeId="store-001" onClose={vi.fn()} />);

    await userEvent.click(await screen.findByRole("button", { name: /discard/i }));

    expect(window.localStorage.getItem("operator-restock-session:store-001")).toBeNull();
    expect(await screen.findByRole("alert")).toHaveTextContent(/could not start a restock/i);
  });

  it("says there is nothing to restock for a store with no products", async () => {
    server.use(
      http.get("/api/operator/stores/:id/inventory", () => HttpResponse.json({ items: [] })),
    );
    const onClose = vi.fn();
    renderWithProviders(<RestockFlow storeId="store-001" onClose={onClose} />);

    await userEvent.click(await screen.findByRole("button", { name: /back to inventory/i }));

    expect(screen.getByText(/nothing on the planogram to restock/i)).toBeInTheDocument();
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("offers a retry when a session couldn't be opened", async () => {
    server.use(
      http.get("/api/operator/stores/:id/inventory", () =>
        HttpResponse.json({ items: [item()] }),
      ),
      http.post("/api/operator/stores/:id/restock-sessions", () =>
        HttpResponse.json({ error: "Could not start a restock." }, { status: 500 }),
      ),
    );
    renderWithProviders(<RestockFlow storeId="store-001" onClose={vi.fn()} />);

    expect(await screen.findByRole("alert")).toHaveTextContent(/could not start a restock/i);
    expect(screen.getByRole("button", { name: "Retry" })).toBeInTheDocument();
  });
});
