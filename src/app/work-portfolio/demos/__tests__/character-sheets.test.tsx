import { describe, it, expect } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";
import CharacterSheetsDemo from "../character-sheets";
import { FEATURES, featureIndexBySlug } from "../../_data/catalog";

const feature = FEATURES[featureIndexBySlug("character-sheets")!];

describe("character sheets demo", () => {
  it("raises a stat and updates the total", () => {
    render(<CharacterSheetsDemo feature={feature} />);
    // INT starts at 5, total 24, so raising is allowed
    expect(screen.getByTestId("stat-total")).toHaveTextContent("24 / 30");
    fireEvent.click(screen.getByRole("button", { name: "Raise INT" }));
    expect(screen.getByTestId("stat-total")).toHaveTextContent("25 / 30");
  });

  it("won't exceed the 30-point budget", () => {
    render(<CharacterSheetsDemo feature={feature} />);
    // hammer every stat up; the total must cap at 30, not keep climbing
    for (const s of ["STR", "AGI", "INT", "LCK"]) {
      const raise = screen.getByRole("button", { name: `Raise ${s}` });
      for (let i = 0; i < 10; i++) fireEvent.click(raise);
    }
    expect(screen.getByTestId("stat-total")).toHaveTextContent("30 / 30");
  });

  it("creates a character through the stepped modal", () => {
    render(<CharacterSheetsDemo feature={feature} />);
    fireEvent.click(screen.getByRole("button", { name: "New character" }));

    const dialog = screen.getByRole("dialog", { name: "Create character" });
    fireEvent.change(within(dialog).getByLabelText("Name"), {
      target: { value: "Zephyr" },
    });
    fireEvent.click(within(dialog).getByRole("button", { name: "Next" })); // to Class
    fireEvent.click(within(dialog).getByRole("button", { name: "Next" })); // to Stats
    fireEvent.click(
      within(dialog).getByRole("button", { name: "Create character" }),
    );

    expect(
      within(screen.getByRole("list", { name: "Roster" })).getByText("Zephyr"),
    ).toBeInTheDocument();
  });

  it("blocks advancing past identity without a name", () => {
    render(<CharacterSheetsDemo feature={feature} />);
    fireEvent.click(screen.getByRole("button", { name: "New character" }));
    const dialog = screen.getByRole("dialog", { name: "Create character" });
    expect(within(dialog).getByRole("button", { name: "Next" })).toBeDisabled();
  });
});
