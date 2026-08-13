import { describe, it, expect, vi, beforeEach } from "vitest";
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

const mockList = (todos: Todo[], over: Partial<Record<string, boolean>> = {}) => {
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string, init?: RequestInit) => {
      const method = init?.method ?? "GET";
      if (method === "PATCH") {
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
        return { ok: true, json: async () => ({}) } as Response;
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

  it("toggles when the checkbox itself is clicked", async () => {
    const user = userEvent.setup();
    mockList([item()]);
    renderWith();

    const box = await screen.findByRole("checkbox", { name: "Merge the thing" });
    await user.click(box);

    await waitFor(() => {
      const calls = vi.mocked(fetch).mock.calls.filter(
        ([, init]) => (init as RequestInit | undefined)?.method === "PATCH",
      );
      expect(calls).toHaveLength(1);
    });
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

  it("stays plain text when there is no PR", async () => {
    mockList([item()]);
    renderWith();

    await screen.findByRole("checkbox", { name: "Merge the thing" });
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

    expect(await screen.findByText("Rotate the key")).toBeInTheDocument();
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

  it("removes it once confirmed", async () => {
    const user = userEvent.setup();
    mockList([item()]);
    renderWith();

    await screen.findByRole("checkbox", { name: "Merge the thing" });
    await user.click(screen.getByRole("button", { name: /remove .*merge the thing/i }));
    await user.click(screen.getByRole("button", { name: /^remove$/i }));

    await waitFor(() => expect(callsFor("DELETE")).toHaveLength(1));
    expect(callsFor("DELETE")[0][0]).toContain(
      "/api/todos/11111111-1111-1111-1111-111111111111",
    );
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
