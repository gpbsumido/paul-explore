import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { http, HttpResponse } from "msw";
import { server } from "@/test/server";
import CheckInContent from "./CheckInContent";

const params = vi.hoisted(() => vi.fn(() => new URLSearchParams()));
vi.mock("next/navigation", () => ({ useSearchParams: () => params() }));

const SITE = "11111111-1111-4111-8111-111111111111";

/** What the volunteer's phone posts, so tests can assert the contract. */
const posted: { body: unknown[] } = { body: [] };

function renderPage() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <CheckInContent />
    </QueryClientProvider>,
  );
}

/** Signs in by default; individual tests override. */
const signedIn = (email: string | null = "vol@example.com") =>
  http.get("/api/me", () =>
    HttpResponse.json({ name: "Vol", email, sub: email ? "auth0|vol" : null }),
  );

const arrivalsOk = () =>
  http.post("/api/check-in/arrivals", async ({ request }) => {
    posted.body.push(await request.json());
    return HttpResponse.json(
      {
        status: "recorded",
        siteName: "Riverside Food Bank",
        arrival: { id: "a1", at: "2026-08-30T13:04:00.000Z" },
      },
      { status: 201 },
    );
  });

beforeEach(() => {
  posted.body = [];
  params.mockReturnValue(new URLSearchParams(`site=${SITE}`));
  server.use(signedIn(), arrivalsOk());
});

describe("CheckInContent", () => {
  it("records an arrival and says when it was", async () => {
    const user = userEvent.setup();
    renderPage();

    await user.type(await screen.findByLabelText(/code/i), "123456");
    await user.click(screen.getByRole("button", { name: /confirm arrival/i }));

    expect(await screen.findByText(/checked in/i)).toBeInTheDocument();
    expect(screen.getByText(/Riverside Food Bank/)).toBeInTheDocument();
    expect(posted.body).toEqual([{ siteId: SITE, code: "123456" }]);
  });

  it("says a wrong code is wrong without wiping what was typed", async () => {
    server.use(
      http.post("/api/check-in/arrivals", () =>
        HttpResponse.json(
          { message: "That code is wrong or has expired" },
          { status: 400 },
        ),
      ),
    );
    const user = userEvent.setup();
    renderPage();

    const field = await screen.findByLabelText(/code/i);
    await user.type(field, "000000");
    await user.click(screen.getByRole("button", { name: /confirm arrival/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent(/wrong|expired/i);
    // Retyping six digits on a phone because the app cleared them is the kind
    // of small cruelty that makes people stop using it.
    expect(field).toHaveValue("000000");
  });

  it("explains a throttled attempt rather than showing it as a wrong code", async () => {
    server.use(
      http.post("/api/check-in/arrivals", () =>
        HttpResponse.json(
          { message: "Too many attempts. Wait for the next code." },
          { status: 429 },
        ),
      ),
    );
    const user = userEvent.setup();
    renderPage();

    await user.type(await screen.findByLabelText(/code/i), "000000");
    await user.click(screen.getByRole("button", { name: /confirm arrival/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent(/too many/i);
  });

  it("tells someone already checked in that they are, without recording again", async () => {
    server.use(
      http.post("/api/check-in/arrivals", () =>
        HttpResponse.json(
          {
            status: "already",
            siteName: "Riverside Food Bank",
            arrival: { id: "a1", at: "2026-08-30T13:04:00.000Z" },
          },
          { status: 200 },
        ),
      ),
    );
    const user = userEvent.setup();
    renderPage();

    await user.type(await screen.findByLabelText(/code/i), "123456");
    await user.click(screen.getByRole("button", { name: /confirm arrival/i }));

    expect(await screen.findByText(/already checked in/i)).toBeInTheDocument();
  });

  it("asks a signed-out volunteer to sign in rather than failing on submit", async () => {
    server.use(signedIn(null));
    renderPage();

    expect(await screen.findByRole("link", { name: /sign in/i })).toHaveAttribute(
      "href",
      expect.stringContaining("/auth/login"),
    );
    expect(screen.queryByRole("button", { name: /confirm arrival/i })).not.toBeInTheDocument();
  });

  it("says which link to use when the site is missing from the URL", async () => {
    params.mockReturnValue(new URLSearchParams());
    renderPage();

    // Without a site there is nothing to check into; guessing one would be
    // worse than saying so.
    expect(await screen.findByText(/which site/i)).toBeInTheDocument();
    expect(screen.queryByLabelText(/code/i)).not.toBeInTheDocument();
  });

  it("does not submit a code that is not six digits", async () => {
    const user = userEvent.setup();
    renderPage();

    await user.type(await screen.findByLabelText(/code/i), "123");
    await user.click(screen.getByRole("button", { name: /confirm arrival/i }));

    expect(posted.body).toEqual([]);
    expect(await screen.findByRole("alert")).toHaveTextContent(/six digits/i);
  });
});
