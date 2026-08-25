import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { axe } from "@/test/a11y";
import TiltCard from "./TiltCard";

describe("TiltCard", () => {
  it("renders its children untouched", () => {
    render(
      <TiltCard>
        <article aria-label="a card">contents</article>
      </TiltCard>,
    );
    expect(screen.getByRole("article", { name: "a card" })).toHaveTextContent(
      "contents",
    );
  });

  it("adds no role of its own around the content", () => {
    render(
      <TiltCard>
        <article aria-label="a card">contents</article>
      </TiltCard>,
    );
    // The wrapper is decorative; only the child's article role exists.
    expect(screen.getAllByRole("article")).toHaveLength(1);
  });

  it("has no axe violations", async () => {
    const { container } = render(
      <TiltCard>
        <article aria-label="a card">contents</article>
      </TiltCard>,
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
