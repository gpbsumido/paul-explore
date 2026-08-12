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

const mockList = (todos: Todo[]) => {
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string, init?: RequestInit) => {
      if (init?.method === "PATCH") {
        return { ok: true, json: async () => ({}) } as Response;
      }
      return { ok: true, json: async () => ({ todos }) } as Response;
    }),
  );
};

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
