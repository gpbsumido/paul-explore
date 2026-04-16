import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import SeriesPickCard from "../SeriesPickCard";
import type { PlayoffTeam, PlayoffSeriesPick } from "@/types/nba";

const topTeam: PlayoffTeam = {
  seed: 1,
  teamId: "5",
  abbreviation: "CLE",
  name: "Cleveland Cavaliers",
  conference: "East",
};

const bottomTeam: PlayoffTeam = {
  seed: 8,
  teamId: "14",
  abbreviation: "MIA",
  name: "Miami Heat",
  conference: "East",
};

describe("SeriesPickCard", () => {
  it("renders both teams with seed and abbreviation", () => {
    render(
      <SeriesPickCard
        matchupId="E_R1_M1"
        topTeam={topTeam}
        bottomTeam={bottomTeam}
        pick={undefined}
        onPick={vi.fn()}
      />,
    );

    expect(screen.getByText("1")).toBeInTheDocument();
    expect(screen.getByText("CLE")).toBeInTheDocument();
    expect(screen.getByText("8")).toBeInTheDocument();
    expect(screen.getByText("MIA")).toBeInTheDocument();
  });

  it("renders '?' for TBD teams", () => {
    const tbdTeam: PlayoffTeam = {
      seed: 0,
      teamId: "",
      abbreviation: "?",
      name: "TBD",
      conference: "East",
    };

    render(
      <SeriesPickCard
        matchupId="E_R2_M1"
        topTeam={tbdTeam}
        bottomTeam={tbdTeam}
        pick={undefined}
        onPick={vi.fn()}
      />,
    );

    const questionMarks = screen.getAllByText("?");
    expect(questionMarks.length).toBeGreaterThanOrEqual(2);
  });

  it("allows picking a TBD team (play-in slot is selectable before it resolves)", async () => {
    const onPick = vi.fn();
    const user = userEvent.setup();

    const tbdTeam: PlayoffTeam = {
      seed: 0,
      teamId: "",
      abbreviation: "?",
      name: "TBD",
      conference: "East",
    };

    render(
      <SeriesPickCard
        matchupId="E_R1_M1"
        topTeam={topTeam}
        bottomTeam={tbdTeam}
        pick={undefined}
        onPick={onPick}
      />,
    );

    const [, tbdButton] = screen.getAllByRole("button");
    expect(tbdButton).not.toBeDisabled();

    await user.click(tbdButton);

    expect(onPick).toHaveBeenCalledWith(
      "E_R1_M1",
      expect.objectContaining({ winner: "?" }),
    );
  });

  it("calls onPick with clicked team abbreviation as winner", async () => {
    const onPick = vi.fn();
    const user = userEvent.setup();

    render(
      <SeriesPickCard
        matchupId="E_R1_M1"
        topTeam={topTeam}
        bottomTeam={bottomTeam}
        pick={undefined}
        onPick={onPick}
      />,
    );

    await user.click(screen.getByRole("button", { name: /CLE/i }));

    expect(onPick).toHaveBeenCalledWith(
      "E_R1_M1",
      expect.objectContaining({ winner: "CLE" }),
    );
  });

  it("marks the picked team as selected via aria-pressed", () => {
    const pick: PlayoffSeriesPick = { winner: "CLE", seriesScore: "4-2" };

    render(
      <SeriesPickCard
        matchupId="E_R1_M1"
        topTeam={topTeam}
        bottomTeam={bottomTeam}
        pick={pick}
        onPick={vi.fn()}
      />,
    );

    expect(screen.getByRole("button", { name: /CLE/i })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByRole("button", { name: /MIA/i })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
  });

  it("calls onPick with updated seriesScore when dropdown changes", async () => {
    const onPick = vi.fn();
    const user = userEvent.setup();
    const pick: PlayoffSeriesPick = { winner: "CLE", seriesScore: "4-0" };

    render(
      <SeriesPickCard
        matchupId="E_R1_M1"
        topTeam={topTeam}
        bottomTeam={bottomTeam}
        pick={pick}
        onPick={onPick}
      />,
    );

    await user.selectOptions(
      screen.getByRole("combobox", { name: /series score/i }),
      "4-2",
    );

    expect(onPick).toHaveBeenCalledWith(
      "E_R1_M1",
      expect.objectContaining({ winner: "CLE", seriesScore: "4-2" }),
    );
  });

  it("disables all inputs and prevents picks when both teams are unresolved", async () => {
    const onPick = vi.fn();
    const user = userEvent.setup();

    render(
      <SeriesPickCard
        matchupId="E_R2_M1"
        topTeam={topTeam}
        bottomTeam={bottomTeam}
        pick={undefined}
        onPick={onPick}
        disabled
      />,
    );

    const buttons = screen.getAllByRole("button");
    for (const btn of buttons) {
      expect(btn).toBeDisabled();
    }
    expect(
      screen.getByRole("combobox", { name: /series score/i }),
    ).toBeDisabled();

    await user.click(buttons[0]);
    expect(onPick).not.toHaveBeenCalled();
  });

  it("preserves the existing winner when only the series score changes", async () => {
    const onPick = vi.fn();
    const user = userEvent.setup();
    const pick: PlayoffSeriesPick = { winner: "MIA", seriesScore: "4-1" };

    render(
      <SeriesPickCard
        matchupId="E_R1_M1"
        topTeam={topTeam}
        bottomTeam={bottomTeam}
        pick={pick}
        onPick={onPick}
      />,
    );

    await user.selectOptions(
      screen.getByRole("combobox", { name: /series score/i }),
      "4-3",
    );

    expect(onPick).toHaveBeenCalledWith(
      "E_R1_M1",
      expect.objectContaining({ winner: "MIA", seriesScore: "4-3" }),
    );
  });
});
