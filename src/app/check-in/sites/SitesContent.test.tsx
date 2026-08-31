import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { http, HttpResponse } from "msw";
import { server } from "@/test/server";
import SitesContent from "./SitesContent";

const SITE = "11111111-1111-4111-8111-111111111111";

const created: unknown[] = [];

function renderPage() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <SitesContent />
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  created.length = 0;
  server.use(
    http.get("/api/check-in/sites", () =>
      HttpResponse.json({
        sites: [{ id: SITE, name: "Riverside Food Bank", periodSeconds: 120 }],
      }),
    ),
    http.post("/api/check-in/sites", async ({ request }) => {
      created.push(await request.json());
      return HttpResponse.json(
        { site: { id: "new-id", name: "Depot", periodSeconds: 120 } },
        { status: 201 },
      );
    }),
    http.get(`/api/check-in/sites/${SITE}/arrivals`, () =>
      HttpResponse.json({
        siteName: "Riverside Food Bank",
        arrivals: [
          { id: "a1", email: "vol@example.com", at: "2026-08-30T13:04:00.000Z" },
        ],
      }),
    ),
  );
});

describe("SitesContent", () => {
  it("lists the sites with a way to open the display for one", async () => {
    renderPage();
    expect(await screen.findByText("Riverside Food Bank")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /open display/i }),
    ).toHaveAttribute("href", `/check-in/display?site=${SITE}`);
  });

  it("offers the volunteer link for a site, since that is what goes on the poster", async () => {
    renderPage();
    expect(await screen.findByText(new RegExp(`/check-in\\?site=${SITE}`))).toBeInTheDocument();
  });

  it("creates a site", async () => {
    const user = userEvent.setup();
    renderPage();

    await user.type(await screen.findByLabelText(/site name/i), "Depot");
    await user.click(screen.getByRole("button", { name: /add site/i }));

    expect(created).toEqual([{ name: "Depot" }]);
  });

  it("shows who arrived today when a site is opened", async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(
      await screen.findByRole("button", { name: /today.s arrivals/i }),
    );

    expect(await screen.findByText("vol@example.com")).toBeInTheDocument();
  });

  it("says the roster is empty rather than showing nothing", async () => {
    server.use(
      http.get(`/api/check-in/sites/${SITE}/arrivals`, () =>
        HttpResponse.json({ siteName: "Riverside Food Bank", arrivals: [] }),
      ),
    );
    const user = userEvent.setup();
    renderPage();

    await user.click(
      await screen.findByRole("button", { name: /today.s arrivals/i }),
    );

    expect(await screen.findByText(/nobody has checked in/i)).toBeInTheDocument();
  });

  it("explains a failure instead of rendering an empty list", async () => {
    server.use(
      http.get("/api/check-in/sites", () =>
        HttpResponse.json({ error: "nope" }, { status: 500 }),
      ),
    );
    renderPage();
    expect(await screen.findByRole("alert")).toBeInTheDocument();
  });
});
