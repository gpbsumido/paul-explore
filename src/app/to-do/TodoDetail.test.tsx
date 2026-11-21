import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
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
const mockApi = (
  over: {
    revisions?: unknown;
    revisionsFail?: boolean;
    revertFails?: boolean;
    commentPostFails?: boolean;
    comments?: unknown[];
    commentsFail?: boolean;
  } = {},
) => {
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
          if (over.commentsFail) return { ok: false, status: 500 } as Response;
          return {
            ok: true,
            json: async () => ({ comments: over.comments ?? [] }),
          } as Response;
        }
        if (over.commentPostFails) return { ok: false, status: 500 } as Response;
        return { ok: true, json: async () => ({ comment: {} }) } as Response;
      }
      if (url.includes("/revert")) {
        if (over.revertFails) return { ok: false, status: 500 } as Response;
        return { ok: true, json: async () => ({}) } as Response;
      }
      return { ok: true, json: async () => ({}) } as Response;
    }),
  );
};

const callsTo = (fragment: string) =>
  vi.mocked(fetch).mock.calls.filter(([url]) => String(url).includes(fragment));

const commentPosts = () =>
  callsTo("/comments").filter(([, init]) => (init as RequestInit | undefined)?.method === "POST");

beforeEach(() => {
  vi.restoreAllMocks();
});

// The stubbed fetch is global, so it has to be taken down with the test.
afterEach(() => {
  vi.unstubAllGlobals();
});

