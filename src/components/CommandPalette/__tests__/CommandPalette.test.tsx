import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "@/test/a11y";
import CommandPalette from "../CommandPalette";
import type { Command } from "@/lib/command-palette/types";

const COMMANDS: Command[] = [
  { id: "home", title: "Home", group: "Pages", href: "/", keywords: [] },
  {
    id: "calendar",
    title: "Calendar",
    group: "Pages",
    href: "/calendar",
    keywords: [],
  },
  {
    id: "toggle-theme",
    title: "Toggle theme",
    group: "Actions",
    actionId: "toggle-theme",
    keywords: ["dark"],
  },
  {
    id: "note",
    title: "Testing",
    group: "Dev Notes",
    href: "/thoughts/testing",
    keywords: [],
  },
];

function setup(
  overrides: Partial<React.ComponentProps<typeof CommandPalette>> = {},
) {
  const onClose = vi.fn();
  const onSelect = vi.fn();
  const utils = render(
    <CommandPalette
      open
      onClose={onClose}
      onSelect={onSelect}
      commands={COMMANDS}
      {...overrides}
    />,
  );
  return { onClose, onSelect, user: userEvent.setup(), ...utils };
}

afterEach(cleanup);

describe("CommandPalette", () => {
  it("renders nothing when closed", () => {
    setup({ open: false });
    expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
  });

  it("renders a search combobox and grouped options when open", () => {
    setup();
    expect(screen.getByRole("combobox")).toBeInTheDocument();
    expect(screen.getByRole("group", { name: "Pages" })).toBeInTheDocument();
    expect(screen.getByRole("group", { name: "Actions" })).toBeInTheDocument();
    expect(
      screen.getByRole("group", { name: "Dev Notes" }),
    ).toBeInTheDocument();
    expect(screen.getAllByRole("option")).toHaveLength(COMMANDS.length);
  });

  it("filters options as the user types", async () => {
    const { user } = setup();
    await user.type(screen.getByRole("combobox"), "cal");
    const options = screen.getAllByRole("option");
    expect(options).toHaveLength(1);
    expect(options[0]).toHaveAccessibleName(/Calendar/);
  });

  it("shows an empty state when nothing matches", async () => {
    const { user } = setup();
    await user.type(screen.getByRole("combobox"), "zzzzz");
    expect(screen.queryAllByRole("option")).toHaveLength(0);
    expect(screen.getByText(/no results/i)).toBeInTheDocument();
  });

  it("moves the active descendant with the arrow keys", async () => {
    const { user } = setup();
    const input = screen.getByRole("combobox");
    input.focus();
    const optionsBefore = screen.getAllByRole("option");
    expect(input).toHaveAttribute("aria-activedescendant", optionsBefore[0].id);
    await user.keyboard("{ArrowDown}");
    expect(input).toHaveAttribute("aria-activedescendant", optionsBefore[1].id);
  });

  it("marks the active option as selected", async () => {
    const { user } = setup();
    screen.getByRole("combobox").focus();
    await user.keyboard("{ArrowDown}");
    const active = screen.getAllByRole("option")[1];
    expect(active).toHaveAttribute("aria-selected", "true");
  });

  it("selects the active command on Enter and closes", async () => {
    const { user, onSelect, onClose } = setup();
    const input = screen.getByRole("combobox");
    await user.type(input, "cal");
    await user.keyboard("{Enter}");
    expect(onSelect).toHaveBeenCalledWith(
      expect.objectContaining({ id: "calendar" }),
    );
    expect(onClose).toHaveBeenCalled();
  });

  it("selects a command when its option is clicked", async () => {
    const { user, onSelect } = setup();
    const themeOption = screen.getByRole("option", { name: /Toggle theme/ });
    await user.click(themeOption);
    expect(onSelect).toHaveBeenCalledWith(
      expect.objectContaining({ id: "toggle-theme" }),
    );
  });

  it("closes on Escape", async () => {
    const { user, onClose } = setup();
    screen.getByRole("combobox").focus();
    await user.keyboard("{Escape}");
    expect(onClose).toHaveBeenCalled();
  });

  it("closes when the backdrop is clicked", async () => {
    const { user, onClose } = setup();
    await user.click(screen.getByTestId("command-palette-backdrop"));
    expect(onClose).toHaveBeenCalled();
  });

  it("highlights the matched characters in the title", async () => {
    const { user } = setup();
    await user.type(screen.getByRole("combobox"), "cal");
    const option = screen.getByRole("option", { name: /Calendar/ });
    const marks = within(option).getAllByTestId("cmdk-highlight");
    expect(marks.map((m) => m.textContent).join("")).toBe("Cal");
  });

  it("has no accessibility violations", async () => {
    setup();
    const results = await axe(document.body);
    expect(results).toHaveNoViolations();
  });
});
