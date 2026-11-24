import { describe, it, expect, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { server } from "@/test/server";
import type { Countdown, CountdownPage } from "@/types/calendar";

// The real modal is its own component with its own tests; here it only needs to
// show that it opened, for which countdown, and let the test drive its callbacks.
vi.mock("@/components/calendar/CountdownModal", () => ({
  default: ({
    countdown,
    onClose,
    onSave,
    onDelete,
  }: {
    countdown?: Countdown;
    onClose: () => void;
    onSave: (data: Omit<Countdown, "id" | "createdAt">) => Promise<void>;
    onDelete: (id: string) => Promise<void>;
  }) => (
    <div role="dialog" aria-label={countdown ? `Edit ${countdown.title}` : "New countdown"}>
      <button onClick={onClose}>Close modal</button>
      <button
        onClick={() =>
          onSave({ title: "Saved one", targetDate: "2027-05-05", color: "#112233" }).then(onClose)
        }
      >
        Save modal
      </button>
      {countdown && (
        <button onClick={() => onDelete(countdown.id).then(onClose)}>Delete modal</button>
      )}
    </div>
  ),
}));

import CountdownContent from "./CountdownContent";

const buildCountdown = (overrides: Partial<Countdown> = {}): Countdown => ({
  id: "c1",
  title: "Launch day",
  targetDate: "2030-06-01",
  color: "#219b84",
  createdAt: "2026-09-20T00:00:00.000Z",
  ...overrides,
});

const renderContent = (initialPage?: CountdownPage) => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <CountdownContent initialPage={initialPage} />
    </QueryClientProvider>,
  );
};

const serveCountdowns = (page: CountdownPage) =>
  server.use(http.get("/api/calendar/countdowns", () => HttpResponse.json(page)));

