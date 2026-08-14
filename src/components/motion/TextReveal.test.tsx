import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { renderToStaticMarkup } from "react-dom/server";
import { axe } from "@/test/a11y";
import TextReveal from "./TextReveal";

describe("TextReveal", () => {
  it("renders the requested element", () => {
    render(<TextReveal as="h2">Verdigris and ember</TextReveal>);
    expect(
      screen.getByRole("heading", { level: 2, name: "Verdigris and ember" }),
    ).toBeInTheDocument();
  });

  it("keeps the whole string as the accessible name when split per word", () => {
    render(
      <TextReveal as="h2" per="word">
        Verdigris and ember
      </TextReveal>,
    );
    expect(
      screen.getByRole("heading", { name: "Verdigris and ember" }),
    ).toBeInTheDocument();
  });

  it("keeps the whole string as the accessible name when split per character", () => {
    render(
      <TextReveal as="h2" per="char">
        Ember
      </TextReveal>,
    );
    expect(screen.getByRole("heading", { name: "Ember" })).toBeInTheDocument();
  });

  it("ships the text visible in the server HTML rather than at opacity 0", () => {
    const html = renderToStaticMarkup(
      <TextReveal as="h1">Above the fold</TextReveal>,
    );
    // The words are split across spans, so the markup never holds the phrase
    // contiguously. What matters is that the text is all there and that nothing
    // ships hidden waiting on hydration.
    const text = html.replace(/<[^>]+>/g, "");
    expect(text).toBe("Above the fold");
    expect(html).not.toMatch(/opacity:\s*0/);
    expect(html).not.toMatch(/data-revealed/);
  });

  it("has no axe violations", async () => {
    const { container } = render(
      <TextReveal as="h2" per="word">
        Verdigris and ember
      </TextReveal>,
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