const comment = (over: Record<string, unknown> = {}) => ({
  id: "c-1",
  body: "parked until the migration lands",
  actor: "owner@example.com",
  created_at: "2026-08-13T10:00:00.000Z",
  updated_at: "2026-08-13T10:00:00.000Z",
  ...over,
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

  it("says what the item will become, and that nothing is lost", async () => {
    const user = userEvent.setup();
    mockApi({
      revisions: [
        revision({ revision: 1, snapshot: { ...todo, title: "Original title", done: false } }),
        revision({ revision: 2, snapshot: { ...todo, title: "Renamed later", done: true } }),
      ],
    });
    renderWith();

    await user.click((await screen.findAllByRole("button", { name: /revert here/i }))[0]);

    // It names the revision being offered, not the one already current.
    expect(screen.getByText(/revert to revision 1\?/i)).toHaveTextContent(
      /the title becomes .Original title. and it will be marked not done/i,
    );
    // The revert-not-reset promise, said in the place the decision is made.
    expect(screen.getByText(/nothing is deleted/i)).toBeInTheDocument();
  });

  it("says the item will be marked done when the revision it goes back to was ticked", async () => {
    const user = userEvent.setup();
    mockApi({
      revisions: [
        revision({ revision: 1, snapshot: { ...todo, title: "Was ticked", done: true } }),
        revision({ revision: 2, snapshot: { ...todo, title: "Was ticked", done: false } }),
      ],
    });
    renderWith();

    await user.click((await screen.findAllByRole("button", { name: /revert here/i }))[0]);

    expect(screen.getByText(/revert to revision 1\?/i)).toHaveTextContent(/it will be marked done\./i);
  });

  it("leaves the history alone when the revert is cancelled", async () => {
    const user = userEvent.setup();
    mockApi({ revisions: [revision({ revision: 1 }), revision({ revision: 2 })] });
    renderWith();

    await user.click((await screen.findAllByRole("button", { name: /revert here/i }))[0]);
    await user.click(screen.getByRole("button", { name: /cancel/i }));

    expect(callsTo("/revert")).toHaveLength(0);
    expect(screen.queryByText(/nothing is deleted/i)).not.toBeInTheDocument();
  });

  it("says nothing changed when the revert fails", async () => {
    const user = userEvent.setup();
    mockApi({ revisions: [revision({ revision: 1 }), revision({ revision: 2 })], revertFails: true });
    renderWith();

    await user.click((await screen.findAllByRole("button", { name: /revert here/i }))[0]);
    await user.click(screen.getByRole("button", { name: /revert to revision 1/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent(/could not revert/i);
  });

  it("lists the newest revision first and labels each kind of change readably", async () => {
    mockApi({
      revisions: [
        revision({ revision: 1, change_kind: "created" }),
        revision({ revision: 2, change_kind: "ticked" }),
        revision({ revision: 3, change_kind: "reverted" }),
      ],
    });
    renderWith();

    await screen.findByText("rev 3");
    const order = screen.getAllByText(/^rev \d$/).map((chip) => chip.textContent);
    expect(order).toEqual(["rev 3", "rev 2", "rev 1"]);
    expect(screen.getByText("ticked")).toBeInTheDocument();
    expect(screen.getByText("reverted")).toBeInTheDocument();
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

  it("posts the note it was given, trimmed", async () => {
    const user = userEvent.setup();
    mockApi();
    renderWith();

    await user.click(screen.getByRole("button", { name: "Comments" }));
    await user.type(await screen.findByLabelText(/add a note/i), "  why this is parked  ");
    await user.click(screen.getByRole("button", { name: /add comment/i }));

    await waitFor(() => expect(commentPosts()).toHaveLength(1));
    expect(JSON.parse((commentPosts()[0][1] as RequestInit).body as string)).toEqual({
      body: "why this is parked",
    });
  });

  it("clears the box once the note has landed", async () => {
    const user = userEvent.setup();
    mockApi();
    renderWith();

    await user.click(screen.getByRole("button", { name: "Comments" }));
    const box = await screen.findByLabelText(/add a note/i);
    await user.type(box, "why this is parked");
    await user.click(screen.getByRole("button", { name: /add comment/i }));

    await waitFor(() => expect(box).toHaveValue(""));
  });

  it("keeps the text and says so when the note fails to post", async () => {
    const user = userEvent.setup();
    mockApi({ commentPostFails: true });
    renderWith();

    await user.click(screen.getByRole("button", { name: "Comments" }));
    const box = await screen.findByLabelText(/add a note/i);
    await user.type(box, "why this is parked");
    await user.click(screen.getByRole("button", { name: /add comment/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent(/could not add that/i);
    expect(box).toHaveValue("why this is parked");
  });

  it("does not post a blank note", async () => {
    const user = userEvent.setup();
    mockApi();
    renderWith();

    await user.click(screen.getByRole("button", { name: "Comments" }));
    await user.type(await screen.findByLabelText(/add a note/i), "   ");
    await user.click(screen.getByRole("button", { name: /add comment/i }));

    expect(commentPosts()).toHaveLength(0);
  });

  it("shows the notes already on the item, and an empty message when there are none", async () => {
    const user = userEvent.setup();
    mockApi({ comments: [comment()] });
    const withNote = renderWith();
    await user.click(screen.getByRole("button", { name: "Comments" }));
    expect(await screen.findByText("parked until the migration lands")).toBeInTheDocument();
    withNote.unmount();

    mockApi({ comments: [] });
    renderWith();
    await user.click(screen.getByRole("button", { name: "Comments" }));
    expect(await screen.findByText(/no notes on this one yet/i)).toBeInTheDocument();
  });

  it("says it could not load the notes, rather than showing none", async () => {
    const user = userEvent.setup();
    mockApi({ commentsFail: true });
    renderWith();

    await user.click(screen.getByRole("button", { name: "Comments" }));

    expect(await screen.findByText(/could not load the comments/i)).toBeInTheDocument();
    expect(screen.queryByText(/no notes on this one yet/i)).not.toBeInTheDocument();
  });

  it("edits a note in place and sends the new text for that note", async () => {
    const user = userEvent.setup();
    mockApi({ comments: [comment({ id: "c-9" })] });
    renderWith();

    await user.click(screen.getByRole("button", { name: "Comments" }));
    await user.click(await screen.findByRole("button", { name: "edit" }));
    const box = screen.getByLabelText(/edit comment/i);
    expect(box).toHaveValue("parked until the migration lands");
    await user.clear(box);
    await user.type(box, "unparked");
    await user.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() => expect(callsTo("/api/todos/comments/c-9")).toHaveLength(1));
    const [, init] = callsTo("/api/todos/comments/c-9")[0];
    expect((init as RequestInit).method).toBe("PATCH");
    expect(JSON.parse((init as RequestInit).body as string)).toEqual({ body: "unparked" });
  });

  it("deletes the note it was asked to delete", async () => {
    const user = userEvent.setup();
    mockApi({ comments: [comment({ id: "c-9" })] });
    renderWith();

    await user.click(screen.getByRole("button", { name: "Comments" }));
    await user.click(await screen.findByRole("button", { name: "delete" }));

    await waitFor(() => expect(callsTo("/api/todos/comments/c-9")).toHaveLength(1));
    expect((callsTo("/api/todos/comments/c-9")[0][1] as RequestInit).method).toBe("DELETE");
  });
});
