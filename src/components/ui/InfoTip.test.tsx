import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "@/test/a11y";
import InfoTip from "./InfoTip";

function renderInfoTip() {
  return render(<InfoTip delay={0}>This is helpful context</InfoTip>);
}

describe("InfoTip accessibility", () => {
  it("reports no axe violations", async () => {
    const { container } = renderInfoTip();
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it("trigger has an accessible name", () => {
    renderInfoTip();
    expect(
      screen.getByRole("button", { name: "More information" }),
    ).toBeInTheDocument();
  });

  it("shows tooltip content on keyboard focus", async () => {
    const user = userEvent.setup();
    renderInfoTip();

    await user.tab();
    expect(
      screen.getByRole("button", { name: "More information" }),
    ).toHaveFocus();
    expect(screen.getByRole("tooltip")).toBeInTheDocument();
  });

  it("links tooltip content via aria-describedby", async () => {
    const user = userEvent.setup();
    renderInfoTip();

    await user.tab();
    const trigger = screen.getByRole("button", { name: "More information" });
    const tooltip = screen.getByRole("tooltip");
    expect(trigger).toHaveAttribute("aria-describedby", tooltip.id);
  });

  it("dismisses on Escape", async () => {
    const user = userEvent.setup();
    renderInfoTip();

    await user.tab();
    expect(screen.getByRole("tooltip")).toBeInTheDocument();

    await user.keyboard("{Escape}");
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
  });
});
