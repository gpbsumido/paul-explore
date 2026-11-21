import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { axe } from "@/test/a11y";
import { StreamingMarkdown } from "./StreamingMarkdown";

describe("StreamingMarkdown", () => {
  it("renders plain text as a paragraph", () => {
    render(<StreamingMarkdown content="Hello world" />);

    const p = screen.getByText("Hello world");
    expect(p.tagName).toBe("P");
  });

  it("renders **bold** as a <strong> element", () => {
    render(<StreamingMarkdown content="This is **bold** text" />);

    expect(screen.getByText("bold").tagName).toBe("STRONG");
  });

  it("renders *italic* as an <em> element", () => {
    render(<StreamingMarkdown content="This is *italic* text" />);

    expect(screen.getByText("italic").tagName).toBe("EM");
  });

  it("renders `inline code` as a <code> element", () => {
    render(<StreamingMarkdown content="Use `useState` here" />);

    const code = screen.getByText("useState");
    expect(code.tagName).toBe("CODE");
  });

  it("renders a complete code fence as a <pre><code> block", () => {
    const content = "```js\nconst x = 1;\n```";
    render(<StreamingMarkdown content={content} />);

    const code = screen.getByText("const x = 1;");
    expect(code.tagName).toBe("CODE");
    expect(code.closest("pre")).toBeInTheDocument();
  });

  it("auto-closes unclosed code fence when isStreaming is true", () => {
    const content = "```js\nconst x = 1;";
    render(<StreamingMarkdown content={content} isStreaming />);

    const code = screen.getByText("const x = 1;");
    expect(code.tagName).toBe("CODE");
    expect(code.closest("pre")).toBeInTheDocument();
  });

  it("renders multiple paragraphs separated by blank lines", () => {
    render(
      <StreamingMarkdown content={"First paragraph\n\nSecond paragraph"} />,
    );

    expect(screen.getByText("First paragraph")).toBeInTheDocument();
    expect(screen.getByText("Second paragraph")).toBeInTheDocument();

    const paragraphs = screen.getByText("First paragraph").tagName;
    expect(paragraphs).toBe("P");
  });

  it("renders bullet lists", () => {
    render(
      <StreamingMarkdown content={"- Item one\n- Item two\n- Item three"} />,
    );

    expect(screen.getByText("Item one")).toBeInTheDocument();
    expect(screen.getByText("Item two")).toBeInTheDocument();

    const li = screen.getByText("Item one").closest("li");
    expect(li).toBeInTheDocument();
    expect(li?.closest("ul")).toBeInTheDocument();
  });

  it("keeps the text around inline formatting", () => {
    render(<StreamingMarkdown content="This is **bold** text, and `code` too" />);

    expect(screen.getByText("bold").closest("p")).toHaveTextContent(
      "This is bold text, and code too",
    );
  });

  it("leaves an unclosed code fence alone when nothing is streaming", () => {
    render(<StreamingMarkdown content={"```js\nconst x = 1;"} />);

    expect(document.querySelector("pre")).toBeNull();
  });

  it("does not add a second fence when a streaming code block is already closed", () => {
    const { container } = render(
      <StreamingMarkdown content={"```js\nconst x = 1;\n```\n\nDone."} isStreaming />,
    );

    expect(container.querySelectorAll("pre")).toHaveLength(1);
    expect(screen.getByText("Done.").tagName).toBe("P");
  });

  it("formats inline markup inside bullets and drops only the dash marker", () => {
    render(<StreamingMarkdown content={"- **Bold** item\n- plain item"} />);

    const items = screen.getAllByRole("listitem");
    expect(items.map((li) => li.textContent)).toEqual([
      "Bold item",
      "plain item",
    ]);
    expect(items[0].querySelector("strong")).toHaveTextContent("Bold");
  });

  it("treats a block as a paragraph unless every line is a bullet", () => {
    render(<StreamingMarkdown content={"- first\nnot a bullet"} />);

    expect(screen.queryByRole("list")).not.toBeInTheDocument();
    expect(document.querySelector("p")).toHaveTextContent("- first");
  });

  it("has no axe violations", async () => {
    const content =
      "**Bold** and *italic* with `code`\n\n- List item\n\n```js\nconst x = 1;\n```";
    const { container } = render(<StreamingMarkdown content={content} />);

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
