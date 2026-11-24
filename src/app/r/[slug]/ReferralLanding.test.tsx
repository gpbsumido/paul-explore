import { describe, it, expect } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { server } from "@/test/server";
import { API_URL } from "@/lib/apiUrl";
import ReferralLanding from "./ReferralLanding";

const BASE = `${API_URL}/api/referrals`;

/** Answers the two calls the landing makes and counts the clicks it records. */
const serveReferral = (targetPath: string | null) => {
  const clicks = { recorded: 0 };
  server.use(
    http.get(`${BASE}/:slug`, () =>
      targetPath === null
        ? new HttpResponse(null, { status: 404 })
        : HttpResponse.json({
            slug: "abc",
            targetPath,
            label: null,
            url: "https://example.com/r/abc",
            clicks: 0,
            createdAt: "2026-09-01T00:00:00.000Z",
          }),
    ),
    http.post(`${BASE}/:slug/clicks`, () => {
      clicks.recorded += 1;
      return HttpResponse.json({ slug: "abc", targetPath: "/x", clicks: 1 });
    }),
  );
  return clicks;
};

const openWelcome = async () => {
  const user = userEvent.setup();
  await user.click(screen.getByRole("button", { name: /open your welcome/i }));
};

describe("ReferralLanding", () => {
  it("counts the visit once, and shows the link's own slug", async () => {
    const clicks = serveReferral("/vitals");
    render(<ReferralLanding slug="abc" />);

    expect(screen.getByText("/r/abc")).toBeInTheDocument();
    await waitFor(() => expect(clicks.recorded).toBe(1));
  });

  it("holds the welcome back until it is opened", () => {
    serveReferral("/vitals");
    render(<ReferralLanding slug="abc" />);

    expect(screen.queryByText(/welcome aboard/i)).toBeNull();
    expect(screen.getByRole("button", { name: /open your welcome/i })).toBeInTheDocument();
  });

  it("sends the visitor to the page the link points at, once it has resolved", async () => {
    serveReferral("/vitals");
    render(<ReferralLanding slug="abc" />);
    await openWelcome();

    // The target arrives after mount, so the link is found once it has resolved.
    const continueLink = await screen.findByRole("link", { name: /continue to \/vitals/i });
    expect(continueLink).toHaveAttribute("href", "/vitals");
    expect(screen.getByRole("link", { name: "Home" })).toHaveAttribute("href", "/");
  });

  it("falls back to the work portfolio when the slug does not resolve", async () => {
    const clicks = serveReferral(null);
    render(<ReferralLanding slug="made-up" />);
    await waitFor(() => expect(clicks.recorded).toBe(1));
    await openWelcome();

    const explore = screen.getByRole("link", { name: /explore the work/i });
    expect(explore).toHaveAttribute("href", "/work-portfolio");
    expect(screen.queryByText(/continue to/i)).toBeNull();
  });

  it("still welcomes the visitor when the API is down", async () => {
    server.use(
      http.get(`${BASE}/:slug`, () => HttpResponse.error()),
      http.post(`${BASE}/:slug/clicks`, () => HttpResponse.error()),
    );
    render(<ReferralLanding slug="abc" />);
    await openWelcome();

    expect(screen.getByText(/welcome aboard/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /explore the work/i })).toHaveAttribute(
      "href",
      "/work-portfolio",
    );
  });
});
