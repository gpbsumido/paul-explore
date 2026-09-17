import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "@/test/a11y";
import InterviewContent from "./InterviewContent";
import type { Interview } from "@/lib/interviewee/types";

const push = vi.fn();
vi.mock("next/navigation", () => ({
  usePathname: () => "/interviewee/general",
  useRouter: () => ({ push }),
}));

vi.mock("@/components/PageHeader", () => ({ default: () => null }));
vi.mock("@/components/PageShell", () => ({
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

const topic = (id: string, title: string) => ({
  id,
  title,
  summary: `${title} summary`,
  entries: [{ question: "q", points: ["p"] }],
  related: [],
});

const interview: Interview = {
  id: "general",
  title: "General practice",
  summary: "Warm-up.",
  topics: [topic("system-design", "System Design"), topic("apis", "APIs"), topic("testing", "Testing")],
};

beforeEach(() => {
  push.mockReset();
  window.localStorage.clear();
});

describe("InterviewContent", () => {
  it("shows the interview heading and a card for every topic, scoped to the interview", () => {
    render(<InterviewContent interview={interview} />);
    expect(
      screen.getByRole("heading", { level: 1, name: /General practice/ }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /System Design/ }),
    ).toHaveAttribute("href", "/interviewee/general/system-design");
  });

  it("offers a way back to the interviews deck", () => {
    render(<InterviewContent interview={interview} />);
    expect(
      screen.getByRole("link", { name: /all interviews/i }),
    ).toHaveAttribute("href", "/interviewee");
  });

  it("opens the nth topic when its number key is pressed", async () => {
    const user = userEvent.setup();
    render(<InterviewContent interview={interview} />);
    await user.keyboard("2");
    expect(push).toHaveBeenCalledWith("/interviewee/general/apis");
  });

  it("demotes a reviewed topic but keeps it reachable, and can bring it back", async () => {
    const user = userEvent.setup();
    render(<InterviewContent interview={interview} />);

    const review = screen.getByRole("region", { name: /to review/i });
    expect(
      within(review).getByRole("link", { name: /System Design/ }),
    ).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: /mark system design reviewed/i }),
    );

    const reviewed = screen.getByRole("region", { name: /reviewed/i });
    expect(
      within(reviewed).getByRole("link", { name: /System Design/ }),
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

  it("flags a stale reviewed topic as due to revisit", () => {
    // reviewed at epoch 1000 — years ago, so well past the revisit threshold.
    window.localStorage.setItem(
      "interviewee-answered",
      JSON.stringify({ reviewed: { "general/system-design": 1000 } }),
    );
    render(<InterviewContent interview={interview} />);

    const reviewed = screen.getByRole("region", { name: /reviewed/i });
    expect(within(reviewed).getByText("1 due to revisit")).toBeInTheDocument();
    expect(
      within(reviewed).getByText(/due to revisit — System Design/i),
    ).toBeInTheDocument();
  });

  it("has no accessibility violations", async () => {
    const { container } = render(<InterviewContent interview={interview} />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
