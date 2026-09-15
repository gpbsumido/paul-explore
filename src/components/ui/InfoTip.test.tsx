import { describe, it, expect } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
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
    // The DS trigger is a focusable role="img" glyph (it reveals info, it does
    // not perform an action), with the same "More information" accessible name.
    expect(
      screen.getByRole("img", { name: "More information" }),
    ).toBeInTheDocument();
  });

  it("shows tooltip content on keyboard focus", async () => {
    const user = userEvent.setup();
    renderInfoTip();

    await user.tab();
    expect(screen.getByRole("img", { name: "More information" })).toHaveFocus();
    expect(await screen.findByRole("tooltip")).toBeInTheDocument();
  });

  it("links tooltip content via aria-describedby", async () => {
    const user = userEvent.setup();
    renderInfoTip();

    await user.tab();
    const trigger = screen.getByRole("img", { name: "More information" });
    const tooltip = await screen.findByRole("tooltip");
    expect(trigger.closest("[aria-describedby]")).toHaveAttribute(
      "aria-describedby",
      tooltip.id,
    );
  });

  it("dismisses on Escape", async () => {
    const user = userEvent.setup();
    renderInfoTip();

    await user.tab();
    expect(await screen.findByRole("tooltip")).toBeInTheDocument();

    await user.keyboard("{Escape}");
    await waitFor(() =>
      expect(screen.queryByRole("tooltip")).not.toBeInTheDocument(),
    );
  });
});
