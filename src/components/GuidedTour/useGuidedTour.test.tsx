import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { useGuidedTour } from "./useGuidedTour";

const KEY = "test-tour-seen";

function Harness({ autoOpen }: { autoOpen?: boolean }) {
  const { open, start, close } = useGuidedTour(KEY, { autoOpen });
  return (
    <div>
      <span data-testid="open">{String(open)}</span>
      <button onClick={start}>start</button>
      <button onClick={close}>close</button>
    </div>
  );
}

describe("useGuidedTour", () => {
  beforeEach(() => window.localStorage.clear());

  it("auto-opens on a first visit", () => {
    render(<Harness />);
    expect(screen.getByTestId("open")).toHaveTextContent("true");
  });

  it("waits to auto-open until the page says it may, so something else can go first", () => {
    const { rerender } = render(<Harness autoOpen={false} />);
    expect(screen.getByTestId("open")).toHaveTextContent("false");
    rerender(<Harness autoOpen />);
    expect(screen.getByTestId("open")).toHaveTextContent("true");
  });

  it("does not auto-open once seen, but start reopens it", () => {
    window.localStorage.setItem(KEY, "true");
    render(<Harness />);
    expect(screen.getByTestId("open")).toHaveTextContent("false");
    fireEvent.click(screen.getByText("start"));
    expect(screen.getByTestId("open")).toHaveTextContent("true");
  });

  it("close hides it and persists the seen flag", () => {
    render(<Harness />);
    fireEvent.click(screen.getByText("close"));
    expect(screen.getByTestId("open")).toHaveTextContent("false");
    expect(window.localStorage.getItem(KEY)).toBe("true");
  });
});
