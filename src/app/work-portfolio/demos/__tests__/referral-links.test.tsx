import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import ReferralLinksDemo from "../referral-links";
import { FEATURES, featureIndexBySlug } from "../../_data/catalog";

const feature = FEATURES[featureIndexBySlug("referral-links")!];

describe("referral links demo", () => {
  it("mints a link from the handle", () => {
    render(<ReferralLinksDemo feature={feature} />);
    expect(screen.getByText(/play\.example\.gg\/r\/nova/)).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Your handle"), {
      target: { value: "blaze" },
    });
    expect(screen.getByText(/play\.example\.gg\/r\/blaze/)).toBeInTheDocument();
  });

  it("shows a click counter", () => {
    render(<ReferralLinksDemo feature={feature} />);
    expect(screen.getByTestId("click-count")).toBeInTheDocument();
  });
});
