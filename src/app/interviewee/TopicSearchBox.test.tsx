import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "@/test/a11y";
import TopicSearchBox from "./TopicSearchBox";
import type { Interview } from "@/lib/interviewee/types";

const push = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));

const INTERVIEWS: Interview[] = [
  {
    id: "sardine",
    title: "Sardine round",
    summary: "Deep dive.",
    topics: [
      {
        id: "perf",
        title: "Performance",
        summary: "Making it fast.",
        entries: [{ question: "profile a slow page?", points: ["use the profiler"] }],
        related: [],
      },
    ],
  },
  {
    id: "general",
    title: "General practice",
    summary: "Warm-up.",
    topics: [
      {
        id: "refactor",
        title: "The refactor",
        summary: "A rewrite.",
        entries: [
          { question: "how?", points: ["watched the performance numbers per slice"] },
        ],
        related: [],
      },
    ],
  },
];

beforeEach(() => push.mockReset());

describe("TopicSearchBox", () => {
  it("opens a listbox of matching topics, shown by title", async () => {
    const user = userEvent.setup();
    render(<TopicSearchBox interviews={INTERVIEWS} />);
    await user.type(screen.getByRole("combobox"), "performance");

    const listbox = screen.getByRole("listbox");
    const options = within(listbox).getAllByRole("option");
    // Both topics mention 'performance'; the title match ranks first.
    expect(options[0]).toHaveTextContent("Performance");
    expect(options.some((o) => o.textContent?.includes("The refactor"))).toBe(true);
  });

  it("labels each result with its interview", async () => {
    const user = userEvent.setup();
    render(<TopicSearchBox interviews={INTERVIEWS} />);
    await user.type(screen.getByRole("combobox"), "refactor");
    expect(screen.getByRole("option", { name: /General practice/ })).toBeInTheDocument();
  });

  it("opens the active option with the arrow keys and Enter", async () => {
    const user = userEvent.setup();
    render(<TopicSearchBox interviews={INTERVIEWS} />);
    await user.type(screen.getByRole("combobox"), "performance");
    await user.keyboard("{ArrowDown}{Enter}");
    // ArrowDown moves from index 0 to 1 (The refactor).
    expect(push).toHaveBeenCalledWith("/interviewee/general/refactor");
  });

  it("opens a result when it's clicked", async () => {
    const user = userEvent.setup();
    render(<TopicSearchBox interviews={INTERVIEWS} />);
    await user.type(screen.getByRole("combobox"), "performance");
    await user.click(screen.getByRole("option", { name: /Performance/ }));
    expect(push).toHaveBeenCalledWith("/interviewee/sardine/perf");
  });

  it("closes the listbox on Escape", async () => {
    const user = userEvent.setup();
    render(<TopicSearchBox interviews={INTERVIEWS} />);
    await user.type(screen.getByRole("combobox"), "performance");
    expect(screen.getByRole("listbox")).toBeInTheDocument();
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("shows an empty state when nothing matches", async () => {
    const user = userEvent.setup();
    render(<TopicSearchBox interviews={INTERVIEWS} />);
    await user.type(screen.getByRole("combobox"), "kubernetes");
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    expect(screen.getByText(/no topics match/i)).toBeInTheDocument();
  });

  it("stops at the last result and the first, rather than running off either end", async () => {
    const user = userEvent.setup();
    render(<TopicSearchBox interviews={INTERVIEWS} />);
    await user.type(screen.getByRole("combobox"), "performance");
    await user.keyboard("{ArrowDown}{ArrowDown}{ArrowDown}{Enter}");
    expect(push).toHaveBeenLastCalledWith("/interviewee/general/refactor");

    await user.keyboard("{ArrowUp}{ArrowUp}{ArrowUp}{Enter}");
    expect(push).toHaveBeenLastCalledWith("/interviewee/sardine/perf");
  });

  it("opens the result under the mouse, not the one the keyboard left on", async () => {
    const user = userEvent.setup();
    render(<TopicSearchBox interviews={INTERVIEWS} />);
    await user.type(screen.getByRole("combobox"), "performance");
    await user.hover(screen.getByRole("option", { name: /The refactor/ }));
    await user.keyboard("{Enter}");
    expect(push).toHaveBeenCalledWith("/interviewee/general/refactor");
  });

  it("starts from the top result again when the query changes", async () => {
    const user = userEvent.setup();
    render(<TopicSearchBox interviews={INTERVIEWS} />);
    await user.type(screen.getByRole("combobox"), "performanc");
    await user.keyboard("{ArrowDown}");
    await user.type(screen.getByRole("combobox"), "e");
    await user.keyboard("{Enter}");
    expect(push).toHaveBeenCalledWith("/interviewee/sardine/perf");
  });

  it("shows the first eight matches and says how many more there are", async () => {
    const user = userEvent.setup();
    const many: Interview[] = [
      {
        id: "big",
        title: "Big",
        summary: "Lots.",
        topics: Array.from({ length: 11 }, (_, i) => ({
          id: `t${i}`,
          title: `Widget ${i}`,
          summary: "s",
          entries: [],
          related: [],
        })),
      },
    ];
    render(<TopicSearchBox interviews={many} />);
    await user.type(screen.getByRole("combobox"), "widget");
    const options = within(screen.getByRole("listbox")).getAllByRole("option");
    expect(options).toHaveLength(9);
    expect(options[8]).toHaveTextContent("and 3 more");
  });

  it("clears the query on a second Escape", async () => {
    const user = userEvent.setup();
    render(<TopicSearchBox interviews={INTERVIEWS} />);
    const box = screen.getByRole("combobox");
    await user.type(box, "performance");
    await user.keyboard("{Escape}");
    expect(box).toHaveValue("performance");
    await user.keyboard("{Escape}");
    expect(box).toHaveValue("");
  });

  it("does nothing on Enter once the list has been closed", async () => {
    const user = userEvent.setup();
    render(<TopicSearchBox interviews={INTERVIEWS} />);
    await user.type(screen.getByRole("combobox"), "performance");
    await user.keyboard("{Escape}{Enter}");
    expect(push).not.toHaveBeenCalled();
  });

  it("shows neither a list nor an empty state for a blank query", async () => {
    const user = userEvent.setup();
    render(<TopicSearchBox interviews={INTERVIEWS} />);
    await user.type(screen.getByRole("combobox"), "   ");
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    expect(screen.queryByText(/no topics match/i)).not.toBeInTheDocument();
  });

  it("has no accessibility violations, closed and open", async () => {
    const user = userEvent.setup();
    const { container } = render(<TopicSearchBox interviews={INTERVIEWS} />);
    expect(await axe(container)).toHaveNoViolations();
    await user.type(screen.getByRole("combobox"), "performance");
    expect(await axe(container)).toHaveNoViolations();
  });
});
