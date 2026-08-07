import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { http, HttpResponse } from "msw";
import { server } from "@/test/server";
import { TOPICS, JOURNALS, DEMOGRAPHICS } from "@/lib/research/data";
import ResearchContent from "./ResearchContent";

/** Requests the page made, so tests can assert the query contract. */
const seen = { topics: 0, publicationUrls: [] as string[] };

const topicsPayload = () => ({
  topics: TOPICS.map((t, i) => {
    if (i === 0) return { id: t.id, total: 0, recent: 0, status: "none" };
    if (i === 1) return { id: t.id, total: 12, recent: 4, status: "sparse" };
    return { id: t.id, total: 120, recent: 40, status: "active" };
  }),
});

const publication = (title: string) => ({
  id: "33",
  title,
  journal: "Journal of Vascular Surgery",
  pubDate: "2026 Feb",
  authors: ["Smith J"],
  doi: null,
  url: "https://pubmed.ncbi.nlm.nih.gov/33/",
  source: "pubmed",
});

beforeEach(() => {
  seen.topics = 0;
  seen.publicationUrls = [];
  server.use(
    http.get("/api/research/topics", () => {
      seen.topics += 1;
      return HttpResponse.json(topicsPayload());
    }),
    http.get("/api/research/publications", ({ request }) => {
      seen.publicationUrls.push(request.url);
      const params = new URL(request.url).searchParams;
      const title = params.get("journal")
        ? "Journal paper"
        : params.get("demo")
          ? "Filtered paper"
          : "Topic paper";
      return HttpResponse.json({
        total: 1,
        publications: [publication(title)],
        sources: ["pubmed", "europepmc"],
      });
    }),
    http.get("/api/research/demographics", () =>
      HttpResponse.json({
        facets: DEMOGRAPHICS.map((d) => ({ id: d.id, count: 7 })),
      }),
    ),
  );
});

function renderPage() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <ResearchContent />
    </QueryClientProvider>,
  );
}

describe("ResearchContent", () => {
  it("lists every curated topic with its evidence badge", async () => {
    renderPage();
    expect(await screen.findByText("No research yet")).toBeInTheDocument();
    expect(screen.getByText("Sparse")).toBeInTheDocument();
    expect(screen.getAllByText("Active").length).toBe(TOPICS.length - 2);
    expect(screen.getByText(TOPICS[0].name)).toBeInTheDocument();
    expect(screen.getByText(TOPICS[1].name)).toBeInTheDocument();
  });

  it("opens a topic to show its recent publications with PubMed links", async () => {
    const user = userEvent.setup();
    renderPage();
    await user.click(
      await screen.findByRole("button", { name: new RegExp(TOPICS[1].name) }),
    );
    const link = await screen.findByRole("link", { name: /Topic paper/ });
    expect(link).toHaveAttribute("href", "https://pubmed.ncbi.nlm.nih.gov/33/");
  });

  it("applies demographic filters to a topic's publication list", async () => {
    const user = userEvent.setup();
    renderPage();
    await user.click(
      await screen.findByRole("button", { name: new RegExp(TOPICS[1].name) }),
    );
    await screen.findByRole("link", { name: /Topic paper/ });
    await user.click(
      screen.getByRole("checkbox", { name: DEMOGRAPHICS[0].label }),
    );
    await screen.findByRole("link", { name: /Filtered paper/ });
    const last = seen.publicationUrls.at(-1) ?? "";
    expect(new URL(last).searchParams.get("demo")).toBe(DEMOGRAPHICS[0].id);
  });

  it("browses recent research journal by journal", async () => {
    const user = userEvent.setup();
    renderPage();
    await user.click(await screen.findByRole("tab", { name: "Journals" }));
    await user.click(
      await screen.findByRole("button", { name: new RegExp(JOURNALS[0].name) }),
    );
    const link = await screen.findByRole("link", { name: /Journal paper/ });
    expect(link).toHaveAttribute("href", "https://pubmed.ncbi.nlm.nih.gov/33/");
    const last = seen.publicationUrls.at(-1) ?? "";
    expect(new URL(last).searchParams.get("journal")).toBe(JOURNALS[0].id);
  });

  it("shows how much literature covers each demographic lens", async () => {
    const user = userEvent.setup();
    renderPage();
    await user.click(await screen.findByRole("tab", { name: "Demographics" }));
    expect(await screen.findByText(DEMOGRAPHICS[0].label)).toBeInTheDocument();
    expect((await screen.findAllByText("7")).length).toBeGreaterThan(0);
  });

  it("refreshes the evidence scan on demand", async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findByText("No research yet");
    expect(seen.topics).toBe(1);
    await user.click(screen.getByRole("button", { name: /Refresh/ }));
    await expect.poll(() => seen.topics).toBe(2);
  });

  it("names both databases it draws on, and links them", async () => {
    renderPage();
    expect(await screen.findByRole("link", { name: "PubMed" })).toHaveAttribute(
      "href",
      "https://pubmed.ncbi.nlm.nih.gov/",
    );
    expect(screen.getByRole("link", { name: "Europe PMC" })).toHaveAttribute(
      "href",
      "https://europepmc.org/",
    );
  });
});

