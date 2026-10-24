import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { server } from "@/test/server";
import EvarContent from "./EvarContent";
import { CONSENT_VERSION } from "@/lib/evar/research";

vi.mock("@/components/PageHeader", () => ({ default: () => null }));

const participant = {
  id: "22222222-2222-4222-8222-222222222222",
  consentVersion: CONSENT_VERSION,
  consentedAt: "2026-10-22T09:00:00.000Z",
  trainingLevel: "resident",
  trainingYear: 3,
  specialty: null,
};

function study({ signedIn = false, joined = false } = {}) {
  const state = { participant: joined ? participant : null };
  server.use(
    http.get("/api/me", () =>
      HttpResponse.json(signedIn ? { sub: "auth0|me", email: "me@example.com" } : { sub: null, email: null }),
    ),
    http.get("/api/evar/participant", () => HttpResponse.json({ participant: state.participant })),
    http.put("/api/evar/participant", () => {
      state.participant = participant;
      return HttpResponse.json({ participant });
    }),
    http.get("/api/evar/attempts", () => HttpResponse.json({ attempts: [] })),
  );
  return state;
}

const renderPage = () =>
  render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <EvarContent />
    </QueryClientProvider>,
  );

const studyDialog = () => screen.findByRole("dialog", { name: /research study/i });
const tour = () => screen.queryByRole("dialog", { name: /tour/i });

describe("the practice leaves the study question to the welcome page", () => {
  beforeEach(() => window.localStorage.clear());

  it("doesn't ask about the study, and opens the tour on a first practice visit", async () => {
    study();
    renderPage();
    await vi.waitFor(() => expect(tour()).not.toBeNull());
    expect(screen.queryByRole("dialog", { name: /research study/i })).toBeNull();
  });

  it("still offers the study at the bottom of the page for anyone who skipped it", async () => {
    study();
    renderPage();
    expect(await screen.findByRole("link", { name: /sign in to join the study/i })).toHaveAttribute(
      "href",
      expect.stringContaining("/auth/login"),
    );
  });
});
