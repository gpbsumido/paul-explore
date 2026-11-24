import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ChatThread, Received, Sent } from "./threads";

describe("ChatThread", () => {
  it("renders its children inside the phone shell", () => {
    const { container } = render(
      <ChatThread>
        <Sent>hello</Sent>
      </ChatThread>,
    );
    const phone = container.querySelector<HTMLElement>('[style*="min-height"]');
    expect(phone?.contains(screen.getByText("hello"))).toBe(true);
  });

  it("sizes the phone to the below-header viewport", () => {
    const { container } = render(<ChatThread>x</ChatThread>);
    const withMinHeight = container.querySelector<HTMLElement>(
      '[style*="min-height"]',
    );
    expect(withMinHeight?.style.minHeight).toBe("calc(100dvh - 56px)");
  });

});

describe("bubble position", () => {
  it.each(["first", "middle", "last", "only"] as const)(
    "styles a sent bubble at the %s position",
    (pos) => {
      render(<Sent pos={pos}>hi</Sent>);
      expect(screen.getByText("hi").className).toMatch(new RegExp(`sent${pos[0].toUpperCase()}${pos.slice(1)}`));
    },
  );

  it.each(["first", "middle", "last", "only"] as const)(
    "styles a received bubble at the %s position",
    (pos) => {
      render(<Received pos={pos}>hi</Received>);
      expect(screen.getByText("hi").className).toMatch(
        new RegExp(`received${pos[0].toUpperCase()}${pos.slice(1)}`),
      );
    },
  );

  it("treats a bubble with no position as a lone one", () => {
    render(
      <>
        <Sent>sent</Sent>
        <Received>received</Received>
      </>,
    );
    expect(screen.getByText("sent").className).toMatch(/sentOnly/);
    expect(screen.getByText("received").className).toMatch(/receivedOnly/);
  });
});
