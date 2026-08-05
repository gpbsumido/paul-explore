import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ChatThread, Sent } from "./threads";

describe("ChatThread", () => {
  it("renders its children inside the centered phone shell", () => {
    const { container } = render(
      <ChatThread>
        <Sent>hello</Sent>
      </ChatThread>,
    );
    const shell = container.querySelector(".flex.justify-center");
    expect(shell).not.toBeNull();
    expect(screen.getByText("hello")).toBeInTheDocument();
    expect(shell?.contains(screen.getByText("hello"))).toBe(true);
  });

  it("defaults the phone min-height to the below-header viewport", () => {
    const { container } = render(<ChatThread>x</ChatThread>);
    const withMinHeight = container.querySelector<HTMLElement>(
      '[style*="min-height"]',
    );
    expect(withMinHeight?.style.minHeight).toBe("calc(100dvh - 56px)");
  });

  it("lets a caller override the min-height", () => {
    const { container } = render(
      <ChatThread minHeight="400px">x</ChatThread>,
    );
    const withMinHeight = container.querySelector<HTMLElement>(
      '[style*="min-height"]',
    );
    expect(withMinHeight?.style.minHeight).toBe("400px");
  });
});
