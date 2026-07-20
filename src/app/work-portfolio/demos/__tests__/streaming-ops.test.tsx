import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import StreamingOpsDemo from "../streaming-ops";
import { FEATURES, featureIndexBySlug } from "../../_data/catalog";

const feature = FEATURES[featureIndexBySlug("streaming-ops")!];

describe("streaming ops demo", () => {
  it("lists topics and appends script output when run", () => {
    render(<StreamingOpsDemo feature={feature} />);
    expect(screen.getByText("events.raw")).toBeInTheDocument();
    const out = screen.getByLabelText("Script output");
    expect(out).not.toHaveTextContent("rebalance-consumers");
    fireEvent.click(screen.getByRole("button", { name: "Run rebalance script" }));
    expect(out).toHaveTextContent("rebalance-consumers");
  });
});
