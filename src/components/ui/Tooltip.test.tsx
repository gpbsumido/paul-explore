import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "@/test/a11y";
import Tooltip from "./Tooltip";

function renderTooltip() {
  return render(
    <Tooltip content="Helpful tip" delay={0}>
      <button type="button">Trigger</button>
    </Tooltip>,
  );
}

describe("Tooltip accessibility", () => {
  it("reports no axe violations", async () => {
    const { container } = renderTooltip();
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it("shows on keyboard focus", async () => {
    const user = userEvent.setup();
    renderTooltip();

    await user.tab();
    expect(screen.getByRole("button", { name: "Trigger" })).toHaveFocus();
    expect(screen.getByRole("tooltip")).toBeInTheDocument();
  });

  it("hides on blur", async () => {
    const user = userEvent.setup();
    renderTooltip();

    await user.tab();
    expect(screen.getByRole("tooltip")).toBeInTheDocument();

    await user.tab();
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
  });

  it("dismisses on Escape", async () => {
    const user = userEvent.setup();
    renderTooltip();

    await user.tab();
    expect(screen.getByRole("tooltip")).toBeInTheDocument();

    await user.keyboard("{Escape}");
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
  });

  it("links tooltip content to the trigger via aria-describedby", async () => {
    const user = userEvent.setup();
    renderTooltip();

    await user.tab();
    const trigger = screen.getByRole("button", { name: "Trigger" });
    const tooltip = screen.getByRole("tooltip");
    expect(trigger.closest("[aria-describedby]")).toHaveAttribute(
      "aria-describedby",
      tooltip.id,
    );
  });
});
