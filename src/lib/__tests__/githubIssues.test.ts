import { describe, it, expect, vi, afterEach } from "vitest";
import {
  findOpenIssue,
  createIssue,
  closeIssue,
} from "@/lib/githubIssues";

const REPO = "gpbsumido/paul-explore";
const TOKEN = "ghp_test";

/** Stubs global fetch with a queue of responses, returning the spy. */
function stubFetch(...responses: Response[]) {
  const fetchMock = vi.fn();
  responses.forEach((r) => fetchMock.mockResolvedValueOnce(r));
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });

afterEach(() => {
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

describe("findOpenIssue", () => {
  it("returns the first open issue carrying the label", async () => {
    const fetchMock = stubFetch(json([{ number: 42 }, { number: 43 }]));

    const issue = await findOpenIssue({
      repo: REPO,
      token: TOKEN,
      label: "vitals-alert",
    });

    expect(issue).toEqual({ number: 42 });
    const url = fetchMock.mock.calls[0][0] as string;
    expect(url).toContain(`/repos/${REPO}/issues`);
    expect(url).toContain("state=open");
    expect(url).toContain("vitals-alert");
  });

  it("returns null when no open issue has the label", async () => {
    stubFetch(json([]));

    const issue = await findOpenIssue({
      repo: REPO,
      token: TOKEN,
      label: "vitals-alert",
    });

    expect(issue).toBeNull();
  });

  it("throws when GitHub answers with an error status", async () => {
    stubFetch(json({ message: "Bad credentials" }, 401));

    await expect(
      findOpenIssue({ repo: REPO, token: TOKEN, label: "vitals-alert" }),
    ).rejects.toThrow();
  });
});

describe("createIssue", () => {
  it("posts the title, body and label to the repo's issues", async () => {
    const fetchMock = stubFetch(json({ number: 99 }, 201));

    const created = await createIssue({
      repo: REPO,
      token: TOKEN,
      title: "Web Vitals in the Poor band",
      body: "LCP is slow",
      label: "vitals-alert",
    });

    expect(created).toEqual({ number: 99 });
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(`https://api.github.com/repos/${REPO}/issues`);
    expect(init.method).toBe("POST");
    expect(String(init.headers && (init.headers as Record<string, string>).Authorization)).toContain(TOKEN);
    const sent = JSON.parse(String(init.body));
    expect(sent).toMatchObject({
      title: "Web Vitals in the Poor band",
      body: "LCP is slow",
      labels: ["vitals-alert"],
    });
  });
});

describe("closeIssue", () => {
  it("comments then patches the issue closed", async () => {
    const fetchMock = stubFetch(json({}, 201), json({}, 200));

    await closeIssue({
      repo: REPO,
      token: TOKEN,
      number: 7,
      comment: "recovered",
    });

    const [commentUrl] = fetchMock.mock.calls[0] as [string, RequestInit];
    const [patchUrl, patchInit] = fetchMock.mock.calls[1] as [string, RequestInit];
    expect(commentUrl).toBe(
      `https://api.github.com/repos/${REPO}/issues/7/comments`,
    );
    expect(patchUrl).toBe(`https://api.github.com/repos/${REPO}/issues/7`);
    expect(patchInit.method).toBe("PATCH");
    expect(JSON.parse(String(patchInit.body))).toMatchObject({ state: "closed" });
  });
});
