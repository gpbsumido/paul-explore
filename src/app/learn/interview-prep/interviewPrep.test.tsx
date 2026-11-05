import { describe, it, expect, beforeAll, beforeEach } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";
import type { ReactElement } from "react";
import { http, HttpResponse } from "msw";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { server } from "@/test/server";
import { axe } from "@/test/a11y";
import { ThemeProvider } from "@/components/ThemeProvider";
import { PATTERNS, patternById } from "@/lib/leetcode/patterns";
import { drillDeck } from "@/lib/leetcode/drill";
import LeetCodeHub from "./LeetCodeHub";
import PatternContent from "./[pattern]/PatternContent";
import DrillContent from "./drill/DrillContent";
import PlanContent from "./plan/PlanContent";
import ToolkitContent from "./toolkit/ToolkitContent";
import LearnHub from "../LearnHub";

const REVIEW_KEY = "learn-leetcode-review-v1";
const DRILL_KEY = "learn-leetcode-drill-v1";

beforeAll(() => {
  // the page header asks who is signed in; answer so MSW doesn't error
  server.use(http.get("*/api/me", () => HttpResponse.json({ sub: null, name: null })));
});

beforeEach(() => localStorage.clear());

function renderPage(page: ReactElement) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <ThemeProvider>{page}</ThemeProvider>
    </QueryClientProvider>,
  );
}

describe("the learn hub", () => {
  it("points at the playbook before the topic list", () => {
    renderPage(<LearnHub />);
    expect(screen.getByRole("link", { name: /interview prep/i })).toHaveAttribute("href", "/learn/interview-prep");
  });
});

describe("the playbook hub", () => {
  it("links every pattern from the roadmap", () => {
    renderPage(<LeetCodeHub />);
    const roadmap = screen.getByRole("region", { name: /roadmap/i });
    for (const pattern of PATTERNS) {
      expect(
        within(roadmap).getByRole("link", { name: new RegExp(`^${pattern.name}`) }),
      ).toHaveAttribute("href", `/learn/interview-prep/${pattern.id}`);
    }
  });

  it("suggests patterns from a pasted problem statement and shows why", () => {
    renderPage(<LeetCodeHub />);
    fireEvent.change(screen.getByRole("textbox", { name: /problem statement/i }), {
      target: { value: "Find the length of the longest substring without repeating characters." },
    });
    const results = screen.getByRole("list", { name: /likely patterns/i });
    const first = within(results).getAllByRole("listitem")[0];
    expect(within(first).getByRole("link", { name: /sliding window/i })).toHaveAttribute(
      "href",
      "/learn/interview-prep/sliding-window",
    );
    expect(first).toHaveTextContent(/longest substring/i);
  });

  it("says so when a statement has no signals in it", () => {
    renderPage(<LeetCodeHub />);
    fireEvent.change(screen.getByRole("textbox", { name: /problem statement/i }), {
      target: { value: "hello there" },
    });
    expect(screen.getByText(/no signals yet/i)).toBeInTheDocument();
  });

  it("turns the largest input size into a complexity budget", () => {
    renderPage(<LeetCodeHub />);
    fireEvent.change(screen.getByRole("spinbutton", { name: /largest input size/i }), {
      target: { value: "100000" },
    });
    expect(screen.getByRole("status", { name: /complexity budget/i })).toHaveTextContent("O(n log n)");
  });

  it("lists problems that are due for a re-solve", () => {
    localStorage.setItem(
      REVIEW_KEY,
      JSON.stringify({ "two-sum": { step: 0, due: Date.now() - 1000, lastReviewed: 0, reviews: 1 } }),
    );
    renderPage(<LeetCodeHub />);
    const due = screen.getByRole("region", { name: /due today/i });
    expect(within(due).getByRole("link", { name: /two sum/i })).toBeInTheDocument();
  });

  it("has no axe violations", async () => {
    const { container } = renderPage(<LeetCodeHub />);
    expect(await axe(container)).toHaveNoViolations();
  });
});

