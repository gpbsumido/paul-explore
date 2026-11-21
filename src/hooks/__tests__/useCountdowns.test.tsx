import { describe, it, expect } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { http, HttpResponse } from "msw";
import { server } from "@/test/server";
import { useCountdowns } from "../useCountdowns";
import type { Countdown, CountdownPage } from "@/types/calendar";
import type { ReactNode } from "react";
import { CONNECTION_ERROR_MESSAGE } from "@/lib/userFacingError";

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
    expect(result.current.error).toBe(CONNECTION_ERROR_MESSAGE);
  });

  it("passes the cursor from one page on to the request for the next", async () => {
    const cursors: (string | null)[] = [];
    server.use(
      http.get("/api/calendar/countdowns", ({ request }) => {
        const cursor = new URL(request.url).searchParams.get("cursor");
        cursors.push(cursor);
        return HttpResponse.json(
          cursor
            ? makePage([makeCountdown({ title: "Second" })], null)
            : makePage([makeCountdown({ title: "First" })], "cursor-1"),
        );
      }),
    );
    const { result } = renderHook(() => useCountdowns(), { wrapper: makeWrapper() });
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      result.current.fetchNextPage();
    });

    await waitFor(() => expect(result.current.countdowns).toHaveLength(2));
    expect(cursors).toEqual([null, "cursor-1"]);
    expect(result.current.countdowns.map((c) => c.title)).toEqual(["First", "Second"]);
    await waitFor(() => expect(result.current.hasNextPage).toBe(false));
  });
});

// ---------------------------------------------------------------------------
// Writes: optimistic update, rollback, and what the server says afterwards
// ---------------------------------------------------------------------------

/**
 * Every GET after the first one hangs, so whatever the cache shows after a
 * write is the hook's own doing and not a refetch quietly putting the server's
 * answer back. Without this a rollback and a refetch look identical.
 */
function serveOnceThenHang(page: CountdownPage) {
  let calls = 0;
  server.use(
    http.get("/api/calendar/countdowns", async () => {
      calls += 1;
      if (calls > 1) await new Promise(() => {});
      return HttpResponse.json(page);
    }),
  );
}

/**
 * Lets React Query's batched notifications reach the hook. It tells React about
 * cache changes on a timer, so a rollback that has already happened can be
 * missing from the hook's last render when the write's promise settles; a
 * check made before this reads that stale render.
 */
const letQueryNotificationsLand = () =>
  act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 30));
  });

/** A promise a test can settle by hand, to hold a request in flight. */
function gate() {
  let open: () => void = () => {};
  const opened = new Promise<void>((resolve) => {
    open = resolve;
  });
  return { opened, open };
}

const NEW_COUNTDOWN = { title: "New Year", targetDate: "2025-01-01", color: "#10b981" };

