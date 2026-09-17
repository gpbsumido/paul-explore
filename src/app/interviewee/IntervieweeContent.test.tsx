import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "@/test/a11y";
import IntervieweeContent from "./IntervieweeContent";
import type { Interview } from "@/lib/interviewee/types";

const push = vi.fn();
vi.mock("next/navigation", () => ({
  usePathname: () => "/interviewee",
  useRouter: () => ({ push }),
}));

vi.mock("@/components/PageHeader", () => ({ default: () => null }));
vi.mock("@/components/PageShell", () => ({
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

const INTERVIEWS: Interview[] = [
  {
    id: "sardine-2-hiring-manager",
    title: "Sardine Interview 2: Hiring manager",
    summary: "Senior frontend deep dive.",
    topics: [
      {
        id: "perf",
        title: "Performance",
        summary: "Making the dashboard fast.",
        entries: [
          {
            question: "How do you profile a slow page?",
            points: ["Measure first, with the profiler."],
          },
        ],
        related: [],
      },
    ],
  },
  {
    id: "general",
    title: "General practice",
    summary: "Warm-up.",
    topics: [
      { id: "testing", title: "Testing", summary: "Coverage.", entries: [{ question: "q", points: ["pure logic"] }], related: [] },
      { id: "sysdesign", title: "System Design", summary: "Scale.", entries: [{ question: "q", points: ["hash the id"] }], related: [] },
    ],
  },
];

beforeEach(() => {
  push.mockReset();
  window.localStorage.clear();
});

describe("IntervieweeContent", () => {
  it("shows the deck heading and a card for every interview when the search is empty", () => {
    render(<IntervieweeContent interviews={INTERVIEWS} />);
    expect(
      screen.getByRole("heading", { level: 1, name: /interviewee/i }),
    ).toBeInTheDocument();
    for (const iv of INTERVIEWS) {
      expect(
        screen.getByRole("link", { name: new RegExp(iv.title) }),
      ).toHaveAttribute("href", `/interviewee/${iv.id}`);
    }
  });

  it("opens the nth interview when its number key is pressed", async () => {
    const user = userEvent.setup();
    render(<IntervieweeContent interviews={INTERVIEWS} />);
    // focus something outside the search box first so the digit isn't typed
    screen.getByRole("link", { name: /Sardine/ }).focus();
    await user.keyboard("2");
    expect(push).toHaveBeenCalledWith("/interviewee/general");
  });

  it("shows a reviewed count per interview", () => {
    render(<IntervieweeContent interviews={INTERVIEWS} />);
    expect(screen.getByText("0/2 reviewed")).toBeInTheDocument();
  });

  it("filters to matching topics across interviews when I type, deep into the text", async () => {
    const user = userEvent.setup();
    render(<IntervieweeContent interviews={INTERVIEWS} />);

    // 'profiler' only appears inside a point on the Performance topic.
    await user.type(screen.getByRole("searchbox"), "profiler");

    const results = screen.getByRole("region", { name: /search results/i });
    expect(
      within(results).getByRole("link", { name: /Performance/ }),
    ).toHaveAttribute("href", "/interviewee/sardine-2-hiring-manager/perf");

    // the interview cards are gone while searching
    expect(
      screen.queryByRole("link", { name: /General practice/ }),
    ).not.toBeInTheDocument();
  });

  it("opens the top result when Enter is pressed in the search box", async () => {
    const user = userEvent.setup();
    render(<IntervieweeContent interviews={INTERVIEWS} />);
    await user.type(screen.getByRole("searchbox"), "performance{Enter}");
    expect(push).toHaveBeenCalledWith(
      "/interviewee/sardine-2-hiring-manager/perf",
    );
  });

  it("shows an empty state when nothing matches", async () => {
    const user = userEvent.setup();
    render(<IntervieweeContent interviews={INTERVIEWS} />);
    await user.type(screen.getByRole("searchbox"), "kubernetes");
    expect(screen.getByText(/no topics match/i)).toBeInTheDocument();
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });

  it("has no accessibility violations, empty and while searching", async () => {
    const user = userEvent.setup();
    const { container } = render(<IntervieweeContent interviews={INTERVIEWS} />);
    expect(await axe(container)).toHaveNoViolations();
    await user.type(screen.getByRole("searchbox"), "performance");
    expect(await axe(container)).toHaveNoViolations();
  });
});