describe("a pattern page", () => {
  const pattern = patternById("sliding-window")!;

  it("names the pattern and the signals that give it away", () => {
    renderPage(<PatternContent patternId={pattern.id} />);
    expect(screen.getByRole("heading", { level: 1, name: pattern.name })).toBeInTheDocument();
    for (const signal of pattern.signals) {
      expect(screen.getAllByText(signal.phrase, { exact: false }).length).toBeGreaterThan(0);
    }
  });

  it("hides the template until asked, so it can be written from memory first", () => {
    renderPage(<PatternContent patternId={pattern.id} />);
    const reveal = screen.getByRole("button", { name: /show the template/i });
    expect(reveal).toHaveAttribute("aria-expanded", "false");
    fireEvent.click(reveal);
    expect(screen.getByRole("button", { name: /hide the template/i })).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByText(pattern.template.code.split("\n")[0], { exact: false })).toBeInTheDocument();
  });

  it("links each problem to LeetCode in a new tab, safely", () => {
    renderPage(<PatternContent patternId={pattern.id} />);
    const ladder = screen.getByRole("region", { name: /problem ladder/i });
    const links = within(ladder).getAllByRole("link", { name: /opens in a new tab/i });
    expect(links).toHaveLength(pattern.problems.length);
    expect(links[0]).toHaveAttribute("href", `https://leetcode.com/problems/${pattern.problems[0].slug}/`);
    expect(links[0]).toHaveAttribute("target", "_blank");
    expect(links[0].getAttribute("rel")).toContain("noopener");
  });

  it("schedules a re-solve when a problem is marked solved", () => {
    renderPage(<PatternContent patternId={pattern.id} />);
    const first = pattern.problems[0];
    const row = screen.getByRole("group", { name: new RegExp(`rate ${first.title}`, "i") });
    fireEvent.click(within(row).getByRole("button", { name: /good/i }));
    const stored = JSON.parse(localStorage.getItem(REVIEW_KEY) ?? "{}");
    expect(stored[first.slug]).toMatchObject({ step: 0, reviews: 1 });
    expect(screen.getByText(/re-solve in 1 day/i)).toBeInTheDocument();
  });

  it("has no axe violations", async () => {
    const { container } = renderPage(<PatternContent patternId={pattern.id} />);
    expect(await axe(container)).toHaveNoViolations();
  });
});

describe("the recognition drill", () => {
  const firstCard = drillDeck(PATTERNS)[0];
  const answerName = patternById(firstCard.patternId)!.name;

  it("asks which pattern a problem wants, and confirms a right answer", () => {
    renderPage(<DrillContent />);
    expect(screen.getByText(firstCard.problem.prompt)).toBeInTheDocument();
    const options = screen.getByRole("group", { name: /which pattern/i });
    fireEvent.click(within(options).getByRole("button", { name: answerName }));
    expect(screen.getByRole("status")).toHaveTextContent(/correct/i);
    expect(screen.getByText(firstCard.problem.tell)).toBeInTheDocument();
    const stored = JSON.parse(localStorage.getItem(DRILL_KEY) ?? "{}");
    expect(stored[firstCard.problem.slug]).toMatchObject({ reviews: 1 });
  });

  it("names the right pattern after a wrong answer and brings the card back tomorrow", () => {
    renderPage(<DrillContent />);
    const options = screen.getByRole("group", { name: /which pattern/i });
    const wrong = within(options)
      .getAllByRole("button")
      .find((b) => b.textContent !== answerName)!;
    fireEvent.click(wrong);
    expect(screen.getByRole("status")).toHaveTextContent(/not quite/i);
    expect(screen.getByRole("status")).toHaveTextContent(answerName);
    const stored = JSON.parse(localStorage.getItem(DRILL_KEY) ?? "{}");
    expect(stored[firstCard.problem.slug]).toMatchObject({ step: 0 });
  });

  it("moves on to a different card", () => {
    renderPage(<DrillContent />);
    const options = screen.getByRole("group", { name: /which pattern/i });
    fireEvent.click(within(options).getByRole("button", { name: answerName }));
    fireEvent.click(screen.getByRole("button", { name: /next card/i }));
    expect(screen.queryByText(firstCard.problem.prompt)).not.toBeInTheDocument();
  });

  it("has no axe violations", async () => {
    const { container } = renderPage(<DrillContent />);
    expect(await axe(container)).toHaveNoViolations();
  });
});

describe("the study plan and the toolkit", () => {
  it("lays out the routine, the schedule and the interview script", () => {
    renderPage(<PlanContent />);
    expect(screen.getByRole("heading", { level: 1 })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /every problem, the same way/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /eight weeks/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /in the room/i })).toBeInTheDocument();
  });

  it("shows the toolkit with the heap a reader will need", () => {
    renderPage(<ToolkitContent />);
    expect(screen.getByRole("heading", { level: 1 })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /heap/i })).toBeInTheDocument();
  });

  it("have no axe violations", async () => {
    const plan = renderPage(<PlanContent />);
    expect(await axe(plan.container)).toHaveNoViolations();
    plan.unmount();
    const toolkit = renderPage(<ToolkitContent />);
    expect(await axe(toolkit.container)).toHaveNoViolations();
  });
});
