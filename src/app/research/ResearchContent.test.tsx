import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, within, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { http, HttpResponse } from "msw";
import { server } from "@/test/server";
import { TOPICS, JOURNALS, DEMOGRAPHICS } from "@/lib/research/data";
import ResearchContent from "./ResearchContent";

/** Requests the page made, so tests can assert the query contract. */
const seen = { topics: 0, publicationUrls: [] as string[] };

const THIS_YEAR = new Date().getFullYear();

const topicsPayload = () => ({
  window: { fromYear: THIS_YEAR - 5, toYear: THIS_YEAR },
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
          window: { fromYear: THIS_YEAR - 5, toYear: THIS_YEAR },
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
      "Journal club",
      "Discovered",
      "Journals",
      "Demographics",
      "Sources",
    ]);
  });
});

describe("ResearchContent data coverage", () => {
  it("names the years the counts cover instead of just saying 5 years", async () => {
    const user = userEvent.setup();
    renderPage();
    await user.click(await screen.findByRole("tab", { name: "Counts" }));
    const thisYear = new Date().getFullYear();
    expect(
      await screen.findByText(
        new RegExp(`${thisYear - 5}\\s*[–-]\\s*${thisYear}`),
      ),
    ).toBeInTheDocument();
  });

  it("says how far back a publication list actually reaches", async () => {
    const user = userEvent.setup();
    renderPage();
    await user.click(
      await screen.findByRole("button", { name: new RegExp(TOPICS[1].name) }),
    );
    await screen.findByRole("link", { name: /Topic paper/ });
    // The date also appears on the paper's own meta line, so assert on the
    // coverage line specifically: it must name the oldest paper on screen.
    expect(screen.getByText(/oldest shown: 2026 Feb/i)).toBeInTheDocument();
    expect(screen.getByText(/across all years/i)).toBeInTheDocument();
  });

  it("says the all-time column really is all of PubMed", async () => {
    renderPage();
    expect(await screen.findByText(/all years indexed/i)).toBeInTheDocument();
  });
});

describe("ResearchContent loading is never mistaken for data", () => {
  it("says the demographics scan is running instead of showing empty bars", async () => {
    const user = userEvent.setup();
    server.use(
      http.get("/api/research/demographics", async () => {
        await new Promise((r) => setTimeout(r, 600));
        return HttpResponse.json({
          window: null,
          facets: DEMOGRAPHICS.map((d) => ({ id: d.id, count: 7 })),
        });
      }),
    );
    renderPage();
    await user.click(await screen.findByRole("tab", { name: "Demographics" }));

    // A zero here is a real finding, so a scan in progress must not look like
    // one: it says so in words, and hides the counts until they are real.
    expect(await screen.findByText(/counting across/i)).toBeInTheDocument();
    expect(screen.queryByText("7")).not.toBeInTheDocument();

    expect(await screen.findAllByText("7")).not.toHaveLength(0);
    expect(screen.queryByText(/counting across/i)).not.toBeInTheDocument();
  });

  it("says a topic's split is still counting", async () => {
    const user = userEvent.setup();
    server.use(
      http.get("/api/research/demographics", async () => {
        await new Promise((r) => setTimeout(r, 600));
        return HttpResponse.json({
          window: { fromYear: THIS_YEAR - 5, toYear: THIS_YEAR },
          facets: DEMOGRAPHICS.map((d) => ({ id: d.id, count: 3 })),
        });
      }),
    );
    renderPage();
    await user.click(await screen.findByRole("tab", { name: "Counts" }));
    const row = (await screen.findByText(TOPICS[1].name)).closest("li");
    await user.click(within(row!).getByRole("button"));
    expect(
      await within(row!).findByText(/counting across/i),
    ).toBeInTheDocument();
  });
});

