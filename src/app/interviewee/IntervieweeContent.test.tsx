import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "@/test/a11y";
import IntervieweeContent from "./IntervieweeContent";
import type { IntervieweeTopic } from "@/lib/interviewee/types";

const push = vi.fn();
vi.mock("next/navigation", () => ({
  usePathname: () => "/interviewee",
  useRouter: () => ({ push }),
}));

// The shell chrome pulls in the session menu and the animated backdrop, neither
// of which this component owns. Stub them so the test scans the deck itself.
vi.mock("@/components/PageHeader", () => ({ default: () => null }));
vi.mock("@/components/PageShell", () => ({
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

const topic = (over: Partial<IntervieweeTopic> = {}): IntervieweeTopic => ({
  id: "system-design",
  title: "System Design",
  summary: "How I reason about scale, storage, and trade-offs.",
  entries: [{ question: "Design a URL shortener", points: ["Hash the id"] }],
  related: [],
  ...over,
});

const TOPICS: IntervieweeTopic[] = [
  topic({ id: "system-design", title: "System Design" }),
  topic({ id: "apis", title: "APIs and Backend" }),
  topic({ id: "frontend", title: "Frontend and React" }),
];

beforeEach(() => {
  push.mockReset();
  window.localStorage.clear();
});

describe("IntervieweeContent", () => {
  it("shows the deck heading and a card for every topic", () => {
    render(<IntervieweeContent topics={TOPICS} />);
    expect(
      screen.getByRole("heading", { level: 1, name: /interviewee/i }),
    ).toBeInTheDocument();
    for (const t of TOPICS) {
      expect(screen.getByRole("link", { name: new RegExp(t.title) })).toHaveAttribute(
        "href",
        `/interviewee/${t.id}`,
      );
    }
  });

  it("jumps to the nth topic when its number key is pressed", async () => {
    const user = userEvent.setup();
    render(<IntervieweeContent topics={TOPICS} />);
    await user.keyboard("2");
    expect(push).toHaveBeenCalledWith("/interviewee/apis");
  });

  it("moves focus across cards with the arrow keys", async () => {
    const user = userEvent.setup();
    render(<IntervieweeContent topics={TOPICS} />);
    const first = screen.getByRole("link", { name: /System Design/ });
    first.focus();
    await user.keyboard("{ArrowRight}");
    expect(screen.getByRole("link", { name: /APIs and Backend/ })).toHaveFocus();
  });

  it("demotes a topic to the answered list but keeps it reachable, and can bring it back", async () => {
    const user = userEvent.setup();
    render(<IntervieweeContent topics={TOPICS} />);

    const review = screen.getByRole("region", { name: /to review/i });
    expect(
      within(review).getByRole("link", { name: /System Design/ }),
    ).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: /mark system design answered/i }),
    );

    const answered = screen.getByRole("region", { name: /answered/i });
    expect(
      within(answered).getByRole("link", { name: /System Design/ }),
    ).toBeInTheDocument();
    expect(
      within(review).queryByRole("link", { name: /System Design/ }),
    ).not.toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: /bring system design back/i }),
    );
    expect(
      within(screen.getByRole("region", { name: /to review/i })).getByRole("link", {
        name: /System Design/,
      }),
    ).toBeInTheDocument();
  });

  it("has no accessibility violations", async () => {
    const { container } = render(<IntervieweeContent topics={TOPICS} />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