describe("CountdownContent", () => {
  it("lists the countdowns soonest first, whatever order they arrive in", async () => {
    const page: CountdownPage = {
      nextCursor: null,
      countdowns: [
        buildCountdown({ id: "late", title: "Later", targetDate: "2031-01-01" }),
        buildCountdown({ id: "soon", title: "Sooner", targetDate: "2029-01-01" }),
        buildCountdown({ id: "mid", title: "Middle", targetDate: "2030-01-01" }),
      ],
    };
    serveCountdowns(page);
    renderContent(page);

    const items = await screen.findAllByRole("listitem");
    expect(items.map((item) => within(item).getByText(/Later|Sooner|Middle/).textContent)).toEqual([
      "Sooner",
      "Middle",
      "Later",
    ]);
  });

  it("says there are none yet when the list is empty", async () => {
    serveCountdowns({ countdowns: [], nextCursor: null });
    renderContent({ countdowns: [], nextCursor: null });

    expect(await screen.findByText(/no countdowns yet/i)).toBeInTheDocument();
    expect(screen.queryByRole("list")).toBeNull();
  });

  it("offers Load more only while the API has another page", async () => {
    const withMore: CountdownPage = { countdowns: [buildCountdown()], nextCursor: "2030-06-01__c1" };
    serveCountdowns(withMore);
    const { unmount } = renderContent(withMore);
    expect(await screen.findByRole("button", { name: "Load more" })).toBeInTheDocument();
    unmount();

    const last: CountdownPage = { countdowns: [buildCountdown()], nextCursor: null };
    serveCountdowns(last);
    renderContent(last);
    await screen.findByText("Launch day");
    expect(screen.queryByRole("button", { name: "Load more" })).toBeNull();
  });

  it("fetches the next page from the cursor and appends it", async () => {
    const user = userEvent.setup();
    const cursors: (string | null)[] = [];
    const first: CountdownPage = {
      countdowns: [buildCountdown({ id: "a", title: "First page" })],
      nextCursor: "cursor-1",
    };
    server.use(
      http.get("/api/calendar/countdowns", ({ request }) => {
        const cursor = new URL(request.url).searchParams.get("cursor");
        cursors.push(cursor);
        return HttpResponse.json(
          cursor
            ? {
                countdowns: [buildCountdown({ id: "b", title: "Second page", targetDate: "2031-01-01" })],
                nextCursor: null,
              }
            : first,
        );
      }),
    );
    renderContent(first);

    await user.click(await screen.findByRole("button", { name: "Load more" }));

    expect(await screen.findByText("Second page")).toBeInTheDocument();
    expect(screen.getByText("First page")).toBeInTheDocument();
    expect(cursors).toContain("cursor-1");
    expect(screen.queryByRole("button", { name: "Load more" })).toBeNull();
  });

  it("opens an empty modal from New countdown, and closes it again", async () => {
    const user = userEvent.setup();
    serveCountdowns({ countdowns: [], nextCursor: null });
    renderContent({ countdowns: [], nextCursor: null });

    await user.click(screen.getByRole("button", { name: "New countdown" }));
    expect(await screen.findByRole("dialog", { name: "New countdown" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Close modal" }));
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("opens the modal on the countdown that was clicked", async () => {
    const user = userEvent.setup();
    const page: CountdownPage = {
      nextCursor: null,
      countdowns: [
        buildCountdown({ id: "a", title: "Alpha", targetDate: "2029-01-01" }),
        buildCountdown({ id: "b", title: "Beta", targetDate: "2030-01-01" }),
      ],
    };
    serveCountdowns(page);
    renderContent(page);

    await user.click(await screen.findByRole("button", { name: /Beta/ }));

    expect(await screen.findByRole("dialog", { name: "Edit Beta" })).toBeInTheDocument();
  });

  it("creates a countdown through the API when saving from the new modal", async () => {
    const user = userEvent.setup();
    let created: unknown = null;
    const empty: CountdownPage = { countdowns: [], nextCursor: null };
    server.use(
      http.get("/api/calendar/countdowns", () => HttpResponse.json(empty)),
      http.post("/api/calendar/countdowns", async ({ request }) => {
        created = await request.json();
        return HttpResponse.json({ countdown: buildCountdown({ id: "new", title: "Saved one" }) }, { status: 201 });
      }),
    );
    renderContent(empty);

    await user.click(screen.getByRole("button", { name: "New countdown" }));
    await user.click(await screen.findByRole("button", { name: "Save modal" }));

    expect(created).toMatchObject({ title: "Saved one", targetDate: "2027-05-05" });
  });

  it("updates, not creates, when saving from an existing countdown's modal", async () => {
    const user = userEvent.setup();
    const calls: string[] = [];
    const page: CountdownPage = {
      nextCursor: null,
      countdowns: [buildCountdown({ id: "keep-me", title: "Existing" })],
    };
    server.use(
      http.get("/api/calendar/countdowns", () => HttpResponse.json(page)),
      http.put("/api/calendar/countdowns/keep-me", () => {
        calls.push("PUT keep-me");
        return HttpResponse.json({ countdown: buildCountdown({ id: "keep-me", title: "Saved one" }) });
      }),
      http.post("/api/calendar/countdowns", () => {
        calls.push("POST");
        return HttpResponse.json({ countdown: buildCountdown() }, { status: 201 });
      }),
    );
    renderContent(page);

    await user.click(await screen.findByRole("button", { name: /Existing/ }));
    await user.click(await screen.findByRole("button", { name: "Save modal" }));

    expect(calls).toEqual(["PUT keep-me"]);
  });

  it("deletes the countdown whose modal is open", async () => {
    const user = userEvent.setup();
    const deleted: string[] = [];
    const page: CountdownPage = {
      nextCursor: null,
      countdowns: [buildCountdown({ id: "gone", title: "Doomed" })],
    };
    server.use(
      http.get("/api/calendar/countdowns", () => HttpResponse.json(page)),
      http.delete("/api/calendar/countdowns/gone", () => {
        deleted.push("gone");
        return new HttpResponse(null, { status: 204 });
      }),
    );
    renderContent(page);

    await user.click(await screen.findByRole("button", { name: /Doomed/ }));
    await user.click(await screen.findByRole("button", { name: "Delete modal" }));

    expect(deleted).toEqual(["gone"]);
  });
});
