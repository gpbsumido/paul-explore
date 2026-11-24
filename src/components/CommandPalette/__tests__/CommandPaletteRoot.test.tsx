import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup, act, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const { push, setPreference, pathname, activeTheme } = vi.hoisted(() => ({
  push: vi.fn(),
  setPreference: vi.fn(),
  pathname: { current: "/thoughts" },
  activeTheme: { current: "light" },
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
  usePathname: () => pathname.current,
}));

vi.mock("@/components/ThemeProvider", () => ({
  useTheme: () => ({ theme: activeTheme.current, preference: "system", setPreference }),
}));

import CommandPaletteRoot from "../CommandPaletteRoot";
import { openCommandPalette } from "@/lib/command-palette/open-event";

beforeEach(() => {
  push.mockClear();
  setPreference.mockClear();
  pathname.current = "/thoughts";
  activeTheme.current = "light";
});

afterEach(cleanup);

async function openPalette(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole("button", { name: /command palette/i }));
}

describe("CommandPaletteRoot", () => {
  it("keeps the palette closed until the trigger is used", () => {
    render(<CommandPaletteRoot />);
    expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
  });

  it("opens the palette from the trigger pill", async () => {
    const user = userEvent.setup();
    render(<CommandPaletteRoot />);
    await openPalette(user);
    expect(screen.getByRole("combobox")).toBeInTheDocument();
  });

  it("hides the floating trigger on the graph landing, which supplies its own", () => {
    pathname.current = "/";
    render(<CommandPaletteRoot />);
    expect(
      screen.queryByRole("button", { name: /command palette/i }),
    ).not.toBeInTheDocument();
  });

  it.each(["/discover", "/world"])(
    "hides the floating trigger on %s, which has its own search",
    (path) => {
      pathname.current = path;
      render(<CommandPaletteRoot />);
      expect(
        screen.queryByRole("button", { name: /command palette/i }),
      ).not.toBeInTheDocument();
    },
  );

  it("opens from the keyboard shortcut, trigger or not", () => {
    pathname.current = "/";
    render(<CommandPaletteRoot />);
    expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
    fireEvent.keyDown(window, { key: "k", metaKey: true });
    expect(screen.getByRole("combobox")).toBeInTheDocument();
  });

  it("still opens on the landing when asked via the open event", () => {
    pathname.current = "/";
    render(<CommandPaletteRoot />);
    expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
    act(() => {
      openCommandPalette();
    });
    expect(screen.getByRole("combobox")).toBeInTheDocument();
  });

  it("navigates to a selected page command", async () => {
    const user = userEvent.setup();
    render(<CommandPaletteRoot />);
    await openPalette(user);
    await user.type(screen.getByRole("combobox"), "calendar");
    await user.keyboard("{Enter}");
    expect(push).toHaveBeenCalledWith("/calendar");
  });

  it("toggles the theme when the theme action is selected", async () => {
    const user = userEvent.setup();
    render(<CommandPaletteRoot />);
    await openPalette(user);
    await user.type(screen.getByRole("combobox"), "toggle theme");
    await user.keyboard("{Enter}");
    // Current theme is light, so it should switch to dark.
    expect(setPreference).toHaveBeenCalledWith("dark");
    expect(push).not.toHaveBeenCalled();
  });

  it("switches back to light when the theme is already dark", async () => {
    activeTheme.current = "dark";
    const user = userEvent.setup();
    render(<CommandPaletteRoot />);
    await openPalette(user);
    await user.type(screen.getByRole("combobox"), "toggle theme");
    await user.keyboard("{Enter}");
    expect(setPreference).toHaveBeenCalledWith("light");
  });

  it("opens external links in a new tab instead of routing", async () => {
    const user = userEvent.setup();
    const openSpy = vi.spyOn(window, "open").mockImplementation(() => null);
    render(<CommandPaletteRoot />);
    await openPalette(user);
    await user.type(screen.getByRole("combobox"), "ketsup");
    await user.keyboard("{Enter}");
    expect(openSpy).toHaveBeenCalledWith(
      expect.stringContaining("http"),
      "_blank",
      expect.stringContaining("noopener"),
    );
    expect(push).not.toHaveBeenCalled();
    openSpy.mockRestore();
  });

  it("closes the palette after a selection", async () => {
    const user = userEvent.setup();
    render(<CommandPaletteRoot />);
    await openPalette(user);
    await user.type(screen.getByRole("combobox"), "calendar");
    await user.keyboard("{Enter}");
    expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
  });
});
