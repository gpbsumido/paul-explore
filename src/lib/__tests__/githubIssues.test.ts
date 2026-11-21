import { describe, it, expect, vi, afterEach } from "vitest";
import {
  findOpenIssue,
  createIssue,
  updateIssue,
  closeIssue,
} from "@/lib/githubIssues";

const REPO = "gpbsumido/paul-explore";
const TOKEN = "ghp_test";

/** The headers of one recorded fetch call, as a plain object. */
function headersOf(init: RequestInit): Record<string, string> {
  return Object.fromEntries(new Headers(init.headers).entries());
}

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
    expect(url).toBe(
      `https://api.github.com/repos/${REPO}/issues?state=open&labels=vitals-alert`,
    );
  });

  it("sends the token as a bearer credential", async () => {
    const fetchMock = stubFetch(json([]));

    await findOpenIssue({ repo: REPO, token: TOKEN, label: "vitals-alert" });

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(headersOf(init).authorization).toBe(`Bearer ${TOKEN}`);
  });

  it("encodes a label that has spaces or punctuation in it", async () => {
    const fetchMock = stubFetch(json([]));

    await findOpenIssue({ repo: REPO, token: TOKEN, label: "web vitals & more" });

    const [url] = fetchMock.mock.calls[0] as [string];
    expect(new URL(url).searchParams.get("labels")).toBe("web vitals & more");
  });

  it("treats an answer that isn't a list as no open issue", async () => {
    stubFetch(json({ message: "Not a list" }));

    await expect(
      findOpenIssue({ repo: REPO, token: TOKEN, label: "vitals-alert" }),
    ).resolves.toBeNull();
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
    ).rejects.toThrow("GitHub list issues failed: 401");
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
    expect(headersOf(init).authorization).toBe(`Bearer ${TOKEN}`);
    expect(headersOf(init)["content-type"]).toBe("application/json");
    const sent = JSON.parse(String(init.body));
    expect(sent).toMatchObject({
      title: "Web Vitals in the Poor band",
      body: "LCP is slow",
      labels: ["vitals-alert"],
    });
  });
});

describe("createIssue failures", () => {
  it("throws, naming the status, when GitHub refuses the issue", async () => {
    stubFetch(json({ message: "Validation Failed" }, 422));

    await expect(
      createIssue({ repo: REPO, token: TOKEN, title: "t", body: "b", label: "vitals-alert" }),
    ).rejects.toThrow("GitHub create issue failed: 422");
  });
});

describe("updateIssue", () => {
  it("patches the new body onto the issue", async () => {
    const fetchMock = stubFetch(json({}, 200));

    await updateIssue({ repo: REPO, token: TOKEN, number: 12, body: "LCP is still slow" });

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(`https://api.github.com/repos/${REPO}/issues/12`);
    expect(init.method).toBe("PATCH");
    expect(JSON.parse(String(init.body))).toEqual({ body: "LCP is still slow" });
    expect(headersOf(init).authorization).toBe(`Bearer ${TOKEN}`);
  });

  it("throws, naming the status, when GitHub refuses the update", async () => {
    stubFetch(json({ message: "Not Found" }, 404));

    await expect(
      updateIssue({ repo: REPO, token: TOKEN, number: 12, body: "x" }),
    ).rejects.toThrow("GitHub update issue failed: 404");
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
    expect(JSON.parse(String(patchInit.body))).toEqual({ state: "closed" });
  });

  it("leaves the recovery note as the comment", async () => {
    const fetchMock = stubFetch(json({}, 201), json({}, 200));

    await closeIssue({ repo: REPO, token: TOKEN, number: 7, comment: "back in the Good band" });

    const [, commentInit] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(commentInit.method).toBe("POST");
    expect(JSON.parse(String(commentInit.body))).toEqual({ body: "back in the Good band" });
  });

  it("leaves the issue open when the recovery comment can't be posted", async () => {
    const fetchMock = stubFetch(json({ message: "Forbidden" }, 403));

    await expect(
      closeIssue({ repo: REPO, token: TOKEN, number: 7, comment: "recovered" }),
    ).rejects.toThrow("GitHub comment on issue failed: 403");
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("throws when the close itself is refused", async () => {
    stubFetch(json({}, 201), json({ message: "Forbidden" }, 403));

    await expect(
      closeIssue({ repo: REPO, token: TOKEN, number: 7, comment: "recovered" }),
    ).rejects.toThrow("GitHub close issue failed: 403");
  });
});
