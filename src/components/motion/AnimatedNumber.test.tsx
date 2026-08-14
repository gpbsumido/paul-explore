import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { renderToStaticMarkup } from "react-dom/server";
import { axe } from "@/test/a11y";
import AnimatedNumber from "./AnimatedNumber";

describe("AnimatedNumber", () => {
  it("ships the final value in the server HTML, never a zero", () => {
    const html = renderToStaticMarkup(<AnimatedNumber value={1234} />);
    expect(html).toContain("1234");
    expect(html).not.toMatch(/>\s*0\s*</);
  });

  it("applies the format function to the rendered value", () => {
    const html = renderToStaticMarkup(
      <AnimatedNumber value={1234} format={(n) => `${n} tests`} />,
    );
    expect(html).toContain("1234 tests");
  });

  it("shows the final value immediately under reduced motion", async () => {
    vi.resetModules();
    vi.doMock("@/app/providers", () => ({ useHubReducedMotion: () => true }));
    const { default: Reduced } = await import("./AnimatedNumber");

    render(<Reduced value={42} />);
    expect(screen.getByText("42")).toBeInTheDocument();
    vi.doUnmock("@/app/providers");
  });

  it("has no axe violations", async () => {
    const { container } = render(<AnimatedNumber value={99} />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
