import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { renderToStaticMarkup } from "react-dom/server";
import { axe } from "@/test/a11y";
import TextReveal from "./TextReveal";

const mocks = vi.hoisted(() => ({ inView: false }));
vi.mock("framer-motion", async (importOriginal) => ({
  ...(await importOriginal<typeof import("framer-motion")>()),
  useInView: () => mocks.inView,
}));

beforeEach(() => {
  mocks.inView = false;
});

const parts = (container: HTMLElement) =>
  [...container.querySelectorAll<HTMLElement>(".motion-reveal-part")];

describe("TextReveal", () => {
  it("splits into one part per word by default, with the spaces kept between them", () => {
    const { container } = render(<TextReveal>Verdigris and ember</TextReveal>);
    expect(parts(container).map((part) => part.textContent)).toEqual([
      "Verdigris",
      "and",
      "ember",
    ]);
    expect(container.firstElementChild?.textContent).toBe("Verdigris and ember");
  });

  it("splits into one part per character when asked", () => {
    const { container } = render(<TextReveal per="char">Ember</TextReveal>);
    expect(parts(container).map((part) => part.textContent)).toEqual([
      "E", "m", "b", "e", "r",
    ]);
  });

  it("staggers each part after the one before it, starting from the delay", () => {
    const { container } = render(
      <TextReveal staggerMs={50} delay={200}>
        one two three
      </TextReveal>,
    );
    expect(parts(container).map((part) => part.style.animationDelay)).toEqual([
      "200ms",
      "250ms",
      "300ms",
    ]);
  });

  it("is not marked revealed until it has scrolled into view", () => {
    const { container, rerender } = render(<TextReveal>Headline</TextReveal>);
    expect(container.firstElementChild).not.toHaveAttribute("data-revealed");

    mocks.inView = true;
    rerender(<TextReveal>Headline</TextReveal>);
    expect(container.firstElementChild).toHaveAttribute("data-revealed", "true");
  });

  it("passes the caller's class to the element and defaults to a span", () => {
    const { container } = render(<TextReveal className="text-xl">Headline</TextReveal>);
    expect(container.firstElementChild?.tagName).toBe("SPAN");
    expect(container.firstElementChild).toHaveClass("text-xl");
  });

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
