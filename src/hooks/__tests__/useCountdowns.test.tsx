import { describe, it, expect } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { http, HttpResponse, delay } from "msw";
import { server } from "@/test/server";
import { useCountdowns } from "../useCountdowns";
import type { Countdown, CountdownPage } from "@/types/calendar";
import type { ReactNode } from "react";

// ---------------------------------------------------------------------------
// Factories
// ---------------------------------------------------------------------------

function makeCountdown(overrides: Partial<Countdown> = {}): Countdown {
  return {
    id: crypto.randomUUID(),
    title: "Test Countdown",
    targetDate: "2025-01-01",
    color: "#3b82f6",
    createdAt: "2024-01-01T00:00:00Z",
    ...overrides,
  };
}

function makePage(
  countdowns: Countdown[],
  nextCursor: string | null = null,
): CountdownPage {
  return { countdowns, nextCursor };
}

function makeWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  }
  return Wrapper;
}

// ---------------------------------------------------------------------------
// Read + pagination
// ---------------------------------------------------------------------------

describe("useCountdowns — read", () => {
  it("flattens a single page of countdowns into a list", async () => {
    const countdowns = [makeCountdown({ title: "Christmas" })];
    server.use(
      http.get("/api/calendar/countdowns", () =>
        HttpResponse.json(makePage(countdowns)),
      ),
    );

    const { result } = renderHook(() => useCountdowns(), {
      wrapper: makeWrapper(),
    });

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.countdowns).toHaveLength(1);
    expect(result.current.countdowns[0].title).toBe("Christmas");
  });

  it("seeds from initialPage synchronously on first render", async () => {
    const seed = makePage([makeCountdown({ title: "Seeded" })]);
    // staleTime is 0 so a background refetch fires — register a handler for it
    server.use(
      http.get("/api/calendar/countdowns", () => HttpResponse.json(seed)),
    );

    const { result } = renderHook(() => useCountdowns({ initialPage: seed }), {
      wrapper: makeWrapper(),
    });

    // initialData is applied synchronously — visible without awaiting
    expect(result.current.countdowns[0].title).toBe("Seeded");
  });

  it("exposes hasNextPage when the page has a cursor", async () => {
    const page = makePage([makeCountdown()], "2025-01-01__some-uuid");
    server.use(
      http.get("/api/calendar/countdowns", () => HttpResponse.json(page)),
    );

    const { result } = renderHook(() => useCountdowns(), {
      wrapper: makeWrapper(),
    });

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.hasNextPage).toBe(true);
  });

  it("does not expose hasNextPage when the cursor is null", async () => {
    server.use(
      http.get("/api/calendar/countdowns", () =>
        HttpResponse.json(makePage([makeCountdown()])),
      ),
    );

    const { result } = renderHook(() => useCountdowns(), {
      wrapper: makeWrapper(),
    });

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.hasNextPage).toBe(false);
  });

  it("flattens multiple pages after fetchNextPage", async () => {
    const page1 = makePage([makeCountdown({ title: "First" })], "cursor-1");
    const page2 = makePage([makeCountdown({ title: "Second" })], null);
    server.use(
      http.get("/api/calendar/countdowns", ({ request }) => {
        const cursor = new URL(request.url).searchParams.get("cursor");
        return HttpResponse.json(cursor ? page2 : page1);
      }),
    );

    const { result } = renderHook(() => useCountdowns(), {
      wrapper: makeWrapper(),
    });

    await waitFor(() => expect(result.current.loading).toBe(false));
    await act(async () => {
      result.current.fetchNextPage();
    });
    await waitFor(() => expect(result.current.countdowns).toHaveLength(2));

    const titles = result.current.countdowns.map((c) => c.title);
    expect(titles).toContain("First");
    expect(titles).toContain("Second");
  });

  it("exposes an error when the fetch fails", async () => {
    server.use(
      http.get("/api/calendar/countdowns", () => HttpResponse.error()),
    );

    const { result } = renderHook(() => useCountdowns(), {
      wrapper: makeWrapper(),
    });

    await waitFor(() => expect(result.current.error).not.toBeNull());
  });
});

// ---------------------------------------------------------------------------
// Create mutation
// ---------------------------------------------------------------------------

