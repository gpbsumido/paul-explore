import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import ClickSpark from "./ClickSpark";

describe("ClickSpark", () => {
  it("renders its children and leaves their click working", () => {
    const onClick = vi.fn();
    render(
      <ClickSpark>
        <button type="button" onClick={onClick}>
          Nets +150
        </button>
      </ClickSpark>,
    );
    fireEvent.click(screen.getByRole("button", { name: /Nets/ }));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it("bursts sparks from the pointer on press", () => {
    const { container } = render(
      <ClickSpark count={6}>
        <button type="button">pick</button>
      </ClickSpark>,
    );
    expect(container.querySelectorAll(".motion-spark")).toHaveLength(0);
    fireEvent.pointerDown(screen.getByRole("button"), { clientX: 8, clientY: 8 });
    const burst = container.querySelector(".motion-spark");
    expect(burst).not.toBeNull();
    expect(burst?.querySelectorAll(".motion-spark__ray")).toHaveLength(6);
  });
});
