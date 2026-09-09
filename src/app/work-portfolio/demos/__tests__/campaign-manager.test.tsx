import { describe, it, expect } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";
import CampaignManagerDemo from "../campaign-manager";
import { FEATURES, featureIndexBySlug } from "../../_data/catalog";

const feature = FEATURES[featureIndexBySlug("campaign-manager")!];

const list = () => screen.getByRole("list", { name: "Campaigns" });

describe("campaign manager demo (season board)", () => {
  it("opens with a campaign selected in the inspector", () => {
    render(<CampaignManagerDemo feature={feature} />);
    expect(screen.getByLabelText("Campaign name")).toHaveValue(
      "Launch week push",
    );
  });

  it("editing the name in the inspector updates the list live", () => {
    render(<CampaignManagerDemo feature={feature} />);
    fireEvent.change(screen.getByLabelText("Campaign name"), {
      target: { value: "Renamed push" },
    });
    expect(within(list()).getByText("Renamed push")).toBeInTheDocument();
  });

  it("selecting a list row drives the inspector", () => {
    render(<CampaignManagerDemo feature={feature} />);
    fireEvent.click(within(list()).getByText("Creator spotlight"));
    expect(screen.getByLabelText("Campaign name")).toHaveValue(
      "Creator spotlight",
    );
  });

  it("toggles between the dial and the run of show", () => {
    render(<CampaignManagerDemo feature={feature} />);
    expect(
      screen.getByRole("img", { name: /Radial calendar/i }),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Run of show" }));
    expect(
      screen.getByRole("button", {
        name: /Launch week push, drag to reschedule/,
      }),
    ).toBeInTheDocument();
  });

  it("a goal filter hides that goal's campaigns from the run of show", () => {
    render(<CampaignManagerDemo feature={feature} />);
    fireEvent.click(screen.getByRole("button", { name: "Run of show" }));
    expect(
      screen.getByRole("button", {
        name: /Launch week push, drag to reschedule/,
      }),
    ).toBeInTheDocument();

    // Launch week push is an Awareness campaign; hiding Awareness drops it.
    fireEvent.click(screen.getByRole("button", { name: "Awareness" }));
    expect(
      screen.queryByRole("button", {
        name: /Launch week push, drag to reschedule/,
      }),
    ).toBeNull();
  });

  it("adds a new campaign and selects it", () => {
    render(<CampaignManagerDemo feature={feature} />);
    fireEvent.click(screen.getByRole("button", { name: "New campaign" }));
    expect(screen.getByLabelText("Campaign name")).toHaveValue(
      "Untitled campaign",
    );
    expect(within(list()).getByText("Untitled campaign")).toBeInTheDocument();
  });

  it("duplicates the selected campaign", () => {
    render(<CampaignManagerDemo feature={feature} />);
    fireEvent.click(screen.getByRole("button", { name: "Duplicate" }));
    expect(
      within(list()).getByText("Launch week push (copy)"),
    ).toBeInTheDocument();
  });

  it("deletes the selected campaign and clears the inspector", () => {
    render(<CampaignManagerDemo feature={feature} />);
    fireEvent.click(screen.getByRole("button", { name: "Delete" }));
    expect(screen.getByText("Nothing selected")).toBeInTheDocument();
    expect(within(list()).queryByText("Launch week push")).toBeNull();
  });
});
