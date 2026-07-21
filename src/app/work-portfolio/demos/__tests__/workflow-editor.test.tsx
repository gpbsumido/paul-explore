import { describe, it, expect } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";
import WorkflowEditorDemo, {
  moveNode,
  addEdge,
  removeEdge,
} from "../workflow-editor";
import { FEATURES, featureIndexBySlug } from "../../_data/catalog";

const feature = FEATURES[featureIndexBySlug("workflow-editor")!];

describe("workflow graph helpers", () => {
  const nodes = [
    { id: "a", label: "A", x: 0, y: 0, code: "" },
    { id: "b", label: "B", x: 5, y: 5, code: "" },
  ];

  it("moveNode repositions only the targeted node", () => {
    const next = moveNode(nodes, "a", 30, 40);
    expect(next[0]).toMatchObject({ id: "a", x: 30, y: 40 });
    expect(next[1]).toEqual(nodes[1]);
  });

  it("addEdge skips self-links and duplicates", () => {
    const edges: [string, string][] = [["a", "b"]];
    expect(addEdge(edges, "a", "a")).toEqual(edges);
    expect(addEdge(edges, "a", "b")).toEqual(edges);
    expect(addEdge(edges, "b", "a")).toEqual([["a", "b"], ["b", "a"]]);
  });

  it("removeEdge drops the matching edge", () => {
    const edges: [string, string][] = [["a", "b"], ["b", "a"]];
    expect(removeEdge(edges, "a", "b")).toEqual([["b", "a"]]);
  });
});

describe("workflow editor demo", () => {
  it("shows the selected node's config and swaps it on node click", () => {
    render(<WorkflowEditorDemo feature={feature} />);
    expect(screen.getByLabelText("Node config")).toHaveValue('on(event = "purchase")');
    const graph = screen.getByLabelText("Workflow graph");
    fireEvent.click(within(graph).getByText("Send reward"));
    expect(screen.getByLabelText("Node config")).toHaveValue('grant(item = "vip_crate")');
  });

  it("edits the selected node's config in place", () => {
    render(<WorkflowEditorDemo feature={feature} />);
    const config = screen.getByLabelText("Node config");
    fireEvent.change(config, { target: { value: 'on(event = "login")' } });
    expect(config).toHaveValue('on(event = "login")');
  });

  it("adds and removes an edge", () => {
    render(<WorkflowEditorDemo feature={feature} />);
    const edgeCount = () => screen.getAllByTestId("edge-row").length;
    const start = edgeCount();

    fireEvent.change(screen.getByLabelText("Edge from"), { target: { value: "trigger" } });
    fireEvent.change(screen.getByLabelText("Edge to"), { target: { value: "action" } });
    fireEvent.click(screen.getByRole("button", { name: "Add edge" }));
    expect(edgeCount()).toBe(start + 1);

    fireEvent.click(screen.getAllByRole("button", { name: /Remove edge/ })[0]);
    expect(edgeCount()).toBe(start);
  });
});