describe("useCountdowns — createCountdown", () => {
  it("shows the new countdown while the request is still in flight", async () => {
    const existing = makeCountdown({ title: "Existing" });
    const release = gate();
    server.use(
      // The server's list never has it, so only the optimistic write can show it.
      http.get("/api/calendar/countdowns", () => HttpResponse.json(makePage([existing]))),
      http.post("/api/calendar/countdowns", async ({ request }) => {
        await release.opened;
        const body = (await request.json()) as Omit<Countdown, "id" | "createdAt">;
        return HttpResponse.json({
          countdown: { ...body, id: "new-id", createdAt: "2024-01-01T00:00:00Z" },
        });
      }),
    );
    const { result } = renderHook(
      () => useCountdowns({ initialPage: makePage([existing]) }),
      { wrapper: makeWrapper() },
    );

    let pending: Promise<Countdown> | undefined;
    act(() => {
      pending = result.current.createCountdown(NEW_COUNTDOWN);
    });

    await waitFor(() =>
      expect(result.current.countdowns.map((c) => c.title)).toEqual([
        "Existing",
        "New Year",
      ]),
    );
    expect(result.current.isCreating).toBe(true);

    release.open();
    await act(async () => {
      await pending;
    });
    await waitFor(() => expect(result.current.isCreating).toBe(false));
  });

  it("resolves with the countdown the server made", async () => {
    server.use(
      http.get("/api/calendar/countdowns", () => HttpResponse.json(makePage([]))),
      http.post("/api/calendar/countdowns", async ({ request }) => {
        const body = (await request.json()) as Omit<Countdown, "id" | "createdAt">;
        return HttpResponse.json({
          countdown: { ...body, id: "new-id", createdAt: "2024-01-01T00:00:00Z" },
        });
      }),
    );
    const { result } = renderHook(() => useCountdowns(), { wrapper: makeWrapper() });
    await waitFor(() => expect(result.current.loading).toBe(false));

    let created: Countdown | undefined;
    await act(async () => {
      created = await result.current.createCountdown(NEW_COUNTDOWN);
    });

    expect(created).toMatchObject({ id: "new-id", title: "New Year" });
  });

  it("takes the optimistic countdown back out when the create fails", async () => {
    const existing = makeCountdown({ title: "Existing" });
    serveOnceThenHang(makePage([existing]));
    server.use(
      http.post("/api/calendar/countdowns", () =>
        HttpResponse.json({ error: "fail" }, { status: 500 }),
      ),
    );
    const { result } = renderHook(() => useCountdowns(), { wrapper: makeWrapper() });
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await expect(result.current.createCountdown(NEW_COUNTDOWN)).rejects.toThrow();
    });

    await letQueryNotificationsLand();
    expect(result.current.countdowns.map((c) => c.title)).toEqual(["Existing"]);
  });

  it("adds the optimistic countdown to the first page only, not to every page loaded", async () => {
    const first = makeCountdown({ id: "cd-1", title: "First" });
    const second = makeCountdown({ id: "cd-2", title: "Second" });
    const release = gate();
    server.use(
      http.get("/api/calendar/countdowns", ({ request }) =>
        HttpResponse.json(
          new URL(request.url).searchParams.get("cursor")
            ? makePage([second], null)
            : makePage([first], "cursor-1"),
        ),
      ),
      http.post("/api/calendar/countdowns", async () => {
        await release.opened;
        return HttpResponse.json({
          countdown: { ...NEW_COUNTDOWN, id: "new-id", createdAt: "2024-01-01T00:00:00Z" },
        });
      }),
    );
    const { result } = renderHook(() => useCountdowns(), { wrapper: makeWrapper() });
    await waitFor(() => expect(result.current.loading).toBe(false));
    await act(async () => {
      result.current.fetchNextPage();
    });
    await waitFor(() => expect(result.current.countdowns).toHaveLength(2));

    let pending: Promise<Countdown> | undefined;
    act(() => {
      pending = result.current.createCountdown(NEW_COUNTDOWN);
    });

    await waitFor(() => expect(result.current.countdowns).toHaveLength(3));
    expect(result.current.countdowns.map((c) => c.title)).toEqual([
      "First",
      "New Year",
      "Second",
    ]);
    release.open();
    await act(async () => {
      await pending;
    });
  });

  it("creates into an empty cache without needing a first page to exist", async () => {
    const release = gate();
    server.use(
      http.get("/api/calendar/countdowns", () => new Promise(() => {})),
      http.post("/api/calendar/countdowns", async () => {
        await release.opened;
        return HttpResponse.json({
          countdown: { ...NEW_COUNTDOWN, id: "new-id", createdAt: "2024-01-01T00:00:00Z" },
        });
      }),
    );
    const { result } = renderHook(() => useCountdowns(), { wrapper: makeWrapper() });

    let pending: Promise<Countdown> | undefined;
    act(() => {
      pending = result.current.createCountdown(NEW_COUNTDOWN);
    });

    await waitFor(() =>
      expect(result.current.countdowns.map((c) => c.title)).toEqual(["New Year"]),
    );
    release.open();
    await act(async () => {
      await pending;
    });
  });
});

describe("useCountdowns — updateCountdown", () => {
  it("shows the updated title while the request is still in flight, and only on that countdown", async () => {
    const target = makeCountdown({ id: "cd-1", title: "Before" });
    const other = makeCountdown({ id: "cd-2", title: "Other" });
    const release = gate();
    server.use(
      http.get("/api/calendar/countdowns", () => HttpResponse.json(makePage([target, other]))),
      http.put("/api/calendar/countdowns/:id", async ({ request }) => {
        await release.opened;
        const fields = (await request.json()) as Partial<Countdown>;
        return HttpResponse.json({ countdown: { ...target, ...fields } });
      }),
    );
    const { result } = renderHook(
      () => useCountdowns({ initialPage: makePage([target, other]) }),
      { wrapper: makeWrapper() },
    );

    let pending: Promise<Countdown> | undefined;
    act(() => {
      pending = result.current.updateCountdown("cd-1", { title: "After" });
    });

    await waitFor(() =>
      expect(result.current.countdowns.map((c) => c.title)).toEqual(["After", "Other"]),
    );
    expect(result.current.isUpdating).toBe(true);

    release.open();
    await act(async () => {
      await pending;
    });
  });

  it("reaches a countdown on a later page", async () => {
    const first = makeCountdown({ id: "cd-1", title: "First" });
    const second = makeCountdown({ id: "cd-2", title: "Second" });
    const release = gate();
    server.use(
      http.get("/api/calendar/countdowns", ({ request }) =>
        HttpResponse.json(
          new URL(request.url).searchParams.get("cursor")
            ? makePage([second], null)
            : makePage([first], "cursor-1"),
        ),
      ),
      http.put("/api/calendar/countdowns/:id", async () => {
        await release.opened;
        return HttpResponse.json({ countdown: { ...second, title: "Renamed" } });
      }),
    );
    const { result } = renderHook(() => useCountdowns(), { wrapper: makeWrapper() });
    await waitFor(() => expect(result.current.loading).toBe(false));
    await act(async () => {
      result.current.fetchNextPage();
    });
    await waitFor(() => expect(result.current.countdowns).toHaveLength(2));

    let pending: Promise<Countdown> | undefined;
    act(() => {
      pending = result.current.updateCountdown("cd-2", { title: "Renamed" });
    });

    await waitFor(() =>
      expect(result.current.countdowns.map((c) => c.title)).toEqual(["First", "Renamed"]),
    );
    release.open();
    await act(async () => {
      await pending;
    });
  });

  it("puts the original back when the update fails", async () => {
    const countdown = makeCountdown({ id: "cd-rollback", title: "Original" });
    serveOnceThenHang(makePage([countdown]));
    server.use(
      http.put("/api/calendar/countdowns/:id", () =>
        HttpResponse.json({ error: "fail" }, { status: 500 }),
      ),
    );
    const { result } = renderHook(() => useCountdowns(), { wrapper: makeWrapper() });
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await expect(
        result.current.updateCountdown("cd-rollback", { title: "Changed" }),
      ).rejects.toThrow();
    });

    await letQueryNotificationsLand();
    expect(result.current.countdowns.find((c) => c.id === "cd-rollback")?.title).toBe(
      "Original",
    );
  });
});

