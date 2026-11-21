import { describe, it, expect } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { http, HttpResponse } from "msw";
import { server } from "@/test/server";
import { useCalendars } from "../useCalendars";
import type { ReactNode } from "react";

/**
 * What the API answers a calendar create or update with: the row straight from
 * the database, which has no role column. Only the owner can make either call.
 */
const writtenCalendar = {
  id: "cal-1",
  name: "Personal",
  color: "#3b82f6",
  syncMode: "none",
};

function makeWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

/**
 * A create that succeeded used to throw: the response failed a schema that
 * required a role the API never sent, so the person saw "Couldn't save" for a
 * calendar that existed, and a retry made a second one.
 */
describe("useCalendars — writes", () => {
  it("treats a created calendar with no role as the caller's own", async () => {
    server.use(
      http.get("/api/calendar/calendars", () => HttpResponse.json({ calendars: [] })),
      http.post("/api/calendar/calendars", () =>
        HttpResponse.json({ calendar: writtenCalendar }, { status: 201 }),
      ),
    );
    const { result } = renderHook(() => useCalendars(), { wrapper: makeWrapper() });

    let created: Awaited<ReturnType<typeof result.current.createCalendar>> | undefined;
    await act(async () => {
      created = await result.current.createCalendar({
        name: "Personal",
        color: "#3b82f6",
        syncMode: "none",
      });
    });

    expect(created).toMatchObject({ id: "cal-1", role: "owner" });
  });

  it("treats an updated calendar with no role as the caller's own", async () => {
    server.use(
      http.get("/api/calendar/calendars", () => HttpResponse.json({ calendars: [] })),
      http.put("/api/calendar/calendars/cal-1", () =>
        HttpResponse.json({ calendar: { ...writtenCalendar, name: "Renamed" } }),
      ),
    );
    const { result } = renderHook(() => useCalendars(), { wrapper: makeWrapper() });

    let updated: Awaited<ReturnType<typeof result.current.updateCalendar>> | undefined;
    await act(async () => {
      updated = await result.current.updateCalendar("cal-1", { name: "Renamed" });
    });

    expect(updated).toMatchObject({ name: "Renamed", role: "owner" });
  });

  it("keeps the role when the API does send one", async () => {
    server.use(
      http.get("/api/calendar/calendars", () => HttpResponse.json({ calendars: [] })),
      http.put("/api/calendar/calendars/cal-1", () =>
        HttpResponse.json({ calendar: { ...writtenCalendar, role: "owner" } }),
      ),
    );
    const { result } = renderHook(() => useCalendars(), { wrapper: makeWrapper() });

    let updated: Awaited<ReturnType<typeof result.current.updateCalendar>> | undefined;
    await act(async () => {
      updated = await result.current.updateCalendar("cal-1", { name: "Personal" });
    });

    expect(updated?.role).toBe("owner");
  });
});

/** A member row as the API sends it. */
const memberRow = {
  id: "m-1",
  userSub: "auth0|abc",
  email: "friend@example.com",
  role: "viewer",
};

/**
 * Counts how often the calendar list is fetched, so a test can see whether a
 * write sent the list back for a fresh read.
 */
function countListFetches() {
  const fetches = { count: 0 };
  server.use(
    http.get("/api/calendar/calendars", () => {
      fetches.count += 1;
      return HttpResponse.json({ calendars: [] });
    }),
  );
  return fetches;
}

describe("useCalendars — a write that fails", () => {
  it("rejects with the message that says what failed, and reads the list again anyway", async () => {
    const fetches = countListFetches();
    server.use(
      http.post("/api/calendar/calendars", () =>
        HttpResponse.json({ error: "boom" }, { status: 500 }),
      ),
    );
    const { result } = renderHook(() => useCalendars(), { wrapper: makeWrapper() });
    await waitFor(() => expect(fetches.count).toBe(1));

    await act(async () => {
      await expect(
        result.current.createCalendar({ name: "x", color: "#fff", syncMode: "none" }),
      ).rejects.toThrow("Failed to create calendar");
    });

    // A failed write can still have half-landed, so the list is read again.
    await waitFor(() => expect(fetches.count).toBe(2));
  });

  it.each([
    ["update", (c: ReturnType<typeof useCalendars>) => c.updateCalendar("cal-1", { name: "n" }), "put", "/api/calendar/calendars/cal-1", "Failed to update calendar"],
    ["delete", (c: ReturnType<typeof useCalendars>) => c.deleteCalendar("cal-1"), "delete", "/api/calendar/calendars/cal-1", "Failed to delete calendar"],
    ["role change", (c: ReturnType<typeof useCalendars>) => c.updateMemberRole("cal-1", "auth0|abc", "editor"), "put", "/api/calendar/calendars/cal-1/members/:sub", "Failed to update member role"],
    ["member removal", (c: ReturnType<typeof useCalendars>) => c.removeMember("cal-1", "auth0|abc"), "delete", "/api/calendar/calendars/cal-1/members/:sub", "Failed to remove member"],
    ["leaving", (c: ReturnType<typeof useCalendars>) => c.leaveCalendar("cal-1"), "delete", "/api/calendar/calendars/cal-1/members/me", "Failed to leave calendar"],
  ] as const)("rejects a failed %s with its own message", async (_name, write, method, path, message) => {
    countListFetches();
    server.use(http[method](path, () => HttpResponse.json({}, { status: 403 })));
    const { result } = renderHook(() => useCalendars(), { wrapper: makeWrapper() });

    await act(async () => {
      await expect(write(result.current)).rejects.toThrow(message);
    });
  });

  it("surfaces the server's own reason when an invite is refused", async () => {
    countListFetches();
    server.use(
      http.post("/api/calendar/calendars/cal-1/members", () =>
        HttpResponse.json({ error: "No user with that email" }, { status: 404 }),
      ),
    );
    const { result } = renderHook(() => useCalendars(), { wrapper: makeWrapper() });

    await act(async () => {
      await expect(
        result.current.inviteMember("cal-1", "nobody@example.com", "viewer"),
      ).rejects.toThrow("No user with that email");
    });
  });

  it("falls back to a generic invite failure when the server's body is not JSON", async () => {
    countListFetches();
    server.use(
      http.post("/api/calendar/calendars/cal-1/members", () =>
        new HttpResponse("Bad gateway", { status: 502 }),
      ),
    );
    const { result } = renderHook(() => useCalendars(), { wrapper: makeWrapper() });

    await act(async () => {
      await expect(
        result.current.inviteMember("cal-1", "a@example.com", "viewer"),
      ).rejects.toThrow("Failed to invite member");
    });
  });
});

