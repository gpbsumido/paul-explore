import { StrictMode } from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { server } from "@/test/server";
import SettingsContent from "./SettingsContent";
import { queryKeys } from "@/lib/queryKeys";

vi.mock("@/components/PageHeader", () => ({ default: () => null }));

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(window.location.search),
  usePathname: () => "/settings",
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn() }),
}));

const returnFromGoogle = () =>
  window.history.replaceState({}, "", "/settings?gcal=confirm&code=the-code&state=the-state");

const renderSettings = () => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <StrictMode>
      <QueryClientProvider client={client}>
        <SettingsContent version="9.9.9" />
      </QueryClientProvider>
    </StrictMode>,
  );
};

const confirmReturning = (status: number, body: Record<string, unknown>) => {
  const received: unknown[] = [];
  server.use(
    http.get("/api/google/auth/status", () => HttpResponse.json({ connected: false })),
    http.post("/api/google/auth/confirm", async ({ request }) => {
      received.push(await request.json());
      return HttpResponse.json(body, { status });
    }),
  );
  return received;
};

beforeEach(() => {
  window.history.replaceState({}, "", "/settings");
});

describe("SettingsContent finishing the Google connect", () => {
  it("redeems the code Google sent back, once, and says it's connected", async () => {
    const received = confirmReturning(200, { connected: true });
    returnFromGoogle();

    renderSettings();

    expect(await screen.findByText("Google Calendar connected.")).toBeInTheDocument();
    expect(received).toEqual([{ code: "the-code", state: "the-state" }]);
  });

  it("takes the one-time code out of the address bar", async () => {
    confirmReturning(200, { connected: true });
    returnFromGoogle();

    renderSettings();

    await screen.findByText("Google Calendar connected.");
    expect(window.location.search).not.toContain("code=");
  });

  it("explains a connect that was started from a different account", async () => {
    confirmReturning(403, { error: "This Google connection was started by a different account" });
    returnFromGoogle();

    renderSettings();

    expect(
      await screen.findByText(/started from a different account/i),
    ).toBeInTheDocument();
  });

  it("says so when Google refuses the redeem, and when the request itself fails", async () => {
    confirmReturning(500, { error: "boom" });
    returnFromGoogle();
    const first = renderSettings();
    expect(
      await screen.findByText(/something went wrong connecting google calendar/i),
    ).toBeInTheDocument();
    first.unmount();

    server.use(
      http.post("/api/google/auth/confirm", () => HttpResponse.error()),
    );
    returnFromGoogle();
    renderSettings();
    expect(
      await screen.findByText(/something went wrong connecting google calendar/i),
    ).toBeInTheDocument();
  });

  it("shows the account as connected once the code has been redeemed", async () => {
    server.use(
      http.get("/api/google/auth/status", () => HttpResponse.json({ connected: true })),
      http.post("/api/google/auth/confirm", () => HttpResponse.json({ connected: true })),
    );
    returnFromGoogle();
    renderSettings();
    expect(await screen.findByRole("button", { name: /disconnect/i })).toBeInTheDocument();
  });

  it("marks the cached connection status stale so the calendar header catches up", async () => {
    confirmReturning(200, { connected: true });
    returnFromGoogle();
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    client.setQueryData(queryKeys.google.authStatus(), { connected: false });

    render(
      <QueryClientProvider client={client}>
        <SettingsContent version="9.9.9" />
      </QueryClientProvider>,
    );

    await screen.findByText("Google Calendar connected.");
    expect(client.getQueryState(queryKeys.google.authStatus())?.isInvalidated).toBe(true);
  });

  it("does not redeem anything when the return link has no code", async () => {
    const received = confirmReturning(200, { connected: true });
    window.history.replaceState({}, "", "/settings?gcal=confirm&state=only-a-state");
    renderSettings();
    expect(await screen.findByRole("button", { name: /connect/i })).toBeInTheDocument();
    expect(received).toEqual([]);
  });
});

describe("SettingsContent banners from the OAuth callback", () => {
  const openWith = (query: string) => {
    server.use(http.get("/api/google/auth/status", () => HttpResponse.json({ connected: false })));
    window.history.replaceState({}, "", `/settings?${query}`);
    renderSettings();
  };

  it.each([
    ["gcal=connected", /google calendar connected/i],
    ["gcal=denied", /connection was cancelled/i],
    ["gcal=error", /something went wrong connecting google calendar/i],
  ])("shows the right message for ?%s", async (query, message) => {
    openWith(query);
    expect(await screen.findByText(message)).toBeInTheDocument();
  });

  it("shows no banner on a plain visit", async () => {
    openWith("");
    await screen.findByRole("button", { name: /connect/i });
    expect(screen.queryByRole("button", { name: "Dismiss" })).not.toBeInTheDocument();
  });
});
