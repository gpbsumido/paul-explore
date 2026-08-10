import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "vitest-axe";
import { describe, it, expect } from "vitest";
import WorldHudSheet from "../WorldHudSheet";

// The sheet is the phone-sized home for the HUD rail: on a wide screen the rail
// is always on show, on a phone it hides behind one toggle so it stops landing
// on top of the placard. Only the open/closed contract is testable here — the
// geometry itself is CSS and gets checked in the browser.

const renderSheet = (
  props: Partial<Parameters<typeof WorldHudSheet>[0]> = {},
) =>
  render(
    <WorldHudSheet
      summary="🪙 3/25 · 12%"
      menu={<button type="button">Site menu</button>}
      {...props}
    >
      <p>rail contents</p>
    </WorldHudSheet>,
  );

describe("WorldHudSheet", () => {
  it("keeps the menu and the rail in the page whether or not the sheet is open", () => {
    renderSheet();

    expect(
      screen.getByRole("button", { name: "Site menu" }),
    ).toBeInTheDocument();
    expect(screen.getByText("rail contents")).toBeInTheDocument();
  });

  it("starts collapsed and points its toggle at the panel it controls", () => {
    renderSheet();

    const toggle = screen.getByRole("button", { name: /world settings/i });
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    const panel = document.getElementById(
      toggle.getAttribute("aria-controls") ?? "",
    );
    expect(panel).not.toBeNull();
    expect(
      within(panel as HTMLElement).getByText("rail contents"),
    ).toBeInTheDocument();
  });

  it("shows the collected-token summary on the toggle so it stays glanceable", () => {
    renderSheet();

    expect(
      screen.getByRole("button", { name: /world settings/i }),
    ).toHaveTextContent("🪙 3/25 · 12%");
  });

  it("expands when the toggle is pressed", async () => {
    const user = userEvent.setup();
    renderSheet();

    await user.click(screen.getByRole("button", { name: /world settings/i }));

    expect(
      screen.getByRole("button", { name: /close world settings/i }),
    ).toHaveAttribute("aria-expanded", "true");
  });

  it("collapses again on a second press", async () => {
    const user = userEvent.setup();
    renderSheet();

    await user.click(screen.getByRole("button", { name: /world settings/i }));
    await user.click(
      screen.getByRole("button", { name: /close world settings/i }),
    );

    expect(
      screen.getByRole("button", { name: /world settings/i }),
    ).toHaveAttribute("aria-expanded", "false");
  });

  it("closes on Escape and hands focus back to the toggle", async () => {
    const user = userEvent.setup();
    renderSheet();

    await user.click(screen.getByRole("button", { name: /world settings/i }));
    await user.keyboard("{Escape}");

    const toggle = screen.getByRole("button", { name: /world settings/i });
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    expect(toggle).toHaveFocus();
  });

  it("closes when the backdrop behind it is tapped", async () => {
    const user = userEvent.setup();
    renderSheet();

    await user.click(screen.getByRole("button", { name: /world settings/i }));
    await user.click(screen.getByTestId("world-hud-backdrop"));

    expect(
      screen.getByRole("button", { name: /world settings/i }),
    ).toHaveAttribute("aria-expanded", "false");
  });

  it("offers no toggle at all in photo mode", () => {
    renderSheet({ hidden: true });

    expect(
      screen.queryByRole("button", { name: /world settings/i }),
    ).not.toBeInTheDocument();
  });

  it("has no axe violations open or closed", async () => {
    const user = userEvent.setup();
    const { container } = renderSheet();

    expect(await axe(container)).toHaveNoViolations();
    await user.click(screen.getByRole("button", { name: /world settings/i }));
    expect(await axe(container)).toHaveNoViolations();
  });
});
