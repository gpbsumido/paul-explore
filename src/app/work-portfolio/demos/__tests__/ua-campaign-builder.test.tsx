import { describe, it, expect } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";
import UaCampaignBuilderDemo from "../ua-campaign-builder";
import { FEATURES, featureIndexBySlug } from "../../_data/catalog";

const feature = FEATURES[featureIndexBySlug("ua-campaign-builder")!];

describe("ua campaign builder demo", () => {
  it("updates the live preview as the form changes", () => {
    render(<UaCampaignBuilderDemo feature={feature} />);
    const preview = screen.getByLabelText("Campaign preview");
    fireEvent.change(screen.getByLabelText("Campaign name"), {
      target: { value: "Summer blast" },
    });
    expect(within(preview).getByText("Summer blast")).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Channel"), {
      target: { value: "Influencer" },
    });
    expect(within(preview).getByText(/Influencer campaign/)).toBeInTheDocument();
  });
});
