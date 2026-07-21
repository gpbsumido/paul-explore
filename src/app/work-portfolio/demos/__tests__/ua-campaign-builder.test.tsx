import { describe, it, expect } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";
import UaCampaignBuilderDemo from "../ua-campaign-builder";
import { FEATURES, featureIndexBySlug } from "../../_data/catalog";

const feature = FEATURES[featureIndexBySlug("ua-campaign-builder")!];

describe("ua campaign builder demo", () => {
  it("keeps the live preview in sync and persisting across steps", () => {
    render(<UaCampaignBuilderDemo feature={feature} />);
    const preview = screen.getByLabelText("Campaign preview");

    fireEvent.change(screen.getByLabelText("Campaign name"), {
      target: { value: "Summer blast" },
    });
    expect(within(preview).getByText("Summer blast")).toBeInTheDocument();

    // move to the targeting step; the preview persists with the entered name
    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    expect(within(preview).getByText("Summer blast")).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Channel"), {
      target: { value: "Influencer" },
    });
    expect(within(preview).getByText(/Influencer campaign/)).toBeInTheDocument();
  });

  it("gates advancing past basics until the campaign has a name", () => {
    render(<UaCampaignBuilderDemo feature={feature} />);
    fireEvent.change(screen.getByLabelText("Campaign name"), {
      target: { value: "" },
    });
    expect(screen.getByRole("button", { name: "Next" })).toBeDisabled();

    fireEvent.change(screen.getByLabelText("Campaign name"), {
      target: { value: "Q3 push" },
    });
    expect(screen.getByRole("button", { name: "Next" })).toBeEnabled();
  });

  it("reaches a review step showing the entered values", () => {
    render(<UaCampaignBuilderDemo feature={feature} />);
    fireEvent.change(screen.getByLabelText("Campaign name"), {
      target: { value: "Q3 push" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    fireEvent.click(screen.getByRole("button", { name: "Next" }));

    const review = screen.getByLabelText("Campaign review");
    expect(within(review).getByText("Q3 push")).toBeInTheDocument();
  });
});
