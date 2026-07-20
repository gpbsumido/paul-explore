import { describe, it, expect } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";
import EmailCampaignsDemo from "../email-campaigns";
import { FEATURES, featureIndexBySlug } from "../../_data/catalog";

const feature = FEATURES[featureIndexBySlug("email-campaigns")!];

describe("email campaigns demo", () => {
  it("adds a block to the email preview", () => {
    render(<EmailCampaignsDemo feature={feature} />);
    const preview = screen.getByLabelText("Email preview");
    const before = within(preview).queryAllByText("Claim reward").length;
    fireEvent.click(screen.getByRole("button", { name: "Button" }));
    expect(within(preview).getAllByText("Claim reward").length).toBe(before + 1);
  });

  it("shows the campaign table with statuses", () => {
    render(<EmailCampaignsDemo feature={feature} />);
    expect(screen.getByText("Season 4 launch")).toBeInTheDocument();
    expect(screen.getByText("Scheduled")).toBeInTheDocument();
  });
});
