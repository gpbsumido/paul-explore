import { describe, it, expect } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
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
    // The DS tooltip shows after a (here zero) delay via setTimeout, so await it.
    expect(await screen.findByRole("tooltip")).toHaveTextContent("Helpful tip");
  });

  it("shows on hover as well", async () => {
    const user = userEvent.setup();
    renderTooltip();
    await user.hover(screen.getByRole("button", { name: "Trigger" }));
    expect(await screen.findByRole("tooltip")).toHaveTextContent("Helpful tip");
  });

  it("waits half a second by default before showing", async () => {
    const user = userEvent.setup();
    render(
      <Tooltip content="Slow tip">
        <button type="button">Trigger</button>
      </Tooltip>,
    );
    await user.tab();
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
    expect(await screen.findByRole("tooltip")).toHaveTextContent("Slow tip");
  });

  it("bounds the label's width only when asked to wrap", async () => {
    const user = userEvent.setup();
    const { unmount } = render(
      <Tooltip content="Short" delay={0}>
        <button type="button">Trigger</button>
      </Tooltip>,
    );
    await user.tab();
    const single = (await screen.findByRole("tooltip")).style.maxWidth;
    unmount();

    render(
      <Tooltip content="Short" delay={0} multiline>
        <button type="button">Trigger</button>
      </Tooltip>,
    );
    await user.tab();
    const wrapped = (await screen.findByRole("tooltip")).style.maxWidth;

    expect(single).toBe("");
    expect(wrapped).toContain("288px");
  });

  it("hides on blur", async () => {
    const user = userEvent.setup();
    renderTooltip();

    await user.tab();
    expect(await screen.findByRole("tooltip")).toBeInTheDocument();

    await user.tab();
    await waitFor(() =>
      expect(screen.queryByRole("tooltip")).not.toBeInTheDocument(),
    );
  });

  it("dismisses on Escape", async () => {
    const user = userEvent.setup();
    renderTooltip();

    await user.tab();
    expect(await screen.findByRole("tooltip")).toBeInTheDocument();

    await user.keyboard("{Escape}");
    await waitFor(() =>
      expect(screen.queryByRole("tooltip")).not.toBeInTheDocument(),
    );
  });

  it("links tooltip content to the trigger via aria-describedby", async () => {
    const user = userEvent.setup();
    renderTooltip();

    await user.tab();
    const trigger = screen.getByRole("button", { name: "Trigger" });
    const tooltip = await screen.findByRole("tooltip");
    expect(trigger.closest("[aria-describedby]")).toHaveAttribute(
      "aria-describedby",
      tooltip.id,
    );
  });
});
