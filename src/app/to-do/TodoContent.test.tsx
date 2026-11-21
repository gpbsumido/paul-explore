import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import TodoContent, { type Todo } from "./TodoContent";

const item = (over: Partial<Todo> = {}): Todo => ({
  id: "11111111-1111-1111-1111-111111111111",
  project: "portfolio_api",
  phase: 1,
  position: 1,
  title: "Merge the thing",
  detail: "Some long explanatory detail that is easy to click while reading.",
  reason: null,
  blocking: false,
  command: null,
  pr_repo: null,
  pr_number: null,
  done: false,
  done_at: null,
  ...over,
});

function renderWith() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <TodoContent />
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  vi.restoreAllMocks();
});

// The stubbed fetch is global, so without this it outlives the test that set it
// and a late request from one test can land on the next one's mock.
afterEach(() => {
  vi.unstubAllGlobals();
});

/**
 * Stubs the to-do API. The flags make one endpoint fail or hang so a test can
 * look at what the page does in the gap before (or instead of) the server's
 * answer. `listHangsAfterLoad` lets the first GET through and then never
 * answers, so the post-mutation refetch cannot quietly repair a wrong screen.
 */
const mockList = (todos: Todo[], over: Partial<Record<string, boolean>> = {}) => {
  let listCalls = 0;
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string, init?: RequestInit) => {
      const method = init?.method ?? "GET";
      if (method === "PATCH") {
        if (over.patchFails) {
          return { ok: false, status: 500, json: async () => ({}) } as Response;
        }
        return { ok: true, json: async () => ({}) } as Response;
      }
      if (method === "POST") {
        if (over.postFails) {
          return { ok: false, status: 500, json: async () => ({}) } as Response;
        }
        // Never settles, so nothing can refetch. Anything on screen after this
        // got there optimistically rather than from the server.
        if (over.postHangs) {
          return new Promise<Response>(() => {});
        }
        return {
          ok: true,
          json: async () => ({ todo: item({ id: "server-assigned", title: "Rotate the key" }) }),
        } as Response;
      }
      if (method === "DELETE") {
        if (over.deleteFails) {
          return { ok: false, status: 500, json: async () => ({}) } as Response;
        }
        return { ok: true, json: async () => ({}) } as Response;
      }
      listCalls += 1;
      if (over.listFails) {
        return { ok: false, status: 500, json: async () => ({}) } as Response;
      }
      if (over.listHangsAfterLoad && listCalls > 1) {
        return new Promise<Response>(() => {});
      }
      return { ok: true, json: async () => ({ todos }) } as Response;
    }),
  );
};

const callsFor = (method: string) =>
  vi
    .mocked(fetch)
    .mock.calls.filter(
      ([, init]) => ((init as RequestInit | undefined)?.method ?? "GET") === method,
    );

describe("ticking a to-do", () => {
  it("does not toggle when the title or detail is clicked", async () => {
    const user = userEvent.setup();
    mockList([item()]);
    renderWith();

    const box = await screen.findByRole("checkbox", { name: "Merge the thing" });
    expect(box).not.toBeChecked();

    // Reading the row should never complete it. The detail text is long, and a
    // label wrapping the whole row made every stray click a state change.
    await user.click(screen.getByText("Merge the thing"));
    await user.click(screen.getByText(/easy to click while reading/));

    expect(box).not.toBeChecked();
    const calls = vi.mocked(fetch).mock.calls.filter(
      ([, init]) => (init as RequestInit | undefined)?.method === "PATCH",
    );
    expect(calls).toHaveLength(0);
  });

  it("ticks the item at once and tells the server which item and which way", async () => {
    const user = userEvent.setup();
    mockList([item()], { listHangsAfterLoad: true });
    renderWith();

    const box = await screen.findByRole("checkbox", { name: "Merge the thing" });
    await user.click(box);

    await waitFor(() => expect(callsFor("PATCH")).toHaveLength(1));
    const [url, init] = callsFor("PATCH")[0];
    expect(url).toBe("/api/todos/11111111-1111-1111-1111-111111111111");
    expect(JSON.parse((init as RequestInit).body as string)).toEqual({ done: true });
    expect(box).toBeChecked();
  });

  it("puts the box back when the save fails, instead of showing a tick that never landed", async () => {
    const user = userEvent.setup();
    // The refetch after the failure never answers, so the only thing that can
    // put the box back is the rollback itself.
    mockList([item()], { patchFails: true, listHangsAfterLoad: true });
    renderWith();

    const box = await screen.findByRole("checkbox", { name: "Merge the thing" });
    await user.click(box);

    await waitFor(() => expect(callsFor("PATCH")).toHaveLength(1));
    await waitFor(() => expect(box).not.toBeChecked());
  });

  it("unticks a finished item", async () => {
    const user = userEvent.setup();
    mockList([item({ done: true, done_at: "2026-08-01T00:00:00.000Z" })]);
    renderWith();

    await user.click(await screen.findByRole("checkbox", { name: "Merge the thing" }));

    await waitFor(() => expect(callsFor("PATCH")).toHaveLength(1));
    expect(JSON.parse((callsFor("PATCH")[0][1] as RequestInit).body as string)).toEqual({
      done: false,
    });
  });
});