describe("useCountdowns — deleteCountdown", () => {
  it("removes only that countdown while the request is still in flight", async () => {
    const doomed = makeCountdown({ id: "cd-del", title: "To Delete" });
    const kept = makeCountdown({ id: "cd-keep", title: "Keep" });
    const release = gate();
    server.use(
      http.get("/api/calendar/countdowns", () => HttpResponse.json(makePage([doomed, kept]))),
      http.delete("/api/calendar/countdowns/:id", async () => {
        await release.opened;
        return new HttpResponse(null, { status: 204 });
      }),
    );
    const { result } = renderHook(
      () => useCountdowns({ initialPage: makePage([doomed, kept]) }),
      { wrapper: makeWrapper() },
    );

    let pending: Promise<void> | undefined;
    act(() => {
      pending = result.current.deleteCountdown("cd-del");
    });

    await waitFor(() =>
      expect(result.current.countdowns.map((c) => c.id)).toEqual(["cd-keep"]),
    );
    expect(result.current.isDeleting).toBe(true);

    release.open();
    await act(async () => {
      await pending;
    });
  });

  it("brings the countdown back, on its own page, when the delete fails", async () => {
    const first = makeCountdown({ id: "cd-first", title: "First" });
    const second = makeCountdown({ id: "cd-del-fail", title: "Should Stay" });
    let calls = 0;
    server.use(
      http.get("/api/calendar/countdowns", async ({ request }) => {
        calls += 1;
        // The first two reads are the two pages; anything later hangs so a
        // refetch cannot hide a missing rollback.
        if (calls > 2) await new Promise(() => {});
        return HttpResponse.json(
          new URL(request.url).searchParams.get("cursor")
            ? makePage([second], null)
            : makePage([first], "cursor-1"),
        );
      }),
      http.delete("/api/calendar/countdowns/:id", () =>
        HttpResponse.json({ error: "fail" }, { status: 500 }),
      ),
    );
    const { result } = renderHook(() => useCountdowns(), { wrapper: makeWrapper() });
    await waitFor(() => expect(result.current.loading).toBe(false));
    await act(async () => {
      result.current.fetchNextPage();
    });
    await waitFor(() => expect(result.current.countdowns).toHaveLength(2));

    await act(async () => {
      await expect(result.current.deleteCountdown("cd-del-fail")).rejects.toThrow();
    });

    await letQueryNotificationsLand();
    expect(result.current.countdowns.map((c) => c.id)).toEqual(["cd-first", "cd-del-fail"]);
  });
});

describe("useCountdowns — after a write settles", () => {
  it.each([
    ["create", "post", "/api/calendar/countdowns", (c: ReturnType<typeof useCountdowns>) => c.createCountdown(NEW_COUNTDOWN)],
    ["update", "put", "/api/calendar/countdowns/:id", (c: ReturnType<typeof useCountdowns>) => c.updateCountdown("cd-1", { title: "x" })],
    ["delete", "delete", "/api/calendar/countdowns/:id", (c: ReturnType<typeof useCountdowns>) => c.deleteCountdown("cd-1")],
  ] as const)(
    "reads the list again after a failed %s so the cache agrees with the server",
    async (_name, method, path, write) => {
      let gets = 0;
      server.use(
        http.get("/api/calendar/countdowns", () => {
          gets += 1;
          return HttpResponse.json(makePage([]));
        }),
        http[method](path, () => HttpResponse.json({ error: "no" }, { status: 500 })),
      );
      const { result } = renderHook(() => useCountdowns(), { wrapper: makeWrapper() });
      await waitFor(() => expect(gets).toBe(1));

      await act(async () => {
        await expect(write(result.current)).rejects.toThrow();
      });

      await waitFor(() => expect(gets).toBe(2));
    },
  );
});