describe("ResearchContent discovered topics", () => {
  beforeEach(() => {
    server.use(
      http.get("/api/research/discover", () =>
        HttpResponse.json({
          topics: [
            {
              id: "mesh-sarcopenia",
              name: "Sarcopenia",
              papers: 6,
              total: 14,
              recent: 5,
              status: "sparse",
            },
          ],
        }),
      ),
    );
  });

  it("lists topics derived from what the field is publishing now", async () => {
    const user = userEvent.setup();
    renderPage();
    await user.click(await screen.findByRole("tab", { name: "Discovered" }));
    expect(await screen.findByText("Sarcopenia")).toBeInTheDocument();
    expect(screen.getByText("Sparse")).toBeInTheDocument();
  });

  it("opens a discovered topic to its papers", async () => {
    const user = userEvent.setup();
    renderPage();
    await user.click(await screen.findByRole("tab", { name: "Discovered" }));
    await user.click(await screen.findByRole("button", { name: /Sarcopenia/ }));
    expect(
      await screen.findByRole("link", { name: /Topic paper/ }),
    ).toBeInTheDocument();
  });

  it("names both databases the publication lists were built from", async () => {
    const user = userEvent.setup();
    renderPage();
    await user.click(
      await screen.findByRole("button", { name: new RegExp(TOPICS[1].name) }),
    );
    expect(await screen.findByText(/PubMed · Europe PMC/)).toBeInTheDocument();
  });
});

