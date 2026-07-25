import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { tokenizeJson, JsonView } from "../json-view";

describe("tokenizeJson", () => {
  it("classifies keys, strings, numbers and literals", () => {
    const kinds = tokenizeJson('{"a":"x","b":2,"c":true}').map((t) => t.kind);
    expect(kinds).toContain("key");
    expect(kinds).toContain("string");
    expect(kinds).toContain("number");
    expect(kinds).toContain("literal");
  });

  it("round-trips the original text", () => {
    const src = JSON.stringify({ slug: "overview", tiles: ["a", "b"], n: 3 }, null, 2);
    expect(tokenizeJson(src).map((t) => t.text).join("")).toBe(src);
  });

  it("tells a key apart from a string value", () => {
    const tokens = tokenizeJson('{"slug":"overview"}');
    const slugKey = tokens.find((t) => t.text.includes("slug"));
    const slugVal = tokens.find((t) => t.text.includes("overview"));
    expect(slugKey?.kind).toBe("key");
    expect(slugVal?.kind).toBe("string");
  });
});

describe("JsonView", () => {
  it("renders the value as formatted JSON text", () => {
    render(<JsonView value={{ slug: "economy", chart: "bar" }} />);
    const pre = screen.getByTestId("json-view");
    expect(pre.textContent).toContain('"slug"');
    expect(pre.textContent).toContain('"economy"');
    expect(pre.textContent).toContain('"chart"');
  });
});