describe("what the list shows", () => {
  it("groups items under their phase, in phase order, and each phase in position order", async () => {
    mockList([
      item({ id: "a", title: "Backlog thought", phase: 4, position: 1 }),
      item({ id: "b", title: "Second merge", phase: 1, position: 2 }),
      item({ id: "c", title: "First merge", phase: 1, position: 1 }),
      item({ id: "d", title: "Flip the switch", phase: 3, position: 1 }),
    ]);
    renderWith();

    await screen.findByRole("checkbox", { name: "First merge" });
    const headings = screen.getAllByRole("heading", { level: 2 }).map((h) => h.textContent);
    expect(headings).toEqual([
      "1. Merge and deploy",
      "3. Turn on what shipped inert",
      "4. Backlog",
    ]);
    const order = screen.getAllByRole("checkbox").map((box) => box.getAttribute("aria-label"));
    expect(order).toEqual(["First merge", "Second merge", "Flip the switch", "Backlog thought"]);
  });

  it("counts what is left and what is done", async () => {
    mockList([
      item({ id: "a", title: "One" }),
      item({ id: "b", title: "Two", done: true }),
      item({ id: "c", title: "Three", done: true }),
    ]);
    renderWith();

    expect(await screen.findByText("1 left")).toBeInTheDocument();
    expect(screen.getByText("2 done")).toBeInTheDocument();
  });

  it("only flags an item as blocking while it is still open", async () => {
    mockList([
      item({ id: "a", title: "Open blocker", blocking: true }),
      item({ id: "b", title: "Finished blocker", blocking: true, done: true }),
    ]);
    renderWith();

    await screen.findByRole("checkbox", { name: "Open blocker" });
    expect(screen.getAllByText("blocks the next step")).toHaveLength(1);
  });

  it("narrows to what is left, or to what is finished, without changing the counts", async () => {
    const user = userEvent.setup();
    mockList([
      item({ id: "a", title: "Still open" }),
      item({ id: "b", title: "Already done", done: true }),
    ]);
    renderWith();
    await screen.findByRole("checkbox", { name: "Still open" });

    await user.click(screen.getByRole("button", { name: "Left to do" }));
    expect(screen.getByRole("checkbox", { name: "Still open" })).toBeInTheDocument();
    expect(screen.queryByRole("checkbox", { name: "Already done" })).not.toBeInTheDocument();
    // The chips describe the whole list, not the slice.
    expect(screen.getByText("1 left")).toBeInTheDocument();
    expect(screen.getByText("1 done")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Finished" }));
    expect(screen.getByRole("checkbox", { name: "Already done" })).toBeInTheDocument();
    expect(screen.queryByRole("checkbox", { name: "Still open" })).not.toBeInTheDocument();
  });

  it("says so when a filter leaves nothing, and keeps the filter buttons to get back", async () => {
    const user = userEvent.setup();
    mockList([item({ done: true })]);
    renderWith();
    await screen.findByRole("checkbox", { name: "Merge the thing" });

    await user.click(screen.getByRole("button", { name: "Left to do" }));

    expect(screen.getByText(/nothing left/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "All" })).toBeInTheDocument();
  });

  it("says it could not load the list, rather than showing an empty one, and retries on request", async () => {
    const user = userEvent.setup();
    mockList([item()], { listFails: true });
    renderWith();

    expect(await screen.findByText(/could not load the list/i)).toBeInTheDocument();
    expect(screen.queryByText(/nothing outstanding/i)).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /try again/i }));
    await waitFor(() => expect(callsFor("GET").length).toBeGreaterThan(1));
  });

  it("shows an empty list as empty, with the add form still there to start it again", async () => {
    mockList([]);
    renderWith();

    expect(await screen.findByText(/nothing outstanding/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/new to-do/i)).toBeInTheDocument();
  });
});

