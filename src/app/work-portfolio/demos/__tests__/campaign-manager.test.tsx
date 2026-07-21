import { describe, it, expect } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";
import CampaignManagerDemo from "../campaign-manager";
import { FEATURES, featureIndexBySlug } from "../../_data/catalog";

const feature = FEATURES[featureIndexBySlug("campaign-manager")!];

describe("campaign manager demo", () => {
  it("creates a campaign through the stepped modal", () => {
    render(<CampaignManagerDemo feature={feature} />);
    fireEvent.click(screen.getByRole("button", { name: "New campaign" }));

    fireEvent.change(screen.getByLabelText("Campaign name"), {
      target: { value: "Holiday event" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Next" }));

    fireEvent.change(screen.getByLabelText("Send date"), {
      target: { value: "2026-12-20" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Next" }));

    fireEvent.click(screen.getByRole("button", { name: "Create campaign" }));
    // the new campaign lands in the list (scoped past the closing modal's
    // review copy, which lingers during its exit animation)
    expect(
      within(screen.getByRole("list")).getByText("Holiday event"),
    ).toBeInTheDocument();
  });

  it("blocks advancing past basics until a name is entered", () => {
    render(<CampaignManagerDemo feature={feature} />);
    fireEvent.click(screen.getByRole("button", { name: "New campaign" }));
    expect(screen.getByRole("button", { name: "Next" })).toBeDisabled();
  });

  it("toggles a campaign's status", () => {
    render(<CampaignManagerDemo feature={feature} />);
    const toggle = screen.getByRole("button", {
      name: "Toggle Creator spotlight",
    });
    expect(toggle).toHaveTextContent("Draft");
    fireEvent.click(toggle);
    expect(toggle).toHaveTextContent("Live");
  });
});
