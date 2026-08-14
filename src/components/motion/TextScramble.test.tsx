import { describe, it, expect } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { renderToStaticMarkup } from "react-dom/server";
import { axe } from "@/test/a11y";
import TextScramble from "./TextScramble";

describe("TextScramble", () => {
  it("settles on the source text", async () => {
    render(<TextScramble text="Ember" trigger="mount" speedMs={1} />);
    await waitFor(() => expect(screen.getByText("Ember")).toBeInTheDocument());
  });

  it("ships the settled text in the server HTML", () => {
    const html = renderToStaticMarkup(
      <TextScramble text="Verdigris" trigger="mount" />,
    );
    expect(html).toContain("Verdigris");
  });

  it("exposes the stable text to assistive tech while the glyphs churn", () => {
    render(<TextScramble text="Verdigris" trigger="inView" speedMs={1} />);
    expect(screen.getByText("Verdigris")).toBeInTheDocument();
  });

  it("has no axe violations", async () => {
    const { container } = render(
      <TextScramble text="Verdigris" trigger="mount" speedMs={1} />,
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
