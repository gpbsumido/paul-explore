import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { server } from "@/test/server";
import StudyInvite from "./StudyInvite";
import EvarContent from "../EvarContent";
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

function study({ signedIn = false, joined = false, broken = false } = {}) {
  const state = { participant: joined ? participant : null };
  server.use(
    http.get("/api/me", () =>
      HttpResponse.json(signedIn ? { sub: "auth0|me", email: "me@example.com" } : { sub: null, email: null }),
    ),
    http.get("/api/evar/participant", () =>
      broken ? new HttpResponse(null, { status: 503 }) : HttpResponse.json({ participant: state.participant }),
    ),
    http.put("/api/evar/participant", () => {
      state.participant = participant;
      return HttpResponse.json({ participant });
    }),
    http.get("/api/evar/attempts", () => HttpResponse.json({ attempts: [] })),
  );
  return state;
}

const withQueries = (ui: React.ReactElement) => (
  <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>{ui}</QueryClientProvider>
);

describe("StudyInvite", () => {
  beforeEach(() => window.localStorage.clear());

  it("offers a signed-out visitor sign-in that comes back here, or practice without joining", async () => {
    study();
    render(withQueries(<StudyInvite />));
    const signIn = await screen.findByRole("link", { name: /sign in to join/i });
    expect(signIn).toHaveAttribute("href", "/auth/login?returnTo=%2Fevar%2Fwelcome");
    expect(screen.getByRole("link", { name: /practise without joining/i })).toHaveAttribute("href", "/evar");
  });

  it("remembers the answer, so the practice doesn't ask again", async () => {
    study();
    const welcome = render(withQueries(<StudyInvite />));
    fireEvent.click(await screen.findByRole("link", { name: /practise without joining/i }));
    expect(window.localStorage.getItem("evar-study-asked")).toBe("true");
    welcome.unmount();
    render(withQueries(<EvarContent />));
    await vi.waitFor(() => expect(screen.queryByRole("dialog", { name: /tour/i })).not.toBeNull());
    expect(screen.queryByRole("dialog", { name: /research study/i })).toBeNull();
  });

  it("lets a signed-in visitor consent on the page, then says they're in", async () => {
    const state = study({ signedIn: true });
    render(withQueries(<StudyInvite />));
    fireEvent.change(await screen.findByRole("combobox", { name: /training level/i }), { target: { value: "resident" } });
    fireEvent.click(screen.getByRole("checkbox", { name: /i agree/i }));
    fireEvent.click(screen.getByRole("button", { name: /join the study/i }));
    expect(await screen.findByText(/you.re in the study/i)).toBeInTheDocument();
    expect(state.participant).not.toBeNull();
    expect(window.localStorage.getItem("evar-study-asked")).toBe("true");
  });

  it("tells someone who has already joined, instead of asking", async () => {
    study({ signedIn: true, joined: true });
    render(withQueries(<StudyInvite />));
    expect(await screen.findByText(/you.re in the study/i)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /join the study/i })).toBeNull();
  });

  it("says so when the study can't be reached, and still offers practice", async () => {
    study({ signedIn: true, broken: true });
    render(withQueries(<StudyInvite />));
    expect(await screen.findByText(/isn.t reachable right now/i)).toBeInTheDocument();
    expect(within(screen.getByRole("region", { name: /join the study/i })).getByRole("link", { name: /start practising/i })).toHaveAttribute("href", "/evar");
  });
});
