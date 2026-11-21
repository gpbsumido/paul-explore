import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { http, HttpResponse } from "msw";
import { server } from "@/test/server";
import { PAGE_SIZE, type Pokemon } from "@/types/graphql";
import GraphQLContent from "./GraphQLContent";

vi.mock("@/components/PageHeader", () => ({ default: () => null }));
vi.mock("@/components/PageShell", () => ({
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

afterEach(() => vi.unstubAllGlobals());

/** A Pokémon with the stats and types the card reads. */
const pokemon = (id: number, name: string, types: string[] = ["grass"]): Pokemon => ({
  id,
  name,
  pokemon_v2_pokemontypes: types.map((type) => ({ pokemon_v2_type: { name: type } })),
  pokemon_v2_pokemonstats: [
    { base_stat: 45, pokemon_v2_stat: { name: "hp" } },
    { base_stat: 49, pokemon_v2_stat: { name: "attack" } },
  ],
});

type Variables = { name: string; offset: number; limit: number; type?: string };

/**
 * Answers the GraphQL proxy and records every request's variables. `total` is
 * what the aggregate reports; `pages` returns the Pokémon for each variable set.
 */
function serveGraphql(respond: (variables: Variables) => Pokemon[], total = 2) {
  const seen: Variables[] = [];
  server.use(
    http.post("/api/graphql", async ({ request }) => {
      const { variables } = (await request.json()) as { variables: Variables };
      seen.push(variables);
      return HttpResponse.json({
        data: {
          pokemon_v2_pokemon: respond(variables),
          pokemon_v2_pokemon_aggregate: { aggregate: { count: total } },
        },
      });
    }),
  );
  return seen;
}

function renderPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <GraphQLContent />
    </QueryClientProvider>,
  );
}

describe("GraphQLContent", () => {
  it("lists the first page with readable names and the total", async () => {
    serveGraphql(() => [pokemon(1, "bulbasaur"), pokemon(25, "pikachu", ["electric"])]);
    renderPage();

    expect(await screen.findByText("Bulbasaur")).toBeInTheDocument();
    expect(screen.getByText("Pikachu")).toBeInTheDocument();
    expect(screen.getByText(/Showing/)).toHaveTextContent("Showing 2 of 2 Pokémon");
  });

  it("searches by name once typing pauses, as a contains match", async () => {
    const user = userEvent.setup();
    const seen = serveGraphql((v) =>
      v.name === "%char%" ? [pokemon(4, "charmander", ["fire"])] : [pokemon(1, "bulbasaur")],
    );
    renderPage();
    await screen.findByText("Bulbasaur");

    await user.type(screen.getByRole("searchbox"), "char");

    expect(await screen.findByText("Charmander")).toBeInTheDocument();
    expect(screen.queryByText("Bulbasaur")).not.toBeInTheDocument();
    // Four keystrokes made one request for the settled word, not four.
    expect(seen.filter((v) => v.name !== "%")).toEqual([
      expect.objectContaining({ name: "%char%", offset: 0 }),
    ]);
  });

  it("filters by type, says which, and clears when the pill is pressed again", async () => {
    const user = userEvent.setup();
    const seen = serveGraphql((v) =>
      v.type === "fire" ? [pokemon(4, "charmander", ["fire"])] : [pokemon(1, "bulbasaur")],
    );
    renderPage();
    await screen.findByText("Bulbasaur");

    await user.click(screen.getByRole("button", { name: "fire" }));
    expect(await screen.findByText("Charmander")).toBeInTheDocument();
    expect(screen.getByText(/Showing/)).toHaveTextContent(/Fire type/i);
    expect(seen.at(-1)).toMatchObject({ type: "fire" });

    await user.click(screen.getByRole("button", { name: "fire" }));
    expect(await screen.findByText("Bulbasaur")).toBeInTheDocument();
    expect(screen.getByText(/Showing/)).not.toHaveTextContent(/type/i);
  });

  it("goes back to every type with All", async () => {
    const user = userEvent.setup();
    serveGraphql((v) => (v.type ? [pokemon(4, "charmander", ["fire"])] : [pokemon(1, "bulbasaur")]));
    renderPage();
    await user.click(await screen.findByRole("button", { name: "fire" }));
    await screen.findByText("Charmander");

    await user.click(screen.getByRole("button", { name: "All" }));

    expect(await screen.findByText("Bulbasaur")).toBeInTheDocument();
  });

  it("says nothing matched rather than showing an empty grid", async () => {
    serveGraphql(() => [], 0);
    renderPage();
    expect(await screen.findByText("No Pokémon matched your search.")).toBeInTheDocument();
  });

  it("shows the failure instead of an empty or endless-loading page", async () => {
    server.use(http.post("/api/graphql", () => HttpResponse.json({}, { status: 502 })));
    renderPage();
    expect(await screen.findByText("GraphQL request failed")).toBeInTheDocument();
    expect(screen.queryByText("No Pokémon matched your search.")).not.toBeInTheDocument();
  });

  it("shows the query it is sending, with its variables, when asked", async () => {
    const user = userEvent.setup();
    serveGraphql(() => [pokemon(1, "bulbasaur")]);
    renderPage();
    await screen.findByText("Bulbasaur");
    expect(screen.queryByText(/Live GraphQL Query/)).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /show query/i }));
    const panel = screen.getByText(/Live GraphQL Query/).closest("div")!.parentElement!;
    expect(panel).toHaveTextContent("# variables");
    expect(within(panel).getByText(/"offset": 0/)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /hide query/i }));
    expect(screen.queryByText(/Live GraphQL Query/)).not.toBeInTheDocument();
  });

  it("fetches the next page when the end of the list scrolls into view", async () => {
    // The page keeps one observer on the sentinel; fire it by hand.
    const observers: ((entries: { isIntersecting: boolean }[]) => void)[] = [];
    vi.stubGlobal(
      "IntersectionObserver",
      class {
        constructor(callback: (entries: { isIntersecting: boolean }[]) => void) {
          observers.push(callback);
        }
        observe() {}
        unobserve() {}
        disconnect() {}
      },
    );
    const seen = serveGraphql(
      (v) =>
        Array.from({ length: PAGE_SIZE }, (_, i) =>
          pokemon(v.offset + i + 1, `mon-${v.offset + i + 1}`),
        ),
      PAGE_SIZE * 2,
    );
    renderPage();
    await screen.findByText("Mon 1");

    observers.at(-1)?.([{ isIntersecting: true }]);

    expect(await screen.findByText(`Mon ${PAGE_SIZE + 1}`)).toBeInTheDocument();
    expect(seen.map((v) => v.offset)).toEqual([0, PAGE_SIZE]);
  });

  it("stops asking for pages once a short page has come back", async () => {
    const observers: ((entries: { isIntersecting: boolean }[]) => void)[] = [];
    vi.stubGlobal(
      "IntersectionObserver",
      class {
        constructor(callback: (entries: { isIntersecting: boolean }[]) => void) {
          observers.push(callback);
        }
        observe() {}
        unobserve() {}
        disconnect() {}
      },
    );
    const seen = serveGraphql(() => [pokemon(1, "bulbasaur")]);
    renderPage();
    await screen.findByText("Bulbasaur");

    observers.at(-1)?.([{ isIntersecting: true }]);
    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(seen).toHaveLength(1);
  });
});