describe("useCountdowns — createCountdown", () => {
  it("shows the new countdown immediately, before the server responds", async () => {
    const existing = makeCountdown({ title: "Existing" });
    const created = makeCountdown({ id: "new-id", title: "New Year" });
    server.use(
      http.post("/api/calendar/countdowns", async ({ request }) => {
        await delay(300);
        const body = (await request.json()) as Omit<
          Countdown,
          "id" | "createdAt"
        >;
        return HttpResponse.json({
          countdown: {
            ...body,
            id: "new-id",
            createdAt: "2024-01-01T00:00:00Z",
          },
        });
      }),
      http.get("/api/calendar/countdowns", () =>
        HttpResponse.json(makePage([existing, created])),
      ),
    );

    const { result } = renderHook(
      () => useCountdowns({ initialPage: makePage([existing]) }),
      { wrapper: makeWrapper() },
    );

    act(() => {
      void result.current.createCountdown({
        title: "New Year",
        targetDate: "2025-01-01",
        color: "#10b981",
      });
    });

    await waitFor(() =>
      expect(
        result.current.countdowns.some((c) => c.title === "New Year"),
      ).toBe(true),
    );
  });

  it("rolls back when the create fails", async () => {
    const existing = makeCountdown({ title: "Existing" });
    server.use(
      http.get("/api/calendar/countdowns", () =>
        HttpResponse.json(makePage([existing])),
      ),
      http.post("/api/calendar/countdowns", () =>
        HttpResponse.json({ error: "fail" }, { status: 500 }),
      ),
    );

    const { result } = renderHook(() => useCountdowns(), {
      wrapper: makeWrapper(),
    });
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current
        .createCountdown({
          title: "Will Fail",
          targetDate: "2025-06-01",
          color: "#ef4444",
        })
        .catch(() => {});
    });

    await waitFor(() =>
      expect(
        result.current.countdowns.every((c) => c.title !== "Will Fail"),
      ).toBe(true),
    );
  });
});

// ---------------------------------------------------------------------------
// Update mutation
// ---------------------------------------------------------------------------

describe("useCountdowns — updateCountdown", () => {
  it("shows the updated title immediately, before the server responds", async () => {
    const countdown = makeCountdown({ id: "cd-1", title: "Before" });
    server.use(
      http.put("/api/calendar/countdowns/:id", async ({ request }) => {
        await delay(300);
        const fields = (await request.json()) as Partial<Countdown>;
        return HttpResponse.json({ countdown: { ...countdown, ...fields } });
      }),
      http.get("/api/calendar/countdowns", () =>
        HttpResponse.json(makePage([{ ...countdown, title: "After" }])),
      ),
    );

    const { result } = renderHook(
      () => useCountdowns({ initialPage: makePage([countdown]) }),
      { wrapper: makeWrapper() },
    );

    act(() => {
      void result.current.updateCountdown("cd-1", { title: "After" });
    });

    await waitFor(() =>
      expect(
        result.current.countdowns.find((c) => c.id === "cd-1")?.title,
      ).toBe("After"),
    );
  });

  it("rolls back the title when the update fails", async () => {
    const countdown = makeCountdown({ id: "cd-rollback", title: "Original" });
    server.use(
      http.get("/api/calendar/countdowns", () =>
        HttpResponse.json(makePage([countdown])),
      ),
      http.put("/api/calendar/countdowns/:id", () =>
        HttpResponse.json({ error: "fail" }, { status: 500 }),
      ),
    );

    const { result } = renderHook(() => useCountdowns(), {
      wrapper: makeWrapper(),
    });
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current
        .updateCountdown("cd-rollback", { title: "Changed" })
        .catch(() => {});
    });

    await waitFor(() =>
      expect(
        result.current.countdowns.find((c) => c.id === "cd-rollback")?.title,
      ).toBe("Original"),
    );
  });
});

// ---------------------------------------------------------------------------
// Delete mutation
// ---------------------------------------------------------------------------

describe("useCountdowns — deleteCountdown", () => {
  it("removes the countdown immediately, before the server responds", async () => {
    const countdown = makeCountdown({ id: "cd-del", title: "To Delete" });
    server.use(
      http.delete("/api/calendar/countdowns/:id", async () => {
        await delay(300);
        return new HttpResponse(null, { status: 204 });
      }),
      http.get("/api/calendar/countdowns", () =>
        HttpResponse.json(makePage([])),
      ),
    );

    const { result } = renderHook(
      () => useCountdowns({ initialPage: makePage([countdown]) }),
      { wrapper: makeWrapper() },
    );

    act(() => {
      void result.current.deleteCountdown("cd-del");
    });

    await waitFor(() =>
      expect(result.current.countdowns.every((c) => c.id !== "cd-del")).toBe(
        true,
      ),
    );
  });

  it("rolls back the deleted countdown when the delete fails", async () => {
    const countdown = makeCountdown({
      id: "cd-del-fail",
      title: "Should Stay",
    });
    server.use(
      http.get("/api/calendar/countdowns", () =>
        HttpResponse.json(makePage([countdown])),
      ),
      http.delete("/api/calendar/countdowns/:id", () =>
        HttpResponse.json({ error: "fail" }, { status: 500 }),
      ),
    );

    const { result } = renderHook(() => useCountdowns(), {
      wrapper: makeWrapper(),
    });
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.deleteCountdown("cd-del-fail").catch(() => {});
    });

    await waitFor(() =>
      expect(
        result.current.countdowns.some((c) => c.id === "cd-del-fail"),
      ).toBe(true),
    );
  });
});
