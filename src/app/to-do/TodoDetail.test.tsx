import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import TodoDetail from "./TodoDetail";
import type { Todo } from "./TodoContent";

const todo: Todo = {
  id: "11111111-1111-1111-1111-111111111111",
  project: "portfolio_api",
  phase: 1,
  position: 1,
  title: "Merge the thing",
  detail: null,
  reason: null,
  blocking: false,
  command: null,
  pr_repo: null,
  pr_number: null,
  done: false,
  done_at: null,
};

const revision = (over: Record<string, unknown> = {}) => ({
  id: `rev-${over.revision ?? 1}`,
  revision: 1,
  change_kind: "created",
  snapshot: { ...todo, title: "Original title" },
  reverted_from: null,
  actor: "owner@example.com",
  created_at: "2026-08-13T10:00:00.000Z",
  ...over,
});

function renderWith() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <TodoDetail todo={todo} />
    </QueryClientProvider>,
  );
}

/** Routes each endpoint the panel touches, so one test can fail one of them. */
const mockApi = (over: { revisions?: unknown; revisionsFail?: boolean } = {}) => {
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string, init?: RequestInit) => {
      const method = init?.method ?? "GET";
      if (url.includes("/revisions")) {
        if (over.revisionsFail) return { ok: false, status: 500 } as Response;
        return {
          ok: true,
          json: async () => ({ revisions: over.revisions ?? [revision()] }),
        } as Response;
      }
      if (url.includes("/comments")) {
        if (method === "GET") {
          return { ok: true, json: async () => ({ comments: [] }) } as Response;
        }
        return { ok: true, json: async () => ({ comment: {} }) } as Response;
      }
      if (url.includes("/revert")) {
        return { ok: true, json: async () => ({}) } as Response;
      }
      return { ok: true, json: async () => ({}) } as Response;
    }),
  );
};

const callsTo = (fragment: string) =>
  vi.mocked(fetch).mock.calls.filter(([url]) => String(url).includes(fragment));

beforeEach(() => {
  vi.restoreAllMocks();
});

describe("the history tab", () => {
  it("shows an empty timeline differently from a failed one", async () => {
    mockApi({ revisions: [] });
    const empty = renderWith();
    expect(await screen.findByText(/no history yet/i)).toBeInTheDocument();
    empty.unmount();

    // An empty array and a broken request must never render the same, or a
    // outage reads as "nothing has happened to this item".
    mockApi({ revisionsFail: true });
    renderWith();
    expect(await screen.findByText(/could not load the history/i)).toBeInTheDocument();
    expect(screen.queryByText(/no history yet/i)).not.toBeInTheDocument();
  });

  it("asks before reverting", async () => {
    const user = userEvent.setup();
    mockApi({ revisions: [revision({ revision: 1 }), revision({ revision: 2, change_kind: "ticked" })] });
    renderWith();

    await user.click((await screen.findAllByRole("button", { name: /revert here/i }))[0]);

    // One click next to a checkbox must not be destructive-feeling.
    expect(callsTo("/revert")).toHaveLength(0);
    expect(screen.getByRole("button", { name: /revert to revision 1/i })).toBeInTheDocument();
  });

  it("says what will change, and that nothing is lost", async () => {
    const user = userEvent.setup();
    mockApi({ revisions: [revision({ revision: 1 }), revision({ revision: 2 })] });
    renderWith();

    await user.click((await screen.findAllByRole("button", { name: /revert here/i }))[0]);

    expect(screen.getByText(/the title becomes/i)).toBeInTheDocument();
    // The revert-not-reset promise, said in the place the decision is made.
    expect(screen.getByText(/nothing is deleted/i)).toBeInTheDocument();
  });

  it("reverts once confirmed, naming the revision", async () => {
    const user = userEvent.setup();
    mockApi({ revisions: [revision({ revision: 1 }), revision({ revision: 2 })] });
    renderWith();

    await user.click((await screen.findAllByRole("button", { name: /revert here/i }))[0]);
    await user.click(screen.getByRole("button", { name: /revert to revision 1/i }));

    await waitFor(() => expect(callsTo("/revert")).toHaveLength(1));
    const [, init] = callsTo("/revert")[0];
    expect(JSON.parse((init as RequestInit).body as string)).toEqual({ revision: 1 });
  });

  it("does not offer a revert to the state it is already in", async () => {
    mockApi({ revisions: [revision({ revision: 1 }), revision({ revision: 2 })] });
    renderWith();

    // Two revisions, one revert control: the newest is where you already are.
    await waitFor(async () =>
      expect(await screen.findAllByRole("button", { name: /revert here/i })).toHaveLength(1),
    );
  });
});

describe("the comments tab", () => {
  it("does not load comments until asked", async () => {
    const user = userEvent.setup();
    mockApi();
    renderWith();

    await screen.findByText(/original title/i);
    expect(callsTo("/comments")).toHaveLength(0);

    await user.click(screen.getByRole("button", { name: "Comments" }));
    await waitFor(() => expect(callsTo("/comments").length).toBeGreaterThan(0));
  });

  it("posts a note and says so when it fails", async () => {
    const user = userEvent.setup();
    mockApi();
    renderWith();

    await user.click(screen.getByRole("button", { name: "Comments" }));
    await user.type(await screen.findByLabelText(/add a note/i), "why this is parked");
    await user.click(screen.getByRole("button", { name: /add comment/i }));

    await waitFor(() => {
      const posts = vi
        .mocked(fetch)
        .mock.calls.filter(
          ([url, init]) =>
            String(url).includes("/comments") &&
            (init as RequestInit | undefined)?.method === "POST",
        );
      expect(posts).toHaveLength(1);
    });
  });
});
