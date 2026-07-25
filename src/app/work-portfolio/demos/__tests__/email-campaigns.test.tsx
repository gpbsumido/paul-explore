import { describe, it, expect } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";
import EmailCampaignsDemo from "../email-campaigns";
import { FEATURES, featureIndexBySlug } from "../../_data/catalog";

const feature = FEATURES[featureIndexBySlug("email-campaigns")!];

describe("email campaigns demo", () => {
  it("adds a block to the email preview", () => {
    render(<EmailCampaignsDemo feature={feature} />);
    const preview = screen.getByLabelText("Email preview");
    const count = () => within(preview).getAllByTestId("email-block").length;
    const before = count();
    fireEvent.click(screen.getByRole("button", { name: "Text" }));
    expect(count()).toBe(before + 1);
  });

  it("edits a block inline", () => {
    render(<EmailCampaignsDemo feature={feature} />);
    const heading = screen.getByLabelText("Heading text");
    fireEvent.change(heading, { target: { value: "Season 5 is live" } });
    expect(heading).toHaveValue("Season 5 is live");
  });

  it("imports a local image as a data url", async () => {
    render(<EmailCampaignsDemo feature={feature} />);
    const file = new File(["banner-bytes"], "banner.png", { type: "image/png" });
    fireEvent.change(screen.getByLabelText("Import image"), {
      target: { files: [file] },
    });
    const img = await screen.findByRole("img");
    expect(img.getAttribute("src")).toMatch(/^data:image\/png/);
  });

  it("shows the campaign table with statuses", () => {
    render(<EmailCampaignsDemo feature={feature} />);
    expect(screen.getByText("Season 4 launch")).toBeInTheDocument();
    expect(screen.getByText("Scheduled")).toBeInTheDocument();
  });
});
