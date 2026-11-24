import { describe, it, expect, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { ThemeProvider, useTheme } from "./ThemeProvider";
import { THEME_STORAGE_KEY } from "@/lib/themePreference";

function ShowPreference() {
  const { preference } = useTheme();
  return <p>{preference}</p>;
}

function renderWithStored(value: string) {
  localStorage.setItem(THEME_STORAGE_KEY, value);
  render(
    <ThemeProvider>
      <ShowPreference />
    </ThemeProvider>,
  );
}

describe("ThemeProvider's stored preference", () => {
  afterEach(() => localStorage.clear());

  it("reads a saved choice", () => {
    renderWithStored("dark");
    expect(screen.getByText("dark")).toBeInTheDocument();
  });

  it("falls back to system when the saved value isn't a theme", () => {
    renderWithStored("blue");
    expect(screen.getByText("system")).toBeInTheDocument();
  });
});