describe("ResearchContent sources panel", () => {
  it("names the databases it draws on and what each one is for", async () => {
    const user = userEvent.setup();
    renderPage();
    await user.click(await screen.findByRole("tab", { name: "Sources" }));
    expect(
      await screen.findByRole("checkbox", { name: "Use PubMed" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("checkbox", { name: "Use Europe PMC" }),
    ).toBeInTheDocument();
    expect(screen.getByText(/carries preprints/)).toBeInTheDocument();
  });

  it("will not let PubMed be switched off, since it carries the counts", async () => {
    const user = userEvent.setup();
    renderPage();
    await user.click(await screen.findByRole("tab", { name: "Sources" }));
    expect(
      await screen.findByRole("checkbox", { name: "Use PubMed" }),
    ).toBeDisabled();
  });

  it("lets a source be ignored, and drops it from the publication queries", async () => {
    const user = userEvent.setup();
    renderPage();
    await user.click(await screen.findByRole("tab", { name: "Sources" }));
    await user.click(screen.getByRole("checkbox", { name: /Use Europe PMC/ }));
    await user.click(screen.getByRole("tab", { name: "Topics" }));
    await user.click(
      await screen.findByRole("button", { name: new RegExp(TOPICS[1].name) }),
    );
    await screen.findByRole("link", { name: /Topic paper/ });
    const last = seen.publicationUrls.at(-1) ?? "";
    expect(new URL(last).searchParams.get("sources")).toBe("pubmed");
  });

  it("keeps a custom journal so it can be browsed like the curated ones", async () => {
    const user = userEvent.setup();
    renderPage();
    await user.click(await screen.findByRole("tab", { name: "Sources" }));
    await user.type(screen.getByLabelText("Journal name"), "Vascular Medicine");
    await user.type(screen.getByLabelText("PubMed abbreviation"), "Vasc Med");
    await user.click(screen.getByRole("button", { name: "Add journal" }));
    await user.click(screen.getByRole("tab", { name: "Journals" }));
    expect(
      await screen.findByRole("button", { name: /Vascular Medicine/ }),
    ).toBeInTheDocument();
  });

  it("hides an ignored journal from the Journals tab", async () => {
    const user = userEvent.setup();
    renderPage();
    await user.click(await screen.findByRole("tab", { name: "Sources" }));
    await user.click(
      screen.getByRole("checkbox", {
        name: new RegExp(`Use ${JOURNALS[0].name}`),
      }),
    );
    await user.click(screen.getByRole("tab", { name: "Journals" }));
    expect(
      screen.queryByRole("button", { name: new RegExp(JOURNALS[0].name) }),
    ).not.toBeInTheDocument();
  });
});

describe("ResearchContent counts", () => {
  const openCounts = async (user: ReturnType<typeof userEvent.setup>) => {
    renderPage();
    await user.click(await screen.findByRole("tab", { name: "Counts" }));
  };

  it("lists topics with how many papers each has in the last 5 years", async () => {
    const user = userEvent.setup();
    await openCounts(user);
    expect(await screen.findByText(TOPICS[1].name)).toBeInTheDocument();
    // TOPICS[1] is seeded with recent: 4, TOPICS[0] with recent: 0.
    expect(screen.getByText("4")).toBeInTheDocument();
    expect(screen.getByText("0")).toBeInTheDocument();
  });

  it("sorts fewest-first so the thin topics surface", async () => {
    const user = userEvent.setup();
    await openCounts(user);
    await screen.findByText(TOPICS[1].name);
    await user.click(screen.getByRole("button", { name: /Fewest/ }));
    const names = screen
      .getAllByRole("button", { name: /papers in the last 5 years/ })
      .map((b) => b.textContent ?? "");
    expect(names[0]).toContain(TOPICS[0].name);

    // Most topics tie at 40 recent papers, so which one lands last is
    // arbitrary. The contract that matters is that counts never decrease.
    const counts = names.map((n) => Number(n.match(/(\d+)papers/)?.[1] ?? -1));
    expect(counts).toEqual([...counts].sort((a, b) => a - b));
  });

  it("shows the count and share within a chosen population", async () => {
    const user = userEvent.setup();
    server.use(
      http.get("/api/research/topics", ({ request }) => {
        const demo = new URL(request.url).searchParams.get("demo");
        if (!demo) return HttpResponse.json(topicsPayload());
        return HttpResponse.json({
          topics: TOPICS.map((t) => ({
            id: t.id,
            total: 1,
            recent: 1,
            status: "sparse",
          })),
        });
      }),
    );
    await openCounts(user);
    await screen.findByText(TOPICS[1].name);
    await user.click(
      screen.getByRole("button", { name: DEMOGRAPHICS[0].label }),
    );

    // TOPICS[1] has 4 recent papers unfiltered and 1 in this population.
    // Scoped to its own row, because "1 of 40 · 3%" on other rows also
    // contains the substring "1 of 4".
    const row = (await screen.findByText(TOPICS[1].name)).closest("li");
    expect(row).not.toBeNull();
    expect(await within(row!).findByText("1 of 4 · 25%")).toBeInTheDocument();
  });

  it("expands a topic to show its demographic split", async () => {
    const user = userEvent.setup();
    await openCounts(user);
    const row = (await screen.findByText(TOPICS[1].name)).closest("li");
    await user.click(within(row!).getByRole("button"));

    // "Women" is also a filter chip above the list, so scope to this row.
    expect(
      await within(row!).findByText(/how many papers include each/),
    ).toBeInTheDocument();
    expect(within(row!).getByText(DEMOGRAPHICS[0].label)).toBeInTheDocument();
  });

  it("asks for the split over the same 5-year window the column shows", async () => {
    const user = userEvent.setup();
    const urls: string[] = [];
    server.use(
      http.get("/api/research/demographics", ({ request }) => {
        urls.push(request.url);
        return HttpResponse.json({
          facets: DEMOGRAPHICS.map((d) => ({ id: d.id, count: 3 })),
        });
      }),
    );
    await openCounts(user);
    const row = (await screen.findByText(TOPICS[1].name)).closest("li");
    await user.click(within(row!).getByRole("button"));
    await within(row!).findByText(/how many papers include each/);
    expect(new URL(urls.at(-1) ?? "").searchParams.get("window")).toBe("5");
  });

  it("renders real characters, not escape sequences, in the loading note", async () => {
    const user = userEvent.setup();
    server.use(
      http.get("/api/research/topics", async ({ request }) => {
        if (new URL(request.url).searchParams.get("demo")) {
          await new Promise((r) => setTimeout(r, 400));
        }
        return HttpResponse.json(topicsPayload());
      }),
    );
    await openCounts(user);
    await screen.findByText(TOPICS[1].name);
    await user.click(
      screen.getByRole("button", { name: DEMOGRAPHICS[0].label }),
    );

    // A \uXXXX escape is only interpreted inside a string literal. Written as
    // JSX text it renders verbatim, which is how "topic\u2026" shipped.
    expect(document.body.textContent ?? "").not.toMatch(/\\u[0-9a-fA-F]{4}/);
  });
});

describe("ResearchContent on a phone", () => {
  it("wraps the tab row so no tab is pushed off screen", async () => {
    renderPage();
    const tablist = await screen.findByRole("tablist");
    expect(tablist.className).toContain("flex-wrap");
  });

  it("keeps every tab reachable", async () => {
    renderPage();
    const labels = (await screen.findAllByRole("tab")).map(
      (t) => t.textContent,
    );
    expect(labels).toEqual([
      "Topics",
      "Counts",
      "Discovered",
      "Journals",
      "Demographics",
      "Sources",
    ]);
  });
});
