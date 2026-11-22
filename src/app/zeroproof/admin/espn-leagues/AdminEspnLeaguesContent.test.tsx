import { describe, it, expect, afterEach } from "vitest";
import { act, render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { MutationCache, QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@paul-portfolio/react";
import { notifyMutationError } from "@/lib/mutationErrorToast";
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

  it("sends the chosen sport and a trimmed id, season and label", async () => {
    const posted: Record<string, unknown>[] = [];
    server.use(
      http.get("/api/zeroproof/espn-leagues", () => HttpResponse.json({ leagues: [] })),
      http.post("/api/zeroproof/espn-leagues", async ({ request }) => {
        posted.push((await request.json()) as Record<string, unknown>);
        return HttpResponse.json({ league: league() }, { status: 201 });
      }),
    );
    renderAdmin();
    const user = userEvent.setup();
    await user.selectOptions(await screen.findByLabelText("Sport"), "fba");
    await user.type(screen.getByLabelText(/ESPN league id/i), "  449389534 ");
    await user.type(screen.getByLabelText(/^season$/i), " 2026 ");
    await user.type(screen.getByLabelText(/label/i), "  Work league ");

    await user.click(screen.getByRole("button", { name: /^add league$/i }));

    await waitFor(() => expect(posted).toHaveLength(1));
    expect(posted[0]).toEqual({
      game: "fba",
      leagueId: "449389534",
      season: "2026",
      label: "Work league",
    });
  });

  it("leaves the label out when none was typed", async () => {
    const posted: Record<string, unknown>[] = [];
    server.use(
      http.get("/api/zeroproof/espn-leagues", () => HttpResponse.json({ leagues: [] })),
      http.post("/api/zeroproof/espn-leagues", async ({ request }) => {
        posted.push((await request.json()) as Record<string, unknown>);
        return HttpResponse.json({ league: league() }, { status: 201 });
      }),
    );
    renderAdmin();
    const user = userEvent.setup();
    await user.type(await screen.findByLabelText(/ESPN league id/i), "836777691");
    await user.type(screen.getByLabelText(/^season$/i), "2026");
    await user.type(screen.getByLabelText(/label/i), "   ");

    await user.click(screen.getByRole("button", { name: /^add league$/i }));

    await waitFor(() => expect(posted).toHaveLength(1));
    expect(posted[0]).not.toHaveProperty("label");
  });

  it("clears the form and shows the new league once it is added", async () => {
    let registered = [] as ReturnType<typeof league>[];
    server.use(
      http.get("/api/zeroproof/espn-leagues", () => HttpResponse.json({ leagues: registered })),
      http.post("/api/zeroproof/espn-leagues", () => {
        registered = [league({ leagueId: "111222333" })];
        return HttpResponse.json({ league: registered[0] }, { status: 201 });
      }),
    );
    renderAdmin();
    const user = userEvent.setup();
    await user.type(await screen.findByLabelText(/ESPN league id/i), "111222333");
    await user.type(screen.getByLabelText(/^season$/i), "2026");

    await user.click(screen.getByRole("button", { name: /^add league$/i }));

    const table = await screen.findByRole("table", { name: /registered espn leagues/i });
    expect(table).toHaveTextContent("111222333");
    expect(screen.getByLabelText(/ESPN league id/i)).toHaveValue("");
    expect(screen.getByLabelText(/^season$/i)).toHaveValue("");
  });

  it("shows the server's reason when adding fails, and keeps what was typed", async () => {
    server.use(
      http.get("/api/zeroproof/espn-leagues", () => HttpResponse.json({ leagues: [] })),
      http.post("/api/zeroproof/espn-leagues", () =>
        HttpResponse.json({ error: "League already registered" }, { status: 409 }),
      ),
    );
    renderAdmin();
    const user = userEvent.setup();
    await user.type(await screen.findByLabelText(/ESPN league id/i), "836777691");
    await user.type(screen.getByLabelText(/^season$/i), "2026");

    await user.click(screen.getByRole("button", { name: /^add league$/i }));

    expect(await screen.findByText("League already registered")).toBeInTheDocument();
    expect(screen.getByLabelText(/ESPN league id/i)).toHaveValue("836777691");
  });

  it("falls back to a generic message when a refused add says nothing", async () => {
    server.use(
      http.get("/api/zeroproof/espn-leagues", () => HttpResponse.json({ leagues: [] })),
      http.post("/api/zeroproof/espn-leagues", () => new HttpResponse(null, { status: 500 })),
    );
    renderAdmin();
    const user = userEvent.setup();
    await user.type(await screen.findByLabelText(/ESPN league id/i), "836777691");
    await user.type(screen.getByLabelText(/^season$/i), "2026");

    await user.click(screen.getByRole("button", { name: /^add league$/i }));

    expect(await screen.findByText("Couldn't add the league (500)")).toBeInTheDocument();
  });

  it("shows a dash for a league with no label", async () => {
    server.use(
      http.get("/api/zeroproof/espn-leagues", () =>
        HttpResponse.json({ leagues: [league({ label: null })] }),
      ),
    );
    renderAdmin();
    const table = await screen.findByRole("table", { name: /registered espn leagues/i });
    expect(table).toHaveTextContent("\u2014");
  });

  it("removes the league that was clicked, and no other", async () => {
    const deleted: string[] = [];
    let registered = [league({ id: "r1", leagueId: "111" }), league({ id: "r2", leagueId: "222" })];
    server.use(
      http.get("/api/zeroproof/espn-leagues", () => HttpResponse.json({ leagues: registered })),
      http.delete("/api/zeroproof/espn-leagues/:id", ({ params }) => {
        deleted.push(String(params.id));
        registered = registered.filter((entry) => entry.id !== params.id);
        return new HttpResponse(null, { status: 204 });
      }),
    );
    renderAdmin();
    const user = userEvent.setup();

    await user.click(
      await screen.findByRole("button", { name: "Remove ffl:222:2026" }),
    );

    await waitFor(() =>
      expect(screen.queryByRole("button", { name: "Remove ffl:222:2026" })).toBeNull(),
    );
    expect(deleted).toEqual(["r2"]);
    expect(screen.getByRole("button", { name: "Remove ffl:111:2026" })).toBeInTheDocument();
  });

  it("says the list could not be loaded, and says when none are registered", async () => {
    server.use(
      http.get("/api/zeroproof/espn-leagues", () => new HttpResponse(null, { status: 500 })),
    );
    const failed = renderAdmin();
    expect(
      await screen.findByText("Couldn't load ESPN leagues (500)"),
    ).toBeInTheDocument();
    failed.unmount();

    server.use(
      http.get("/api/zeroproof/espn-leagues", () => HttpResponse.json({ leagues: [] })),
    );
    renderAdmin();
    expect(await screen.findByText(/no leagues registered yet/i)).toBeInTheDocument();
  });

  // A failed remove shows no inline message; it rides the app-wide
  // MutationCache toast (providers.tsx), wired the same way here.
  it("says why a league could not be removed, through the app-wide toast", async () => {
    server.use(
      http.get("/api/zeroproof/espn-leagues", () => HttpResponse.json({ leagues: [league()] })),
      http.delete("/api/zeroproof/espn-leagues/:id", () => new HttpResponse(null, { status: 500 })),
    );
    const client = new QueryClient({
      mutationCache: new MutationCache({
        onError: (error, _variables, _context, mutation) =>
          notifyMutationError(error, mutation.meta),
      }),
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
    render(
      <QueryClientProvider client={client}>
        <ThemeProvider>
          <AdminEspnLeaguesContent />
          <Toaster />
        </ThemeProvider>
      </QueryClientProvider>,
    );
    const user = userEvent.setup();

    await user.click(await screen.findByRole("button", { name: /^Remove ffl/ }));

    expect(await screen.findByText(/couldn't remove the league/i)).toBeInTheDocument();
    act(() => {
      document
        .querySelectorAll(".toast__dismiss")
        .forEach((button) => (button as HTMLElement).click());
    });
  });

  it("has no axe violations", async () => {
    server.use(http.get("/api/zeroproof/espn-leagues", () => HttpResponse.json({ leagues: [league()] })));
    const { container } = renderAdmin();
    await screen.findByRole("table", { name: /registered espn leagues/i });
    expect(await axe(container)).toHaveNoViolations();
  });
});
