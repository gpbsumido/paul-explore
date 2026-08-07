import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
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
    await user.click(screen.getByRole("checkbox", { name: DEMOGRAPHICS[0].label }));
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

  it("names the data source the evidence comes from", async () => {
    renderPage();
    expect(await screen.findByText(/PubMed/)).toBeInTheDocument();
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
