import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import IntervieweeThoughtsContent from "./IntervieweeThoughtsContent";

vi.mock("@/components/PageHeader", () => ({ default: () => null }));

describe("IntervieweeThoughtsContent", () => {
  it("renders the write-up heading", () => {
    render(<IntervieweeThoughtsContent />);
    expect(
      screen.getByRole("heading", { level: 1, name: /Interviewee/ }),
    ).toBeInTheDocument();
  });

  it("links to the hub and to the feature it documents", () => {
    render(<IntervieweeThoughtsContent />);
    const links = screen.getAllByRole("link").map((a) => a.getAttribute("href"));
    expect(links).toContain("/");
    expect(links).toContain("/interviewee");
  });
});