describe("useCalendars — writes that work", () => {
  it("sends what it was given and reads the list again after a create", async () => {
    const fetches = countListFetches();
    let sent: unknown;
    server.use(
      http.post("/api/calendar/calendars", async ({ request }) => {
        sent = await request.json();
        return HttpResponse.json({ calendar: writtenCalendar }, { status: 201 });
      }),
    );
    const { result } = renderHook(() => useCalendars(), { wrapper: makeWrapper() });
    await waitFor(() => expect(fetches.count).toBe(1));

    await act(async () => {
      await result.current.createCalendar({ name: "Personal", color: "#3b82f6", syncMode: "none" });
    });

    expect(sent).toEqual({ name: "Personal", color: "#3b82f6", syncMode: "none" });
    await waitFor(() => expect(fetches.count).toBe(2));
  });

  it("deletes the calendar it names and reads the list again", async () => {
    const fetches = countListFetches();
    let deleted = "";
    server.use(
      http.delete("/api/calendar/calendars/:id", ({ params }) => {
        deleted = String(params.id);
        return new HttpResponse(null, { status: 204 });
      }),
    );
    const { result } = renderHook(() => useCalendars(), { wrapper: makeWrapper() });
    await waitFor(() => expect(fetches.count).toBe(1));

    await act(async () => {
      await result.current.deleteCalendar("cal-9");
    });

    expect(deleted).toBe("cal-9");
    await waitFor(() => expect(fetches.count).toBe(2));
  });

  it("invites by email with the chosen role and returns the new member", async () => {
    countListFetches();
    let sent: unknown;
    server.use(
      http.post("/api/calendar/calendars/cal-1/members", async ({ request }) => {
        sent = await request.json();
        return HttpResponse.json({ member: memberRow }, { status: 201 });
      }),
    );
    const { result } = renderHook(() => useCalendars(), { wrapper: makeWrapper() });

    let member: unknown;
    await act(async () => {
      member = await result.current.inviteMember("cal-1", "friend@example.com", "viewer");
    });

    expect(sent).toEqual({ email: "friend@example.com", role: "viewer" });
    expect(member).toMatchObject({ email: "friend@example.com", role: "viewer" });
  });

  it("changes a member's role and escapes their id in the URL", async () => {
    countListFetches();
    let requested = "";
    let sent: unknown;
    server.use(
      http.put("/api/calendar/calendars/cal-1/members/:sub", async ({ request }) => {
        requested = new URL(request.url).pathname;
        sent = await request.json();
        return HttpResponse.json({ member: { ...memberRow, role: "editor" } });
      }),
    );
    const { result } = renderHook(() => useCalendars(), { wrapper: makeWrapper() });

    let member: unknown;
    await act(async () => {
      member = await result.current.updateMemberRole("cal-1", "auth0|abc", "editor");
    });

    expect(requested).toBe("/api/calendar/calendars/cal-1/members/auth0%7Cabc");
    expect(sent).toEqual({ role: "editor" });
    expect(member).toMatchObject({ role: "editor" });
  });

  it("removes a member by their escaped id and says whether Google access went too", async () => {
    countListFetches();
    let requested = "";
    server.use(
      http.delete("/api/calendar/calendars/cal-1/members/:sub", ({ request }) => {
        requested = new URL(request.url).pathname;
        return HttpResponse.json({ googleAclRemoved: true });
      }),
    );
    const { result } = renderHook(() => useCalendars(), { wrapper: makeWrapper() });

    let outcome: unknown;
    await act(async () => {
      outcome = await result.current.removeMember("cal-1", "auth0|abc");
    });

    expect(requested).toBe("/api/calendar/calendars/cal-1/members/auth0%7Cabc");
    expect(outcome).toEqual({ googleAclRemoved: true });
  });

  it("leaves a shared calendar through the 'me' member", async () => {
    countListFetches();
    server.use(
      http.delete("/api/calendar/calendars/cal-1/members/me", () =>
        HttpResponse.json({ googleAclRemoved: false }),
      ),
    );
    const { result } = renderHook(() => useCalendars(), { wrapper: makeWrapper() });

    let outcome: unknown;
    await act(async () => {
      outcome = await result.current.leaveCalendar("cal-1");
    });

    expect(outcome).toEqual({ googleAclRemoved: false });
  });
});
