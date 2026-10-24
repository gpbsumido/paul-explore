import { describe, it, expect, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { axe } from "vitest-axe";
import GuideContent from "./GuideContent";
import { ENDURANT } from "@/lib/evar/endurant";
import { LEVELS } from "@/lib/evar/levels";
import { HOW_TO_SCENES } from "@/lib/evar/howToScenes";

vi.mock("@/components/PageHeader", () => ({ default: () => null }));

const STEPS = [
  { id: "neck-start", heading: /find the top of the neck/i },
  { id: "neck-diameter", heading: /measure the neck/i },
  { id: "neck-length", heading: /mark the neck length/i },
  { id: "sac", heading: /widest part of the sac/i },
  { id: "iliacs", heading: /both common iliacs/i },
  { id: "graft", heading: /size the graft/i },
  { id: "check", heading: /check your answers/i },
];

describe("GuideContent", () => {
  it("walks through every step in order, each with a picture and its own anchor", () => {
    render(<GuideContent />);
    expect(screen.getByRole("heading", { level: 1, name: /how to measure for an evar/i })).toBeInTheDocument();
    const headings = STEPS.map(({ heading }) => screen.getByRole("heading", { level: 2, name: heading }));
    for (let i = 1; i < headings.length; i += 1) {
      expect(headings[i - 1].compareDocumentPosition(headings[i]) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    }
    for (const { id } of STEPS) {
      const section = document.getElementById(id);
      expect(section, id).not.toBeNull();
      const image = within(section as HTMLElement).getByRole("img");
      expect(image.getAttribute("alt")?.length, id).toBeGreaterThan(20);
      expect(image.getAttribute("src"), id).toMatch(/^\/evar\/guide\/.+\.webp$/);
    }
  });

  it("says diameters go outer wall to outer wall, across the short axis, thrombus included", () => {
    render(<GuideContent />);
    const neck = document.getElementById("neck-diameter") as HTMLElement;
    expect(neck).toHaveTextContent(/outer wall to outer wall/i);
    expect(neck).toHaveTextContent(/short axis/i);
    expect(neck).toHaveTextContent(/thrombus/i);
    expect(document.getElementById("neck-length")).toHaveTextContent(/more than 10%/i);
  });

  it("sizes the example graft from the sheet itself, so the guide can't drift from the grading", () => {
    render(<GuideContent />);
    const graft = document.getElementById("graft") as HTMLElement;
    expect(graft).toHaveTextContent(`${ENDURANT.mainBodyDiametersFor(23)[0]} mm main body`);
    expect(graft).toHaveTextContent(`${ENDURANT.limbDiametersFor(14)[0]} mm limb`);
  });

  it("gives each level's tolerances from the levels themselves", () => {
    render(<GuideContent />);
    const check = document.getElementById("check") as HTMLElement;
    for (const level of LEVELS) {
      expect(check).toHaveTextContent(new RegExp(`${level.label}[^.]*${level.tolerance.neckDiameter} mm`));
    }
  });

  it("plays the how-to video, with its scenes written out", () => {
    const { container } = render(<GuideContent />);
    expect(container.querySelector('source[src="/evar/welcome/how-to-measure.mp4"]')?.parentElement).toHaveAttribute("controls");
    const transcript = screen.getByRole("group", { name: /what the video shows/i });
    for (const scene of HOW_TO_SCENES) expect(transcript).toHaveTextContent(scene.caption);
  });

  it("says what hospital planning adds that the practice doesn't, with sources", () => {
    render(<GuideContent />);
    const real = screen.getByRole("region", { name: /what real planning adds/i });
    for (const topic of [/centreline/i, /1 mm/i, /angle/i, /calcium/i, /bifurcation/i, /external iliac/i, /mesenteric/i]) {
      expect(real).toHaveTextContent(topic);
    }
    const sources = within(screen.getByRole("list", { name: /sources/i })).getAllByRole("link");
    expect(sources.some((a) => a.getAttribute("href")?.includes("ejves.com"))).toBe(true);
  });

  it("is for practice only, and sends people to practise", () => {
    render(<GuideContent />);
    expect(screen.getByText(/for practice only/i)).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: /start practising/i })[0]).toHaveAttribute("href", "/evar");
  });

  it("uses no em or en dashes, and Canadian spelling", () => {
    const { container } = render(<GuideContent />);
    expect(container.textContent).not.toMatch(/[–—]/);
    expect(container.textContent).not.toMatch(/\bcenter(line)?\b/i);
  });

  it("has no detectable accessibility problems", async () => {
    const { container } = render(<GuideContent />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
