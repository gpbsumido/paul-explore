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

describe("the study comes first", () => {
  beforeEach(() => window.localStorage.clear());

  it("asks a first-time visitor about the study before the tour, and starts the tour once they answer", async () => {
    study();
    renderPage();
    const dialog = await studyDialog();
    expect(tour()).toBeNull();
    expect(within(dialog).getByRole("link", { name: /sign in to join/i })).toHaveAttribute("href", expect.stringContaining("/auth/login"));
    fireEvent.click(within(dialog).getByRole("button", { name: /practise without joining/i }));
    expect(screen.queryByRole("dialog", { name: /research study/i })).toBeNull();
    expect(tour()).not.toBeNull();
  });

  it("lets a signed-in visitor consent right there, then carries on", async () => {
    const state = study({ signedIn: true });
    renderPage();
    const dialog = await studyDialog();
    fireEvent.change(within(dialog).getByRole("combobox", { name: /training level/i }), { target: { value: "resident" } });
    fireEvent.click(within(dialog).getByRole("checkbox", { name: /i agree/i }));
    fireEvent.click(within(dialog).getByRole("button", { name: /join the study/i }));
    await vi.waitFor(() => expect(screen.queryByRole("dialog", { name: /research study/i })).toBeNull());
    expect(state.participant).not.toBeNull();
    expect(tour()).not.toBeNull();
  });

  it("doesn't ask someone who has already joined", async () => {
    study({ signedIn: true, joined: true });
    renderPage();
    await vi.waitFor(() => expect(tour()).not.toBeNull());
    expect(screen.queryByRole("dialog", { name: /research study/i })).toBeNull();
  });

  it("only asks once, so saying no is remembered", async () => {
    study();
    const first = renderPage();
    fireEvent.click(within(await studyDialog()).getByRole("button", { name: /practise without joining/i }));
    first.unmount();
    renderPage();
    await vi.waitFor(() => expect(tour()).not.toBeNull());
    expect(screen.queryByRole("dialog", { name: /research study/i })).toBeNull();
  });
});
