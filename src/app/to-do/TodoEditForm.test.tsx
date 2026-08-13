import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import TodoEditForm from "./TodoEditForm";
import type { Todo } from "./TodoContent";

const todo: Todo = {
  id: "11111111-1111-1111-1111-111111111111",
  project: "portfolio_api",
  phase: 1,
  position: 3,
  title: "Original title",
  detail: "some detail",
  reason: null,
  blocking: false,
  command: null,
  pr_repo: null,
  pr_number: null,
  done: false,
  done_at: null,
};

function renderWith(onDone = vi.fn()) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  render(
    <QueryClientProvider client={client}>
      <TodoEditForm todo={todo} onDone={onDone} />
    </QueryClientProvider>,
  );
  return onDone;
}

const patchCalls = () =>
  vi
    .mocked(fetch)
    .mock.calls.filter(([, init]) => (init as RequestInit | undefined)?.method === "PATCH");

const sentPatch = () => JSON.parse((patchCalls()[0][1] as RequestInit).body as string);

beforeEach(() => {
  vi.restoreAllMocks();
  vi.stubGlobal("fetch", vi.fn(async () => ({ ok: true, json: async () => ({}) }) as Response));
});

describe("editing an item", () => {
  it("sends only what changed", async () => {
    const user = userEvent.setup();
    renderWith();

    await user.clear(screen.getByLabelText(/^title$/i));
    await user.type(screen.getByLabelText(/^title$/i), "A better title");
    await user.click(screen.getByRole("button", { name: /save changes/i }));

    await waitFor(() => expect(patchCalls()).toHaveLength(1));
    // Sending the whole row would record a revision claiming every field moved,
    // which makes the timeline useless for the question it exists to answer.
    expect(sentPatch()).toEqual({ title: "A better title" });
  });

  it("finally makes reason settable from the page", async () => {
    const user = userEvent.setup();
    renderWith();

    await user.type(screen.getByLabelText(/why it exists/i), "because it blocks the release");
    await user.click(screen.getByRole("button", { name: /save changes/i }));

    await waitFor(() => expect(patchCalls()).toHaveLength(1));
    expect(sentPatch()).toEqual({ reason: "because it blocks the release" });
  });

  it("clears a field to null rather than an empty string", async () => {
    const user = userEvent.setup();
    renderWith();

    await user.clear(screen.getByLabelText(/^detail$/i));
    await user.click(screen.getByRole("button", { name: /save changes/i }));

    await waitFor(() => expect(patchCalls()).toHaveLength(1));
    // The column is nullable, not blank. Storing "" would make every read have
    // to know the difference.
    expect(sentPatch()).toEqual({ detail: null });
  });

  it("will not save when nothing has changed", async () => {
    renderWith();

    expect(screen.getByRole("button", { name: /save changes/i })).toBeDisabled();
    expect(screen.getByText(/no changes yet/i)).toBeInTheDocument();
  });

  it("will not save a blank title", async () => {
    const user = userEvent.setup();
    renderWith();

    await user.clear(screen.getByLabelText(/^title$/i));

    expect(screen.getByRole("button", { name: /save changes/i })).toBeDisabled();
  });

  it("says which fields will move before you commit to it", async () => {
    const user = userEvent.setup();
    renderWith();

    await user.type(screen.getByLabelText(/why it exists/i), "a reason");
    await user.click(screen.getByRole("button", { name: "4" }));

    // Saving writes a revision. Knowing what it will record beats guessing.
    expect(screen.getByText(/changing phase, reason/i)).toBeInTheDocument();
  });

  it("warns that changing phase moves the item to the end", async () => {
    const user = userEvent.setup();
    renderWith();

    await user.click(screen.getByRole("button", { name: "4" }));

    expect(screen.getByText(/puts this at the end of phase 4/i)).toBeInTheDocument();
  });

  it("keeps the edits and says so when the save fails", async () => {
    const user = userEvent.setup();
    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: false, status: 500 }) as Response));
    const onDone = renderWith();

    await user.type(screen.getByLabelText(/why it exists/i), "typed this out");
    await user.click(screen.getByRole("button", { name: /save changes/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent(/could not save/i);
    expect(screen.getByLabelText(/why it exists/i)).toHaveValue("typed this out");
    expect(onDone).not.toHaveBeenCalled();
  });
});
