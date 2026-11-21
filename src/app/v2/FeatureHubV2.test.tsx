import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import FeatureHubV2 from "./FeatureHubV2";
import { FEATURES } from "@/app/_shared/featureData.data";
import type { FeatureItem } from "@/types/hub";

// The real cards pull in a mini-preview per feature, which is not what this
// page is responsible for. A plain link per feature is enough to see which
// features the hub is showing.
vi.mock("@/app/_shared/featureData", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/app/_shared/featureData")>()),
  FeatureCard: ({ feature }: { feature: FeatureItem }) => (
    <a href={feature.href}>{feature.title}</a>
  ),
  ThoughtCard: () => null,
}));

vi.mock("./landing/NavBar", () => ({ default: () => null }));

let meName: string | null | undefined = undefined;
vi.mock("@/hooks/useMe", () => ({
  useMe: () => ({
    data: meName === undefined ? undefined : { name: meName, email: null, sub: "x", isFlagAdmin: false },
  }),
}));

const featureTitlesShown = () =>
  FEATURES.filter((feature) => screen.queryByRole("link", { name: feature.title })).map(
    (feature) => feature.id,
  );

describe("FeatureHubV2", () => {
  it("greets the signed-in person by first name, from the server-read name on the first paint", () => {
    meName = undefined;
    render(<FeatureHubV2 initialMe={{ name: "Paul Sumido", email: null }} />);

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Hey Paul.");
  });

  it("prefers the live session over the name it was handed", () => {
    meName = "Sam Rivera";
    render(<FeatureHubV2 initialMe={{ name: "Paul Sumido", email: null }} />);

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Hey Sam.");
  });

  it("falls back to a plain greeting when there is no name", () => {
    meName = null;
    render(<FeatureHubV2 />);

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Hey there.");
  });

  it("shows every feature under All, and says how many there are", () => {
    meName = null;
    render(<FeatureHubV2 />);

    expect(featureTitlesShown()).toEqual(FEATURES.map((feature) => feature.id));
    expect(screen.getByText(`${FEATURES.length} features, all yours.`)).toBeInTheDocument();
  });

  it("narrows to the features in a category when its tab is clicked, and back again under All", async () => {
    const user = userEvent.setup();
    meName = null;
    render(<FeatureHubV2 />);

    await user.click(screen.getByRole("button", { name: "Labs" }));
    expect(featureTitlesShown()).toEqual(["learn", "particles"]);

    await user.click(screen.getByRole("button", { name: "Pokemon" }));
    expect(featureTitlesShown()).toEqual(["pokemon"]);

    await user.click(screen.getByRole("button", { name: "All" }));
    expect(featureTitlesShown()).toHaveLength(FEATURES.length);
  });
});
