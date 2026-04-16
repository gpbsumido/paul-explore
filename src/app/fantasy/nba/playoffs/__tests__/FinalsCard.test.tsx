import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import FinalsCard from "../FinalsCard";
import type { PlayoffTeam, FinalsPick } from "@/types/nba";

const eastChamp: PlayoffTeam = {
  seed: 1,
  teamId: "5",
  abbreviation: "CLE",
  name: "Cleveland Cavaliers",
  conference: "East",
};

const westChamp: PlayoffTeam = {
  seed: 1,
  teamId: "21",
  abbreviation: "OKC",
  name: "Oklahoma City Thunder",
  conference: "West",
};

describe("FinalsCard", () => {
  it("renders both teams with seed and abbreviation", () => {
    render(
      <FinalsCard
        matchupId="NBA_FINALS"
        topTeam={eastChamp}
        bottomTeam={westChamp}
        pick={undefined}
        onPick={vi.fn()}
      />,
    );

    expect(screen.getByText("CLE")).toBeInTheDocument();
    expect(screen.getByText("OKC")).toBeInTheDocument();
  });

  it("calls onPick with clicked team as winner", async () => {
    const onPick = vi.fn();
    const user = userEvent.setup();

    render(
      <FinalsCard
        matchupId="NBA_FINALS"
        topTeam={eastChamp}
        bottomTeam={westChamp}
        pick={undefined}
        onPick={onPick}
      />,
    );

    await user.click(screen.getByRole("button", { name: /OKC/i }));

    expect(onPick).toHaveBeenCalledWith(
      "NBA_FINALS",
      expect.objectContaining({ winner: "OKC" }),
    );
  });

  it("marks the picked team as selected via aria-pressed", () => {
    const pick: FinalsPick = {
      winner: "OKC",
      seriesScore: "4-2",
      lastGameCombinedScore: null,
      mvp: "",
    };

    render(
      <FinalsCard
        matchupId="NBA_FINALS"
        topTeam={eastChamp}
        bottomTeam={westChamp}
        pick={pick}
        onPick={vi.fn()}
      />,
    );

    expect(screen.getByRole("button", { name: /OKC/i })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByRole("button", { name: /CLE/i })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
  });

  it("shows the combined score input and Finals MVP input", () => {
    render(
      <FinalsCard
        matchupId="NBA_FINALS"
        topTeam={eastChamp}
        bottomTeam={westChamp}
        pick={undefined}
        onPick={vi.fn()}
      />,
    );

    expect(
      screen.getByLabelText(/combined score, last game/i),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/finals mvp/i)).toBeInTheDocument();
  });

  it("calls onPick with updated lastGameCombinedScore when combined score changes", async () => {
    const onPick = vi.fn();
    const user = userEvent.setup();
    const pick: FinalsPick = {
      winner: "OKC",
      seriesScore: "4-2",
      lastGameCombinedScore: null,
      mvp: "",
    };

    render(
      <FinalsCard
        matchupId="NBA_FINALS"
        topTeam={eastChamp}
        bottomTeam={westChamp}
        pick={pick}
        onPick={onPick}
      />,
    );

    await user.type(screen.getByLabelText(/combined score, last game/i), "215");

    expect(onPick).toHaveBeenLastCalledWith(
      "NBA_FINALS",
      expect.objectContaining({ lastGameCombinedScore: 215 }),
    );
  });

  it("calls onPick with updated mvp when MVP input changes", async () => {
    const onPick = vi.fn();
    const user = userEvent.setup();
    const pick: FinalsPick = {
      winner: "OKC",
      seriesScore: "4-2",
      lastGameCombinedScore: 200,
      mvp: "",
    };

    render(
      <FinalsCard
        matchupId="NBA_FINALS"
        topTeam={eastChamp}
        bottomTeam={westChamp}
        pick={pick}
        onPick={onPick}
      />,
    );

    await user.type(screen.getByLabelText(/finals mvp/i), "SGA");

    expect(onPick).toHaveBeenLastCalledWith(
      "NBA_FINALS",
      expect.objectContaining({ mvp: "SGA" }),
    );
  });

  it("disables all inputs and prevents picks when both teams are unresolved", async () => {
    const onPick = vi.fn();
    const user = userEvent.setup();

    render(
      <FinalsCard
        matchupId="NBA_FINALS"
        topTeam={eastChamp}
        bottomTeam={westChamp}
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
    expect(screen.getByLabelText(/combined score, last game/i)).toBeDisabled();
    expect(screen.getByLabelText(/finals mvp/i)).toBeDisabled();

    await user.click(buttons[0]);
    expect(onPick).not.toHaveBeenCalled();
  });

  it("calls onPick with updated seriesScore when dropdown changes", async () => {
    const onPick = vi.fn();
    const user = userEvent.setup();
    const pick: FinalsPick = {
      winner: "OKC",
      seriesScore: "4-0",
      lastGameCombinedScore: null,
      mvp: "",
    };

    render(
      <FinalsCard
        matchupId="NBA_FINALS"
        topTeam={eastChamp}
        bottomTeam={westChamp}
        pick={pick}
        onPick={onPick}
      />,
    );

    await user.selectOptions(
      screen.getByRole("combobox", { name: /series score/i }),
      "4-3",
    );

    expect(onPick).toHaveBeenCalledWith(
      "NBA_FINALS",
      expect.objectContaining({ seriesScore: "4-3", winner: "OKC" }),
    );
  });
});
