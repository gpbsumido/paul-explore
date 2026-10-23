import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { server } from "@/test/server";
import { axe } from "@/test/a11y";
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

/**
 * Stands up the BFF the panel talks to, with the participant held in a closure
 * so joining and withdrawing change what the next GET returns.
 */
function study({ signedIn = true, joined = false } = {}) {
  const state = {
    participant: joined ? participant : null,
    puts: [] as unknown[],
    posts: [] as Record<string, unknown>[],
    deletes: 0,
  };
  server.use(
    http.get("/api/me", () =>
      HttpResponse.json(signedIn ? { sub: "auth0|me", email: "me@example.com" } : { sub: null, email: null }),
    ),
    http.get("/api/evar/participant", () => HttpResponse.json({ participant: state.participant })),
    http.put("/api/evar/participant", async ({ request }) => {
      state.puts.push(await request.json());
      state.participant = participant;
      return HttpResponse.json({ participant });
    }),
    http.delete("/api/evar/participant", () => {
      state.deletes += 1;
      state.participant = null;
      return new HttpResponse(null, { status: 204 });
    }),
    http.get("/api/evar/attempts", () => HttpResponse.json({ attempts: [] })),
    http.post("/api/evar/attempts", async ({ request }) => {
      const body = (await request.json()) as Record<string, unknown>;
      state.posts.push(body);
      return HttpResponse.json(
        {
          attempt: {
            id: "33333333-3333-4333-8333-333333333333",
            caseId: body.caseId,
            level: body.level,
            submittedAt: body.submittedAt,
            durationMs: body.durationMs,
            timedOut: body.timedOut,
            scores: body.scores,
          },
        },
        { status: 201 },
      );
    }),
  );
  return state;
}

const renderPage = () => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <EvarContent />
    </QueryClientProvider>,
  );
};

const checkAnswers = () => fireEvent.click(screen.getByRole("button", { name: /check answers/i }));

describe("EVAR research panel", () => {
  it("asks a signed-out visitor to sign in, and practice still works without it", async () => {
    const state = study({ signedIn: false });
    renderPage();
    const signIn = await screen.findByRole("link", { name: /sign in/i });
    expect(signIn.getAttribute("href")).toContain("/auth/login");
    expect(signIn.getAttribute("href")).toContain("evar");

    checkAnswers();
    expect(screen.getByRole("table", { name: /results/i })).toBeInTheDocument();
    expect(state.posts).toHaveLength(0);
  });

  it("only lets someone join once they've agreed and said where they are in training", async () => {
    const state = study();
    renderPage();
    const join = await screen.findByRole("button", { name: /join the study/i });
    expect(join).toBeDisabled();

    fireEvent.change(screen.getByRole("combobox", { name: /training level/i }), { target: { value: "resident" } });
    expect(join).toBeDisabled();
    fireEvent.click(screen.getByRole("checkbox", { name: /i agree/i }));
    expect(join).toBeEnabled();

    fireEvent.click(join);
    expect(await screen.findByText(/you're in the study/i)).toBeInTheDocument();
    expect(state.puts[0]).toMatchObject({ consentVersion: CONSENT_VERSION, trainingLevel: "resident" });
  });

  it("records a participant's attempt once, however many times they check", async () => {
    const state = study({ joined: true });
    renderPage();
    await screen.findByText(/you're in the study/i);

    checkAnswers();
    expect(await screen.findByText(/saved to your record/i)).toBeInTheDocument();
    checkAnswers();

    await waitFor(() => expect(state.posts).toHaveLength(1));
    expect(state.posts[0]).toMatchObject({ caseId: "long-neck", level: "medium", timedOut: false });
    expect(state.posts[0].clientAttemptId).toMatch(/^[0-9a-f-]{36}$/);
  });

  it("asks before withdrawing, then deletes and goes back to the consent form", async () => {
    const state = study({ joined: true });
    renderPage();
    fireEvent.click(await screen.findByRole("button", { name: /withdraw and delete my data/i }));
    expect(state.deletes).toBe(0);

    fireEvent.click(screen.getByRole("button", { name: /yes, delete everything/i }));
    expect(await screen.findByRole("button", { name: /join the study/i })).toBeInTheDocument();
    expect(state.deletes).toBe(1);
  });

  it("the consent form has no axe violations", async () => {
    study();
    const { container } = renderPage();
    await screen.findByRole("button", { name: /join the study/i });
    expect(await axe(container)).toHaveNoViolations();
  });
});