describe("ResearchContent demographic drill-in", () => {
  it("opens a population on the Demographics tab to the research beneath it", async () => {
    const user = userEvent.setup();
    renderPage();
    await user.click(await screen.findByRole("tab", { name: "Demographics" }));
    const row = (await screen.findByText(DEMOGRAPHICS[0].label)).closest("li");
    await user.click(within(row!).getByRole("button"));

    // The papers appear inside that population's own row, not elsewhere.
    // The stub titles a demo-scoped list "Filtered paper".
    expect(
      await within(row!).findByRole("link", { name: /Filtered paper/ }),
    ).toBeInTheDocument();
    const last = seen.publicationUrls.at(-1) ?? "";
    expect(new URL(last).searchParams.get("demo")).toBe(DEMOGRAPHICS[0].id);
  });

  it("scopes that research to the open topic when there is one", async () => {
    const user = userEvent.setup();
    renderPage();
    await user.click(
      await screen.findByRole("button", { name: new RegExp(TOPICS[1].name) }),
    );
    await screen.findByRole("link", { name: /Topic paper/ });
    await user.click(screen.getByRole("tab", { name: "Demographics" }));
    const row = (await screen.findByText(DEMOGRAPHICS[0].label)).closest("li");
    await user.click(within(row!).getByRole("button"));
    await within(row!).findByRole("link", { name: /Filtered paper/ });
    const last = new URL(seen.publicationUrls.at(-1) ?? "");
    expect(last.searchParams.get("topic")).toBe(TOPICS[1].id);
    expect(last.searchParams.get("demo")).toBe(DEMOGRAPHICS[0].id);
  });
});

describe("ResearchContent filters that lead nowhere", () => {
  it("disables the populations that would return no papers", async () => {
    const user = userEvent.setup();
    server.use(
      http.get("/api/research/demographics", () =>
        HttpResponse.json({
          window: null,
          facets: DEMOGRAPHICS.map((d, i) => ({
            id: d.id,
            // Everything past the first two combines to nothing.
            count: i < 2 ? 5 : 0,
          })),
        }),
      ),
    );
    renderPage();
    await user.click(
      await screen.findByRole("button", { name: new RegExp(TOPICS[1].name) }),
    );
    await user.click(
      await screen.findByRole("checkbox", { name: DEMOGRAPHICS[0].label }),
    );

    // Labels like "Older adults (65+)" are not regex-safe, so match by prefix.
    const byLabel = (label: string) => (name: string) => name.startsWith(label);

    await screen.findByRole("checkbox", {
      name: byLabel(DEMOGRAPHICS[2].label),
    });
    expect(
      screen.getByRole("checkbox", { name: byLabel(DEMOGRAPHICS[2].label) }),
    ).toBeDisabled();
    // The one still worth picking stays enabled.
    expect(
      screen.getByRole("checkbox", { name: DEMOGRAPHICS[1].label }),
    ).toBeEnabled();
  });

  it("never disables a population before anything is chosen", async () => {
    const user = userEvent.setup();
    renderPage();
    await user.click(
      await screen.findByRole("button", { name: new RegExp(TOPICS[1].name) }),
    );
    const boxes = await screen.findAllByRole("checkbox");
    boxes.forEach((b) => expect(b).toBeEnabled());
  });
});

describe("ResearchContent publication paging", () => {
  const manyPapers = (n: number) =>
    Array.from({ length: n }, (_, i) => ({
      id: String(100 + i),
      title: `Paper number ${i + 1}`,
      journal: "Journal of Vascular Surgery",
      pubDate: "2026 Feb",
      authors: ["Smith J"],
      doi: null,
      url: `https://pubmed.ncbi.nlm.nih.gov/${100 + i}/`,
      source: "pubmed",
    }));

  beforeEach(() => {
    server.use(
      http.get("/api/research/publications", () =>
        HttpResponse.json({
          total: 20,
          publications: manyPapers(20),
          sources: ["pubmed"],
        }),
      ),
    );
  });

  it("shows five papers under a population before asking for more", async () => {
    const user = userEvent.setup();
    renderPage();
    await user.click(await screen.findByRole("tab", { name: "Demographics" }));
    const row = (await screen.findByText(DEMOGRAPHICS[0].label)).closest("li");
    await user.click(within(row!).getByRole("button"));

    expect(
      await within(row!).findByRole("link", { name: "Paper number 5" }),
    ).toBeInTheDocument();
    expect(
      within(row!).queryByRole("link", { name: "Paper number 6" }),
    ).not.toBeInTheDocument();
  });

  it("reveals the rest on request, and says how many are left", async () => {
    const user = userEvent.setup();
    renderPage();
    await user.click(await screen.findByRole("tab", { name: "Demographics" }));
    const row = (await screen.findByText(DEMOGRAPHICS[0].label)).closest("li");
    await user.click(within(row!).getByRole("button"));
    await within(row!).findByRole("link", { name: "Paper number 5" });

    await user.click(within(row!).getByRole("button", { name: /Show 5 more/ }));
    expect(
      await within(row!).findByRole("link", { name: "Paper number 10" }),
    ).toBeInTheDocument();
    expect(
      within(row!).queryByRole("link", { name: "Paper number 11" }),
    ).not.toBeInTheDocument();
  });

  it("stops offering more once everything is shown", async () => {
    const user = userEvent.setup();
    renderPage();
    await user.click(
      await screen.findByRole("button", { name: new RegExp(TOPICS[1].name) }),
    );
    await screen.findByRole("link", { name: "Paper number 1" });

    // A topic list opens at twenty, which is everything the route returns.
    expect(
      screen.queryByRole("button", { name: /Show \d+ more/ }),
    ).not.toBeInTheDocument();
  });
});