describe("the PR chip", () => {
  it("links to the pull request it names", async () => {
    mockList([item({ pr_repo: "portfolio_api", pr_number: 137 })]);
    renderWith();

    const link = await screen.findByRole("link", { name: "portfolio_api#137" });
    expect(link).toHaveAttribute(
      "href",
      "https://github.com/gpbsumido/portfolio_api/pull/137",
    );
    // Following it leaves the app, so it should not take the tab with it.
    expect(link).toHaveAttribute("target", "_blank");
  });

  it("shows no chip at all when there is no PR number, even if a repo is recorded", async () => {
    mockList([item({ pr_repo: "portfolio_api", pr_number: null })]);
    renderWith();

    await screen.findByRole("checkbox", { name: "Merge the thing" });
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
    expect(screen.queryByText(/#/)).not.toBeInTheDocument();
  });

  it("shows the chip as plain text when the repo name could not be a real repo", async () => {
    // pr_repo is free text in the database; a slash would point the link elsewhere.
    mockList([item({ pr_repo: "evil/repo", pr_number: 5 })]);
    renderWith();

    await screen.findByText("evil/repo#5");
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });
});

describe("adding a to-do", () => {
  it("sends the title and the chosen project", async () => {
    const user = userEvent.setup();
    mockList([item()]);
    renderWith();

    await screen.findByRole("checkbox", { name: "Merge the thing" });
    await user.type(screen.getByLabelText(/new to-do/i), "Rotate the key");
    await user.click(screen.getByRole("button", { name: "paul-explore" }));
    await user.click(screen.getByRole("button", { name: /add to backlog/i }));

    await waitFor(() => expect(callsFor("POST")).toHaveLength(1));
    const [, init] = callsFor("POST")[0];
    expect(JSON.parse((init as RequestInit).body as string)).toEqual({
      title: "Rotate the key",
      project: "paul-explore",
    });
  });

  it("trims the title before sending it", async () => {
    const user = userEvent.setup();
    mockList([item()]);
    renderWith();

    await screen.findByRole("checkbox", { name: "Merge the thing" });
    await user.type(screen.getByLabelText(/new to-do/i), "  Rotate the key  ");
    await user.click(screen.getByRole("button", { name: /add to backlog/i }));

    await waitFor(() => expect(callsFor("POST")).toHaveLength(1));
    const [, init] = callsFor("POST")[0];
    expect(JSON.parse((init as RequestInit).body as string).title).toBe("Rotate the key");
  });

  it("will not send a blank title", async () => {
    const user = userEvent.setup();
    mockList([item()]);
    renderWith();

    await screen.findByRole("checkbox", { name: "Merge the thing" });
    await user.type(screen.getByLabelText(/new to-do/i), "   ");
    await user.click(screen.getByRole("button", { name: /add to backlog/i }));

    expect(callsFor("POST")).toHaveLength(0);
  });

  it("shows the new item straight away, before the server answers", async () => {
    const user = userEvent.setup();
    mockList([item()], { postHangs: true });
    renderWith();

    await screen.findByRole("checkbox", { name: "Merge the thing" });
    await user.type(screen.getByLabelText(/new to-do/i), "Rotate the key");
    await user.click(screen.getByRole("button", { name: /add to backlog/i }));

    expect(await screen.findByRole("checkbox", { name: "Rotate the key" })).toBeInTheDocument();
    // Quick add always lands in the backlog, never claiming to be urgent.
    expect(screen.getByRole("heading", { level: 2, name: "4. Backlog" })).toBeInTheDocument();
  });

  it("takes the optimistic row back out when the add fails", async () => {
    const user = userEvent.setup();
    // The refetch never answers, so only the rollback can remove the row.
    mockList([item()], { postFails: true, listHangsAfterLoad: true });
    renderWith();

    await screen.findByRole("checkbox", { name: "Merge the thing" });
    await user.type(screen.getByLabelText(/new to-do/i), "Rotate the key");
    await user.click(screen.getByRole("button", { name: /add to backlog/i }));

    expect(await screen.findByRole("alert")).toBeInTheDocument();
    expect(screen.queryByRole("checkbox", { name: "Rotate the key" })).not.toBeInTheDocument();
  });

  it("keeps the typed text and says so when the add fails", async () => {
    const user = userEvent.setup();
    mockList([item()], { postFails: true });
    renderWith();

    await screen.findByRole("checkbox", { name: "Merge the thing" });
    const box = screen.getByLabelText(/new to-do/i);
    await user.type(box, "Rotate the key");
    await user.click(screen.getByRole("button", { name: /add to backlog/i }));

    // Losing a sentence you just typed because the network blinked is the kind
    // of small betrayal that stops a tool being used.
    expect(await screen.findByRole("alert")).toHaveTextContent(/could not add/i);
    expect(box).toHaveValue("Rotate the key");
  });
});

describe("removing a to-do", () => {
  it("asks before it fires", async () => {
    const user = userEvent.setup();
    mockList([item()]);
    renderWith();

    await screen.findByRole("checkbox", { name: "Merge the thing" });
    await user.click(screen.getByRole("button", { name: /remove .*merge the thing/i }));

    // One click next to a checkbox must not be destructive.
    expect(callsFor("DELETE")).toHaveLength(0);
    expect(screen.getByRole("button", { name: /^remove$/i })).toBeInTheDocument();
  });

  it("removes it once confirmed, and takes it off the list without waiting for a refetch", async () => {
    const user = userEvent.setup();
    mockList([item()], { listHangsAfterLoad: true });
    renderWith();

    await screen.findByRole("checkbox", { name: "Merge the thing" });
    await user.click(screen.getByRole("button", { name: /remove .*merge the thing/i }));
    await user.click(screen.getByRole("button", { name: /^remove$/i }));

    await waitFor(() => expect(callsFor("DELETE")).toHaveLength(1));
    expect(callsFor("DELETE")[0][0]).toContain(
      "/api/todos/11111111-1111-1111-1111-111111111111",
    );
    expect(screen.queryByRole("checkbox", { name: "Merge the thing" })).not.toBeInTheDocument();
  });

  it("puts the item back if the server refuses to remove it", async () => {
    const user = userEvent.setup();
    mockList([item()], { deleteFails: true, listHangsAfterLoad: true });
    renderWith();

    await screen.findByRole("checkbox", { name: "Merge the thing" });
    await user.click(screen.getByRole("button", { name: /remove .*merge the thing/i }));
    await user.click(screen.getByRole("button", { name: /^remove$/i }));

    await waitFor(() => expect(callsFor("DELETE")).toHaveLength(1));
    expect(await screen.findByRole("checkbox", { name: "Merge the thing" })).toBeInTheDocument();
  });

  it("leaves it alone when cancelled", async () => {
    const user = userEvent.setup();
    mockList([item()]);
    renderWith();

    await screen.findByRole("checkbox", { name: "Merge the thing" });
    await user.click(screen.getByRole("button", { name: /remove .*merge the thing/i }));
    await user.click(screen.getByRole("button", { name: /cancel/i }));

    expect(callsFor("DELETE")).toHaveLength(0);
    expect(screen.getByText("Merge the thing")).toBeInTheDocument();
  });
});
