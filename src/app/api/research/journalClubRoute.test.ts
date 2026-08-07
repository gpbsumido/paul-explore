import { describe, it, expect, beforeEach } from "vitest";
import { http, HttpResponse } from "msw";
import { NextRequest } from "next/server";
import { server } from "@/test/server";
import { TOPICS } from "@/lib/research/data";
import { GET as journalClubGET } from "./journal-club/route";

const EPMC = "https://www.ebi.ac.uk/europepmc/webservices/rest/search";

const paper = {
  id: "PMC9",
  source: "MED",
  doi: "10.1000/jc.9",
  title: "Limb salvage on dialysis: a four-centre review.",
  authorString: "Doe A, Roe B.",
  journalInfo: { journal: { title: "Annals of Vascular Surgery" } },
  firstPublicationDate: "2025-04-02",
  pubTypeList: { pubType: ["Journal Article", "Multicenter Study"] },
  abstractText:
    "<h4>Methods</h4>We reviewed 412 patients." +
    "<h4>Conclusions</h4>Outcomes were worse on dialysis.",
};

let queries: string[] = [];

beforeEach(() => {
  queries = [];
  server.use(
    http.get(EPMC, ({ request }) => {
      queries.push(new URL(request.url).searchParams.get("query") ?? "");
      return HttpResponse.json({
        hitCount: 1,
        resultList: { result: [paper] },
      });
    }),
  );
});

describe("GET /api/research/journal-club", () => {
  it("returns recent papers with discussion already attached", async () => {
    const res = await journalClubGET(
      new NextRequest(
        `http://localhost/api/research/journal-club?topic=${TOPICS[6].id}`,
      ),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.papers).toHaveLength(1);

    const [p] = body.papers;
    expect(p.title).toBe("Limb salvage on dialysis: a four-centre review.");
    expect(p.url).toContain("europepmc.org");
    expect(p.design.label).toBe("Multicentre study");
    expect(p.points.length).toBeGreaterThanOrEqual(3);
    expect(p.questions.length).toBeGreaterThanOrEqual(3);
  });

  it("only asks for the last two years", async () => {
    await journalClubGET(
      new NextRequest(
        `http://localhost/api/research/journal-club?topic=${TOPICS[6].id}`,
      ),
    );
    const thisYear = new Date().getFullYear();
    expect(queries[0]).toContain(`${thisYear - 2}-01-01`);
    expect(queries[0]).toContain('HAS_ABSTRACT:"Y"');
  });

  it("reports the window it used", async () => {
    const res = await journalClubGET(
      new NextRequest(
        `http://localhost/api/research/journal-club?topic=${TOPICS[6].id}`,
      ),
    );
    const body = await res.json();
    expect(body.window).toEqual({
      fromYear: new Date().getFullYear() - 2,
      toYear: new Date().getFullYear(),
    });
  });

  it("400s on a topic the curated layer does not define", async () => {
    const res = await journalClubGET(
      new NextRequest("http://localhost/api/research/journal-club?topic=nope"),
    );
    expect(res.status).toBe(400);
  });

  it("502s when the upstream cannot be reached", async () => {
    server.use(http.get(EPMC, () => HttpResponse.error()));
    const res = await journalClubGET(
      new NextRequest(
        `http://localhost/api/research/journal-club?topic=${TOPICS[6].id}`,
      ),
    );
    expect(res.status).toBe(502);
  });

  it("skips papers with no abstract rather than inventing prompts for them", async () => {
    server.use(
      http.get(EPMC, () =>
        HttpResponse.json({
          hitCount: 2,
          resultList: {
            result: [paper, { ...paper, id: "PMC10", abstractText: undefined }],
          },
        }),
      ),
    );
    const res = await journalClubGET(
      new NextRequest(
        `http://localhost/api/research/journal-club?topic=${TOPICS[6].id}`,
      ),
    );
    const body = await res.json();
    expect(body.papers).toHaveLength(1);
  });
});