describe("ResearchContent counts what it is actually showing", () => {
  it("never claims a total smaller than the list beneath it", async () => {
    const user = userEvent.setup();
    server.use(
      http.get("/api/research/publications", () =>
        HttpResponse.json({
          // PubMed matched 5; Europe PMC contributed 3 more it doesn't index.
          total: 5,
          publications: Array.from({ length: 8 }, (_, i) => ({
            id: String(i),
            title: `Paper ${i + 1}`,
            journal: "J",
            pubDate: "2026 Feb",
            authors: [],
            doi: null,
            url: `https://pubmed.ncbi.nlm.nih.gov/${i}/`,
            source: i < 5 ? "pubmed" : "europepmc",
          })),
          sources: ["pubmed", "europepmc"],
        }),
      ),
    );
    renderPage();
    await user.click(
      await screen.findByRole("button", { name: new RegExp(TOPICS[1].name) }),
    );
    await screen.findByRole("link", { name: "Paper 1" });

    // "5 matching papers" above eight rows was simply wrong: the total counted
    // PubMed only while the list merged both sources.
    expect(screen.getByText(/showing 8 of 8/i)).toBeInTheDocument();
    expect(screen.queryByText(/^5 matching/)).not.toBeInTheDocument();
  });
});

describe("ResearchContent journal club", () => {
  const jcPaper = {
    id: "europepmc-PMC9",
    title: "Limb salvage on dialysis: a four-centre review.",
    journal: "Annals of Vascular Surgery",
    pubDate: "2025-04-02",
    authors: ["Doe A"],
    doi: null,
    url: "https://europepmc.org/article/MED/PMC9",
    design: {
      label: "Multicentre study",
      caveat: "Sites vary.",
      canSupportCausality: false,
    },
    innovation: { score: 2, signals: ["first-in-human", "robotic"] },
    points: [
      "Point one is long enough.",
      "Point two is long enough.",
      "Point three is long enough.",
    ],
    questions: [
      "Question one at length?",
      "Question two at length?",
      "Question three at length?",
    ],
  };

  beforeEach(() => {
    server.use(
      http.get("/api/research/journal-club", () =>
        HttpResponse.json({
          papers: [jcPaper],
          window: { fromYear: THIS_YEAR - 2, toYear: THIS_YEAR },
        }),
      ),
    );
  });

  it("lists recent papers with their design, for a chosen topic", async () => {
    const user = userEvent.setup();
    renderPage();
    await user.click(await screen.findByRole("tab", { name: "Journal club" }));
    await user.click(
      await screen.findByRole("button", { name: new RegExp(TOPICS[1].name) }),
    );
    expect(await screen.findByText(/four-centre review/)).toBeInTheDocument();
    expect(screen.getByText("Multicentre study")).toBeInTheDocument();
  });

  it("opens a paper to at least three points and three questions", async () => {
    const user = userEvent.setup();
    renderPage();
    await user.click(await screen.findByRole("tab", { name: "Journal club" }));
    await user.click(
      await screen.findByRole("button", { name: new RegExp(TOPICS[1].name) }),
    );
    await user.click(
      await screen.findByRole("button", { name: /four-centre review/ }),
    );

    expect(
      await screen.findByText("Point one is long enough."),
    ).toBeInTheDocument();
    expect(screen.getByText("Question three at length?")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /Read the paper/ }),
    ).toHaveAttribute("href", "https://europepmc.org/article/MED/PMC9");
  });

  it("says which years it searched", async () => {
    const user = userEvent.setup();
    renderPage();
    await user.click(await screen.findByRole("tab", { name: "Journal club" }));
    await user.click(
      await screen.findByRole("button", { name: new RegExp(TOPICS[1].name) }),
    );
    expect(
      await screen.findByText(
        new RegExp(`${THIS_YEAR - 2}\\s*[–-]\\s*${THIS_YEAR}`),
      ),
    ).toBeInTheDocument();
  });

  it("asks for a topic before fetching anything", async () => {
    const user = userEvent.setup();
    renderPage();
    await user.click(await screen.findByRole("tab", { name: "Journal club" }));
    // "Pick a topic" is also the group label, so match the empty-state sentence.
    expect(
      await screen.findByText(/discussion material attached/i),
    ).toBeInTheDocument();
  });
});

