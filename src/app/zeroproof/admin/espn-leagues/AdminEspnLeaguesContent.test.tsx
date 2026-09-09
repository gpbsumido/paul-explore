import { describe, it, expect, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { server } from "@/test/server";
import { ThemeProvider } from "@/components/ThemeProvider";
import { axe } from "@/test/a11y";
import AdminEspnLeaguesContent from "./AdminEspnLeaguesContent";

const league = (overrides: Record<string, unknown> = {}) => ({
  id: "r1",
  game: "ffl",
  leagueId: "836777691",
  season: "2026",
  label: "The office league",
  createdAt: "2026-09-08T00:00:00.000Z",
  ...overrides,
});

const renderAdmin = () => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <ThemeProvider>
        <AdminEspnLeaguesContent />
      </ThemeProvider>
    </QueryClientProvider>,
  );
};

afterEach(() => server.resetHandlers());

describe("AdminEspnLeaguesContent", () => {
  it("lists the registered leagues", async () => {
    server.use(http.get("/api/zeroproof/espn-leagues", () => HttpResponse.json({ leagues: [league()] })));
    renderAdmin();
    const table = await screen.findByRole("table", { name: /registered espn leagues/i });
    expect(table).toHaveTextContent("836777691");
    expect(table).toHaveTextContent("The office league");
  });

  it("has a labelled add form that posts a new league", async () => {
    let captured: Record<string, unknown> | null = null;
    server.use(
      http.get("/api/zeroproof/espn-leagues", () => HttpResponse.json({ leagues: [] })),
      http.post("/api/zeroproof/espn-leagues", async ({ request }) => {
        captured = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json({ league: league() }, { status: 201 });
      }),
    );
    renderAdmin();
    fireEvent.change(await screen.findByLabelText(/ESPN league id/i), {
      target: { value: "836777691" },
    });
    fireEvent.change(screen.getByLabelText(/^season$/i), { target: { value: "2026" } });
    fireEvent.click(screen.getByRole("button", { name: /^add league$/i }));
    await waitFor(() => expect(captured).not.toBeNull());
    expect(captured).toMatchObject({ game: "ffl", leagueId: "836777691", season: "2026" });
  });

  it("has no axe violations", async () => {
    server.use(http.get("/api/zeroproof/espn-leagues", () => HttpResponse.json({ leagues: [league()] })));
    const { container } = renderAdmin();
    await screen.findByRole("table", { name: /registered espn leagues/i });
    expect(await axe(container)).toHaveNoViolations();
  });
});
