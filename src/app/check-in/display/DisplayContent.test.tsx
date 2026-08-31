import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { http, HttpResponse } from "msw";
import { server } from "@/test/server";
import DisplayContent from "./DisplayContent";

const params = vi.hoisted(() => vi.fn(() => new URLSearchParams()));
vi.mock("next/navigation", () => ({ useSearchParams: () => params() }));

const SITE = "11111111-1111-4111-8111-111111111111";

function renderPage() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <DisplayContent />
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  params.mockReturnValue(new URLSearchParams(`site=${SITE}`));
  server.use(
    http.get(`/api/check-in/sites/${SITE}/code`, () =>
      HttpResponse.json({
        siteName: "Riverside Food Bank",
        code: "482917",
        secondsRemaining: 84,
        periodSeconds: 120,
      }),
    ),
  );
});

describe("DisplayContent", () => {
  it("shows the current code and the site it belongs to", async () => {
    renderPage();
    expect(await screen.findByText("482917")).toBeInTheDocument();
    expect(screen.getByText(/Riverside Food Bank/)).toBeInTheDocument();
  });

  it("says how long the code has left", async () => {
    renderPage();
    expect(await screen.findByText(/1:24|84/)).toBeInTheDocument();
  });

  it("says so rather than showing a stale code when the refresh fails", async () => {
    server.use(
      http.get(`/api/check-in/sites/${SITE}/code`, () =>
        HttpResponse.json({ error: "nope" }, { status: 502 }),
      ),
    );
    renderPage();

    // A code left on screen after it stopped being valid is the worst state
    // this page can be in: volunteers type it and are told they are wrong.
    expect(await screen.findByRole("alert")).toHaveTextContent(/can.?t reach|couldn.?t/i);
    expect(screen.queryByText("482917")).not.toBeInTheDocument();
  });

  it("explains a site you do not own instead of showing an empty screen", async () => {
    server.use(
      http.get(`/api/check-in/sites/${SITE}/code`, () =>
        HttpResponse.json({ message: "Site not found" }, { status: 404 }),
      ),
    );
    renderPage();
    expect(await screen.findByRole("alert")).toHaveTextContent(/not found|don.?t own/i);
  });

  it("says which link to use when no site is given", async () => {
    params.mockReturnValue(new URLSearchParams());
    renderPage();
    expect(await screen.findByText(/which site/i)).toBeInTheDocument();
  });
});