describe("ResearchContent innovation and ask", () => {
  const jc = {
    id: "europepmc-PMC9",
    title: "Robotic repair: a first-in-human series.",
    journal: "Annals of Vascular Surgery",
    pubDate: "2025-04-02",
    authors: ["Doe A"],
    doi: null,
    url: "https://europepmc.org/article/MED/PMC9",
    design: {
      label: "Case report",
      caveat: "One case.",
      canSupportCausality: false,
    },
    innovation: { score: 2, signals: ["first-in-human", "robotic"] },
    points: [
      "Point one is long enough here.",
      "Point two is long enough here.",
      "Point three is long enough.",
    ],
    questions: [
      "Question one at length?",
      "Question two at length?",
      "Question three at length?",
    ],
  };

  const openPaper = async (user: ReturnType<typeof userEvent.setup>) => {
    renderPage();
    await user.click(await screen.findByRole("tab", { name: "Journal club" }));
    await user.click(
      await screen.findByRole("button", { name: new RegExp(TOPICS[1].name) }),
    );
    await user.click(
      await screen.findByRole("button", { name: /first-in-human series/ }),
    );
  };

  beforeEach(() => {
    server.use(
      http.get("/api/research/journal-club", ({ request }) => {
        const only = new URL(request.url).searchParams.get("innovative");
        return HttpResponse.json({
          papers: only === "true" ? [jc] : [jc],
          window: { fromYear: THIS_YEAR - 2, toYear: THIS_YEAR },
        });
      }),
    );
  });

  it("shows why a paper counts as innovative rather than just asserting it", async () => {
    const user = userEvent.setup();
    renderPage();
    await user.click(await screen.findByRole("tab", { name: "Journal club" }));
    await user.click(
      await screen.findByRole("button", { name: new RegExp(TOPICS[1].name) }),
    );
    expect(await screen.findByText("first-in-human")).toBeInTheDocument();
    expect(screen.getByText("robotic")).toBeInTheDocument();
  });

  it("asks the API for innovative papers only when the filter is on", async () => {
    const user = userEvent.setup();
    const urls: string[] = [];
    server.use(
      http.get("/api/research/journal-club", ({ request }) => {
        urls.push(request.url);
        return HttpResponse.json({
          papers: [jc],
          window: { fromYear: THIS_YEAR - 2, toYear: THIS_YEAR },
        });
      }),
    );
    renderPage();
    await user.click(await screen.findByRole("tab", { name: "Journal club" }));
    await user.click(
      await screen.findByRole("button", { name: new RegExp(TOPICS[1].name) }),
    );
    await screen.findByText(/first-in-human series/);
    await user.click(
      screen.getByRole("checkbox", { name: /doing something new/i }),
    );
    await expect
      .poll(() =>
        new URL(urls.at(-1) ?? "http://x/").searchParams.get("innovative"),
      )
      .toBe("true");
  });

  it("answers a question about the paper", async () => {
    const user = userEvent.setup();
    server.use(
      http.post("/api/research/ask", () =>
        HttpResponse.json({ answer: "Confounding by indication." }),
      ),
    );
    await openPaper(user);
    await user.type(
      screen.getByLabelText(/ask about this paper/i),
      "Main weakness?",
    );
    await user.click(screen.getByRole("button", { name: "Ask" }));
    expect(
      await screen.findByText("Confounding by indication."),
    ).toBeInTheDocument();
  });

  it("shows the setup message instead of looking broken when no key is set", async () => {
    const user = userEvent.setup();
    server.use(
      http.post("/api/research/ask", () =>
        HttpResponse.json(
          { error: "Ask is not configured. Set OPENAI_API_KEY on the server." },
          { status: 503 },
        ),
      ),
    );
    await openPaper(user);
    await user.type(screen.getByLabelText(/ask about this paper/i), "Why?");
    await user.click(screen.getByRole("button", { name: "Ask" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(
      /not configured/i,
    );
  });
});

describe("ResearchContent ask access", () => {
  const jc = {
    id: "europepmc-PMC9",
    title: "Robotic repair: a first-in-human series.",
    journal: "Annals of Vascular Surgery",
    pubDate: "2025-04-02",
    authors: ["Doe A"],
    doi: null,
    url: "https://europepmc.org/article/MED/PMC9",
    design: {
      label: "Case report",
      caveat: "One case.",
      canSupportCausality: false,
    },
    innovation: { score: 1, signals: ["first-in-human"] },
    points: [
      "Point one is long enough here.",
      "Point two is long enough here.",
      "Point three is long enough.",
    ],
    questions: [
      "Question one at length?",
      "Question two at length?",
      "Question three at length?",
    ],
  };

  const askWith = async (status: number, error: string) => {
    const user = userEvent.setup();
    server.use(
      http.get("/api/research/journal-club", () =>
        HttpResponse.json({
          papers: [jc],
          window: { fromYear: THIS_YEAR - 2, toYear: THIS_YEAR },
        }),
      ),
      http.post("/api/research/ask", () =>
        HttpResponse.json({ error }, { status }),
      ),
    );
    renderPage();
    await user.click(await screen.findByRole("tab", { name: "Journal club" }));
    await user.click(
      await screen.findByRole("button", { name: new RegExp(TOPICS[1].name) }),
    );
    await user.click(
      await screen.findByRole("button", { name: /first-in-human series/ }),
    );
    await user.type(screen.getByLabelText(/ask about this paper/i), "Why?");
    await user.click(screen.getByRole("button", { name: "Ask" }));
    return user;
  };

  it("tells a signed-out visitor in a dialog that this is beta-only", async () => {
    await askWith(401, "Sign in to ask about a paper.");
    const dialog = await screen.findByRole("dialog");
    expect(dialog).toHaveTextContent(/beta/i);
  });

  it("says the same to a signed-in account that is not on the list", async () => {
    await askWith(403, "Ask is not enabled for this account.");
    const dialog = await screen.findByRole("dialog");
    expect(dialog).toHaveTextContent(/beta/i);
  });

  it("can be dismissed", async () => {
    const user = await askWith(403, "Ask is not enabled for this account.");
    await screen.findByRole("dialog");
    await user.click(screen.getByRole("button", { name: /close|got it/i }));
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
  });

  it("keeps other failures inline rather than interrupting with a dialog", async () => {
    await askWith(429, "You have no credits remaining.");
    expect(await screen.findByRole("alert")).toHaveTextContent(/no credits/i);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});

describe("ResearchContent custom topics", () => {
  beforeEach(() => {
    window.localStorage.clear();
    server.use(
      http.get("/api/research/topics", ({ request }) => {
        const phrase = new URL(request.url).searchParams.get("phrase");
        if (phrase === null) return HttpResponse.json(topicsPayload());
        return HttpResponse.json({
          window: { fromYear: THIS_YEAR - 5, toYear: THIS_YEAR },
          topics: [{ id: "custom", total: 58, recent: 25, status: "emerging" }],
        });
      }),
    );
  });

  const addTopic = async (
    user: ReturnType<typeof userEvent.setup>,
    phrase: string,
  ) => {
    renderPage();
    await user.type(await screen.findByLabelText("Topic phrase"), phrase);
    await user.click(screen.getByRole("button", { name: "Add topic" }));
  };

  it("keeps a custom topic and scores it like the curated ones", async () => {
    const user = userEvent.setup();
    await addTopic(user, "mesenteric ischemia thrombolysis");
    const card = await screen.findByRole("button", {
      name: /^mesenteric ischemia thrombolysis/,
    });
    expect(card).toBeInTheDocument();
    expect(await screen.findByText("Emerging")).toBeInTheDocument();
    expect(screen.getByText(/58 papers · 25 recent/)).toBeInTheDocument();
  });

  it("opens a custom topic to its papers, queried by the phrase", async () => {
    const user = userEvent.setup();
    await addTopic(user, "popliteal entrapment");
    await user.click(
      await screen.findByRole("button", { name: /^popliteal entrapment/ }),
    );
    await screen.findByRole("link", { name: /Topic paper/ });
    const last = seen.publicationUrls.at(-1) ?? "";
    expect(new URL(last).searchParams.get("phrase")).toBe(
      "popliteal entrapment",
    );
  });

  it("rejects search syntax instead of sending it anywhere", async () => {
    const user = userEvent.setup();
    await addTopic(user, 'x"[mh] OR 1=1');
    expect(await screen.findByText(/plain words/i)).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /1=1/ }),
    ).not.toBeInTheDocument();
  });

  it("forgets a removed topic", async () => {
    const user = userEvent.setup();
    await addTopic(user, "carotid web");
    await screen.findByRole("button", { name: /^carotid web/ });
    await user.click(
      screen.getByRole("button", { name: "Remove carotid web" }),
    );
    await waitFor(() =>
      expect(
        screen.queryByRole("button", { name: /^carotid web/ }),
      ).not.toBeInTheDocument(),
    );
  });
});
