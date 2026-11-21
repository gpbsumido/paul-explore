import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
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

  it("creates a site from the trimmed name and clears the field for the next one", async () => {
    const user = userEvent.setup();
    renderPage();

    const field = await screen.findByLabelText(/site name/i);
    await user.type(field, "  Depot  ");
    await user.click(screen.getByRole("button", { name: /add site/i }));

    expect(created).toEqual([{ name: "Depot" }]);
    await waitFor(() => expect(field).toHaveValue(""));
  });

  it("does not post a blank name", async () => {
    const user = userEvent.setup();
    renderPage();

    await user.type(await screen.findByLabelText(/site name/i), "   ");
    await user.click(screen.getByRole("button", { name: /add site/i }));
    // Give a wrongly-sent request time to land before saying none did.
    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(created).toEqual([]);
  });

  it("closes the roster again when the same site is toggled twice", async () => {
    const user = userEvent.setup();
    renderPage();

    const toggle = await screen.findByRole("button", { name: /today.s arrivals/i });
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    await user.click(toggle);
    expect(await screen.findByText("vol@example.com")).toBeInTheDocument();
    expect(toggle).toHaveAttribute("aria-expanded", "true");

    await user.click(toggle);
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByText("vol@example.com")).not.toBeInTheDocument();
  });

  it("names an arrival without an email as a volunteer", async () => {
    server.use(
      http.get(`/api/check-in/sites/${SITE}/arrivals`, () =>
        HttpResponse.json({
          siteName: "Riverside Food Bank",
          arrivals: [{ id: "a2", email: null, at: "2026-08-30T13:10:00.000Z" }],
        }),
      ),
    );
    const user = userEvent.setup();
    renderPage();

    await user.click(await screen.findByRole("button", { name: /today.s arrivals/i }));

    expect(await screen.findByText("Volunteer")).toBeInTheDocument();
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

  it("says a failed add failed, and keeps the name to try again", async () => {
    server.use(
      http.post("/api/check-in/sites", () =>
        HttpResponse.json({ error: "Backend unavailable" }, { status: 502 }),
      ),
    );
    const user = userEvent.setup();
    renderPage();

    const field = await screen.findByLabelText(/site name/i);
    await user.type(field, "Depot");
    await user.click(screen.getByRole("button", { name: /add site/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent(/couldn.t add the site/i);
    expect(field).toHaveValue("Depot");
  });

  it("says when the add never reached the server", async () => {
    server.use(http.post("/api/check-in/sites", () => HttpResponse.error()));
    const user = userEvent.setup();
    renderPage();

    await user.type(await screen.findByLabelText(/site name/i), "Depot");
    await user.click(screen.getByRole("button", { name: /add site/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent(/couldn.t reach the server/i);
  });
});
