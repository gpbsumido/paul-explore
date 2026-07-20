import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import WorkflowEditorDemo from "../workflow-editor";
import { FEATURES, featureIndexBySlug } from "../../_data/catalog";

const feature = FEATURES[featureIndexBySlug("workflow-editor")!];

describe("workflow editor demo", () => {
  it("shows the selected node's config and swaps it on node click", () => {
    render(<WorkflowEditorDemo feature={feature} />);
    // trigger is selected by default
    expect(screen.getByText(/on\(event = "purchase"\)/)).toBeInTheDocument();
    fireEvent.click(screen.getByText("Send reward"));
    expect(screen.getByText(/grant\(item = "vip_crate"\)/)).toBeInTheDocument();
    expect(screen.queryByText(/on\(event = "purchase"\)/)).toBeNull();
  });
});
