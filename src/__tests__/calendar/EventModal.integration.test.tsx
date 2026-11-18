import { describe, it, expect, vi, beforeEach } from "vitest";
import { http, HttpResponse } from "msw";
import { server } from "@/test/server";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import EventModal from "@/components/calendar/EventModal";
import type { CalendarEvent, EventCard } from "@/types/calendar";
import type { CardResume } from "@/lib/tcg";

// The real search hits the TCG API. A button that picks one card is all these
// tests need from it.
vi.mock("@/components/calendar/CardSearch", () => ({
  default: ({ onSelectCard }: { onSelectCard: (card: CardResume) => void }) => (
    <button
      type="button"
      onClick={() =>
        onSelectCard({ id: "sv1-25", name: "Pikachu", localId: "25" })
      }
    >
      Pick Pikachu
    </button>
  ),
}));

const savedEvent = (over: Partial<CalendarEvent> = {}): CalendarEvent => ({
  id: "evt-real",
  title: "League night",
  startDate: "2026-11-20T18:00:00.000Z",
  endDate: "2026-11-20T19:00:00.000Z",
  allDay: false,
  color: "#2563eb",
  ...over,
});

const attached = (over: Partial<EventCard> = {}): EventCard => ({
  id: "entry-1",
  eventId: "evt-real",
  cardId: "sv1-1",
  cardName: "Bulbasaur",
  quantity: 1,
  createdAt: "2026-11-01T00:00:00.000Z",
  ...over,
});

type CardCall = { method: string; path: string };

/** Records every card write so a test can say exactly what was sent where. */
function recordCardWrites(
  respond: (call: CardCall) => Response | undefined = () => undefined,
) {
  const calls: CardCall[] = [];
  const handle = ({ request }: { request: Request }) => {
    const call = { method: request.method, path: new URL(request.url).pathname };
    calls.push(call);
    const override = respond(call);
    if (override) return override;
    if (request.method === "DELETE") return new HttpResponse(null, { status: 204 });
    return HttpResponse.json({
      card: attached({ id: `entry-${calls.length + 10}`, cardId: "sv1-25", cardName: "Pikachu" }),
    });
  };
  server.use(
    http.post("/api/calendar/events/:eventId/cards", handle),
    http.put("/api/calendar/events/:eventId/cards/:entryId", handle),
    http.delete("/api/calendar/events/:eventId/cards/:entryId", handle),
  );
  return calls;
}

function renderModal(props: Partial<React.ComponentProps<typeof EventModal>> = {}) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const onSave = vi.fn(
    async (event: Omit<CalendarEvent, "id"> & { id?: string }) =>
      savedEvent({ ...event, id: event.id ?? "evt-real" }),
  );
  const onClose = vi.fn();
  render(
    <QueryClientProvider client={client}>
      <EventModal
        initialDate={new Date("2026-11-20T18:00:00")}
        onSave={onSave}
        onClose={onClose}
        {...props}
      />
    </QueryClientProvider>,
  );
  return { onSave, onClose };
}

beforeEach(() => {
  server.use(
    http.get("/api/calendar/calendars", () => HttpResponse.json({ calendars: [] })),
  );
});

describe("EventModal card saves", () => {
  it("writes a new event's cards to the id the server gave it", async () => {
    const user = userEvent.setup();
    const calls = recordCardWrites();
    const { onSave, onClose } = renderModal();

    await user.type(screen.getByLabelText(/title/i), "League night");
    await user.click(screen.getByRole("button", { name: "Pick Pikachu" }));
    await user.click(screen.getByRole("button", { name: "Create" }));

    await waitFor(() => expect(onClose).toHaveBeenCalled());
    expect(onSave.mock.calls[0][0].id).toBeUndefined();
    expect(calls).toEqual([
      { method: "POST", path: "/api/calendar/events/evt-real/cards" },
    ]);
  });

  it("stays open and says so when a card doesn't save", async () => {
    const user = userEvent.setup();
    recordCardWrites(({ method }) =>
      method === "POST" ? HttpResponse.json({ error: "nope" }, { status: 500 }) : undefined,
    );
    const { onClose } = renderModal();

    await user.type(screen.getByLabelText(/title/i), "League night");
    await user.click(screen.getByRole("button", { name: "Pick Pikachu" }));
    await user.click(screen.getByRole("button", { name: "Create" }));

    expect(await screen.findByText(/1 card change didn.t save/i)).toBeInTheDocument();
    expect(onClose).not.toHaveBeenCalled();
    expect(screen.getByText("Pikachu")).toBeInTheDocument();
  });

  it("retries into the same event instead of creating a second one", async () => {
    const user = userEvent.setup();
    let failNextPost = true;
    const calls = recordCardWrites(({ method }) => {
      if (method !== "POST" || !failNextPost) return undefined;
      failNextPost = false;
      return HttpResponse.json({ error: "nope" }, { status: 500 });
    });
    const { onSave, onClose } = renderModal();

    await user.type(screen.getByLabelText(/title/i), "League night");
    await user.click(screen.getByRole("button", { name: "Pick Pikachu" }));
    await user.click(screen.getByRole("button", { name: "Create" }));
    await screen.findByText(/didn.t save/i);

    await user.click(screen.getByRole("button", { name: "Save" }));
    await waitFor(() => expect(onClose).toHaveBeenCalled());

    expect(onSave.mock.calls[1][0].id).toBe("evt-real");
    expect(calls.filter((c) => c.method === "POST")).toHaveLength(2);
  });

  it("only sends the cards that changed", async () => {
    const user = userEvent.setup();
    server.use(
      http.get("/api/calendar/events/:eventId/cards", () =>
        HttpResponse.json({
          cards: [attached(), attached({ id: "entry-2", cardId: "sv1-4", cardName: "Charmander" })],
        }),
      ),
    );
    const calls = recordCardWrites();
    const { onClose } = renderModal({ event: savedEvent() });

    await screen.findByText("Charmander");
    await user.click(screen.getAllByRole("button", { name: "Increase quantity" })[0]);
    await user.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() => expect(onClose).toHaveBeenCalled());
    expect(calls).toEqual([
      { method: "PUT", path: "/api/calendar/events/evt-real/cards/entry-1" },
    ]);
  });

  it("stays open when removing a card fails", async () => {
    const user = userEvent.setup();
    server.use(
      http.get("/api/calendar/events/:eventId/cards", () =>
        HttpResponse.json({ cards: [attached()] }),
      ),
    );
    recordCardWrites(({ method }) =>
      method === "DELETE" ? HttpResponse.json({ error: "nope" }, { status: 500 }) : undefined,
    );
    const { onClose } = renderModal({ event: savedEvent() });

    await user.click(await screen.findByRole("button", { name: "Remove Bulbasaur" }));
    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(await screen.findByText(/didn.t save/i)).toBeInTheDocument();
    expect(onClose).not.toHaveBeenCalled();
  });
});

describe("EventModal calendar picker", () => {
  it("is labelled, so it can be found by name", async () => {
    const calendar = (id: string, name: string) => ({
      id,
      name,
      color: "#2563eb",
      syncMode: "none",
      role: "owner",
    });
    server.use(
      http.get("/api/calendar/calendars", () =>
        HttpResponse.json({
          calendars: [calendar("cal-1", "Personal"), calendar("cal-2", "[E2E] Test Calendar")],
        }),
      ),
    );
    renderModal();

    const picker = await screen.findByRole("combobox", { name: "Calendar" });
    expect(picker).toHaveDisplayValue("No calendar");
  });
});
