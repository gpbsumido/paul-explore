import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "@/test/a11y";
import MagneticButton from "./MagneticButton";

describe("MagneticButton", () => {
  it("passes clicks through to the wrapped control", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(
      <MagneticButton>
        <button onClick={onClick}>Spin</button>
      </MagneticButton>,
    );

    await user.click(screen.getByRole("button", { name: "Spin" }));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it("keeps the wrapped control reachable from the keyboard", async () => {
    const user = userEvent.setup();
    render(
      <MagneticButton>
        <button>Spin</button>
      </MagneticButton>,
    );

    await user.tab();
    expect(screen.getByRole("button", { name: "Spin" })).toHaveFocus();
  });

  it("adds no role of its own around the control", () => {
    render(
      <MagneticButton>
        <button>Spin</button>
      </MagneticButton>,
    );
    expect(screen.getAllByRole("button")).toHaveLength(1);
  });

  it("has no axe violations", async () => {
    const { container } = render(
      <MagneticButton>
        <button>Spin</button>
      </MagneticButton>,
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
