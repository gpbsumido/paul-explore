import { describe, it, expect, vi, afterEach } from "vitest";
import {
  render,
  screen,
  cleanup,
  within,
  waitFor,
} from "@testing-library/react";
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

  it("selects a command when its option is clicked, then closes", async () => {
    const { user, onSelect, onClose } = setup();
    const themeOption = screen.getByRole("option", { name: /Toggle theme/ });
    await user.click(themeOption);
    expect(onSelect).toHaveBeenCalledWith(
      expect.objectContaining({ id: "toggle-theme" }),
    );
    expect(onClose).toHaveBeenCalled();
  });

  it("wraps from the first option to the last on ArrowUp", async () => {
    const { user } = setup();
    const input = screen.getByRole("combobox");
    input.focus();
    await user.keyboard("{ArrowUp}");
    const options = screen.getAllByRole("option");
    expect(input).toHaveAttribute(
      "aria-activedescendant",
      options[options.length - 1].id,
    );
  });

  it("makes an option active when the pointer moves over it", async () => {
    const { user } = setup();
    const target = screen.getByRole("option", { name: /Toggle theme/ });
    await user.hover(target);
    expect(target).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("option", { name: /Home/ })).toHaveAttribute(
      "aria-selected",
      "false",
    );
  });

  it("does nothing on Enter when no command matches", async () => {
    const { user, onSelect, onClose } = setup();
    await user.type(screen.getByRole("combobox"), "zzzzz");
    await user.keyboard("{Enter}");
    expect(onSelect).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
  });

  it("stays open when the click lands inside the panel rather than on the backdrop", async () => {
    const { user, onClose } = setup();
    await user.click(screen.getByRole("combobox"));
    expect(onClose).not.toHaveBeenCalled();
  });

  it("starts from a clean query each time it is reopened", async () => {
    const { user, rerender, onClose, onSelect } = setup();
    await user.type(screen.getByRole("combobox"), "cal");
    const palette = (open: boolean) => (
      <CommandPalette
        open={open}
        onClose={onClose}
        onSelect={onSelect}
        commands={COMMANDS}
      />
    );
    rerender(palette(false));
    await waitFor(() =>
      expect(screen.queryByRole("combobox")).not.toBeInTheDocument(),
    );
    rerender(palette(true));
    expect(screen.getByRole("combobox")).toHaveValue("");
    expect(screen.getAllByRole("option")).toHaveLength(COMMANDS.length);
  });

  it("locks page scroll while open and gives it back on close", async () => {
    document.body.style.overflow = "auto";
    const { rerender, onClose, onSelect } = setup();
    expect(document.body.style.overflow).toBe("hidden");
    rerender(
      <CommandPalette
        open={false}
        onClose={onClose}
        onSelect={onSelect}
        commands={COMMANDS}
      />,
    );
    expect(document.body.style.overflow).toBe("auto");
    document.body.style.overflow = "";
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

  it("keeps the unmatched text around a mid-title match", async () => {
    const { user } = setup();
    await user.type(screen.getByRole("combobox"), "lend");
    const option = screen.getByRole("option", { name: /Calendar/ });
    expect(option).toHaveTextContent("Calendar");
    expect(
      within(option)
        .getAllByTestId("cmdk-highlight")
        .map((m) => m.textContent)
        .join(""),
    ).toBe("lend");
  });

  it("has no accessibility violations", async () => {
    setup();
    const results = await axe(document.body);
    expect(results).toHaveNoViolations();
  });
});
