import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
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

const topic = { id: "t1", title: "Topic One", summary: "s", entries: [{ question: "q", points: ["p"] }], related: [] };

const INTERVIEWS: Interview[] = [
  { id: "sardine-2-hiring-manager", title: "Sardine Interview 2: Hiring manager", summary: "Senior frontend deep dive.", topics: [topic] },
  { id: "general", title: "General practice", summary: "Warm-up.", topics: [topic, { ...topic, id: "t2" }] },
];

beforeEach(() => {
  push.mockReset();
  window.localStorage.clear();
});

describe("IntervieweeContent", () => {
  it("shows the deck heading and a card for every interview", () => {
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
    // focus a card so the digit isn't typed into the search box
    screen.getByRole("link", { name: /Sardine/ }).focus();
    await user.keyboard("2");
    expect(push).toHaveBeenCalledWith("/interviewee/general");
  });

  it("shows a reviewed count per interview", () => {
    render(<IntervieweeContent interviews={INTERVIEWS} />);
    expect(screen.getByText("0/2 reviewed")).toBeInTheDocument();
  });

  it("offers the search combobox and the review-sync panel", () => {
    render(<IntervieweeContent interviews={INTERVIEWS} />);
    expect(screen.getByRole("combobox")).toBeInTheDocument();
    expect(
      screen.getByText(/move review progress between devices/i),
    ).toBeInTheDocument();
  });

  it("has no accessibility violations", async () => {
    const { container } = render(<IntervieweeContent interviews={INTERVIEWS} />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
