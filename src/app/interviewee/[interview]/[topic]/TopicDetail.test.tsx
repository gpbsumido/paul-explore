import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "@/test/a11y";
import TopicDetail from "./TopicDetail";
import type { IntervieweeTopic } from "@/lib/interviewee/types";

const push = vi.fn();
vi.mock("next/navigation", () => ({
  usePathname: () => "/interviewee/general/system-design",
  useRouter: () => ({ push }),
}));

vi.mock("@/components/PageHeader", () => ({ default: () => null }));
vi.mock("@/components/PageShell", () => ({
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

const topic: IntervieweeTopic = {
  id: "system-design",
  title: "System Design",
  summary: "How I reason about scale and trade-offs.",
  entries: [
    {
      question: "How would you design a URL shortener?",
      points: ["Hash the id into a short slug", "Cache the hot reads"],
      details: ["The write path is append-only; the read path is a cache lookup."],
    },
    {
      question: "When do you reach for a queue?",
      points: ["When the producer and consumer run at different rates"],
    },
  ],
  related: ["apis", "frontend"],
};

const related: IntervieweeTopic[] = [
  { id: "apis", title: "APIs and Backend", summary: "REST vs GraphQL.", entries: [{ question: "q", points: ["p"] }], related: [] },
  { id: "frontend", title: "Frontend and React", summary: "Rendering.", entries: [{ question: "q", points: ["p"] }], related: [] },
];

beforeEach(() => {
  push.mockReset();
  window.localStorage.clear();
});

describe("TopicDetail", () => {
  it("shows the topic title and each question with its bullet points", () => {
    render(<TopicDetail interviewId="general" topic={topic} related={related} />);
    expect(
      screen.getByRole("heading", { level: 1, name: /System Design/ }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("How would you design a URL shortener?"),
    ).toBeInTheDocument();
    expect(screen.getByText("Hash the id into a short slug")).toBeInTheDocument();
  });

  it("tucks the deeper detail behind an expandable disclosure", () => {
    render(<TopicDetail interviewId="general" topic={topic} related={related} />);
    const detail =
      "The write path is append-only; the read path is a cache lookup.";
    expect(screen.getByText(detail).closest("details")).not.toBeNull();
  });

  it("offers a way back to the interview", () => {
    render(<TopicDetail interviewId="general" topic={topic} related={related} />);
    const back = screen.getByRole("link", { name: /back to interview/i });
    expect(back).toHaveAttribute("href", "/interviewee/general");
  });

  it("returns to the interview when Escape is pressed", async () => {
    const user = userEvent.setup();
    render(<TopicDetail interviewId="general" topic={topic} related={related} />);
    await user.keyboard("{Escape}");
    expect(push).toHaveBeenCalledWith("/interviewee/general");
  });

  it("shows related topics as cards scoped to the same interview", () => {
    render(<TopicDetail interviewId="general" topic={topic} related={related} />);
    expect(
      screen.getByRole("link", { name: /APIs and Backend/ }),
    ).toHaveAttribute("href", "/interviewee/general/apis");
    expect(
      screen.getByRole("link", { name: /Frontend and React/ }),
    ).toHaveAttribute("href", "/interviewee/general/frontend");
  });

  it("jumps to a related topic when its number key is pressed", async () => {
    const user = userEvent.setup();
    render(<TopicDetail interviewId="general" topic={topic} related={related} />);
    await user.keyboard("2");
    expect(push).toHaveBeenCalledWith("/interviewee/general/frontend");
  });

  it("has no accessibility violations", async () => {
    const { container } = render(
      <TopicDetail interviewId="general" topic={topic} related={related} />,
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
