import { describe, it, expect } from "vitest";
import {
  parseAbstractSections,
  detectDesign,
  extractSampleSize,
  buildDiscussion,
} from "./journalClub";

const structured =
  "<h4>Background</h4>Screening uptake in women is poorly described." +
  "<h4>Methods</h4>We retrospectively reviewed 412 patients across four centres between 2019 and 2024." +
  "<h4>Results</h4>Uptake was 41% in women versus 68% in men." +
  "<h4>Conclusions</h4>Women are screened substantially less often, and targeted outreach may close the gap.";

describe("parseAbstractSections", () => {
  it("reads the sections out of the markup Europe PMC actually sends", () => {
    const parsed = parseAbstractSections(structured);
    expect(parsed.background).toContain("Screening uptake in women");
    expect(parsed.methods).toContain("412 patients");
    expect(parsed.results).toContain("41%");
    expect(parsed.conclusions).toContain("screened substantially less often");
  });

  it("treats an unstructured abstract as one body rather than losing it", () => {
    const parsed = parseAbstractSections("A single paragraph with no headings.");
    expect(parsed.body).toBe("A single paragraph with no headings.");
    expect(parsed.conclusions).toBeNull();
  });

  it("accepts the singular and plural heading spellings both appear in", () => {
    const parsed = parseAbstractSections(
      "<h4>Conclusion</h4>One thing follows.",
    );
    expect(parsed.conclusions).toBe("One thing follows.");
  });

  it("survives an empty abstract", () => {
    const parsed = parseAbstractSections("");
    expect(parsed.body).toBe("");
    expect(parsed.methods).toBeNull();
  });
});

describe("detectDesign", () => {
  it("believes the NLM publication types over the prose", () => {
    const design = detectDesign({
      pubTypes: ["Journal Article", "Meta-Analysis"],
      title: "Outcomes after repair.",
      abstract: "We reviewed records.",
    });
    expect(design.label).toBe("Meta-analysis");
  });

  it("prefers the most specific type when several apply", () => {
    const design = detectDesign({
      pubTypes: ["Journal Article", "Observational Study", "Multicenter Study"],
      title: "",
      abstract: "",
    });
    expect(design.label).toBe("Multicentre observational study");
  });

  it("reads the design off the text when no type says", () => {
    const design = detectDesign({
      pubTypes: ["Journal Article"],
      title: "A retrospective cohort study of limb salvage.",
      abstract: "We retrospectively reviewed consecutive patients.",
    });
    expect(design.label).toBe("Retrospective cohort");
  });

  it("says so plainly when the design cannot be determined", () => {
    const design = detectDesign({ pubTypes: [], title: "Something.", abstract: "" });
    expect(design.label).toBe("Design not stated");
  });

  it("carries the standing weakness of each design, not a generic caveat", () => {
    const rct = detectDesign({
      pubTypes: ["Randomized Controlled Trial"],
      title: "",
      abstract: "",
    });
    const retro = detectDesign({
      pubTypes: [],
      title: "A retrospective review.",
      abstract: "",
    });
    expect(rct.caveat).not.toBe(retro.caveat);
    expect(retro.caveat.toLowerCase()).toContain("confound");
  });
});

describe("extractSampleSize", () => {
  it("finds a plain patient count in the methods", () => {
    expect(extractSampleSize("We reviewed 412 patients across four centres")).toBe(
      412,
    );
  });

  it("understands an n = form", () => {
    expect(extractSampleSize("The cohort (n = 1,204) was followed")).toBe(1204);
  });

  it("returns null rather than guessing", () => {
    expect(extractSampleSize("We reviewed the literature.")).toBeNull();
  });

  it("ignores years, which are not sample sizes", () => {
    expect(extractSampleSize("between 2019 and 2024")).toBeNull();
  });
});

describe("buildDiscussion", () => {
  const paper = {
    title: "AAA screening uptake in women: a four-centre review.",
    journal: "Journal of Vascular Surgery",
    pubDate: "2025-04-02",
    abstract: structured,
    pubTypes: ["Journal Article", "Multicenter Study", "Observational Study"],
  };

  it("always yields at least three points and three questions", () => {
    const d = buildDiscussion(paper);
    expect(d.points.length).toBeGreaterThanOrEqual(3);
    expect(d.questions.length).toBeGreaterThanOrEqual(3);
  });

  it("still meets the floor when there is almost nothing to work with", () => {
    const d = buildDiscussion({
      title: "A short report.",
      journal: "",
      pubDate: "2025",
      abstract: "",
      pubTypes: [],
    });
    expect(d.points.length).toBeGreaterThanOrEqual(3);
    expect(d.questions.length).toBeGreaterThanOrEqual(3);
  });

  it("grounds a point in the design's real weakness", () => {
    const d = buildDiscussion(paper);
    expect(d.design.label).toBe("Multicentre observational study");
    expect(d.points.join(" ").toLowerCase()).toContain("confound");
  });

  it("uses the numbers the paper reported rather than talking in the abstract", () => {
    const d = buildDiscussion(paper);
    const text = d.points.join(" ");
    expect(text).toContain("412");
  });

  it("quotes the paper's own conclusion back as something to challenge", () => {
    const d = buildDiscussion(paper);
    expect(d.questions.join(" ")).toContain("screened substantially less often");
  });

  it("never emits an empty or placeholder prompt", () => {
    const d = buildDiscussion(paper);
    [...d.points, ...d.questions].forEach((line) => {
      expect(line.trim().length).toBeGreaterThan(20);
      expect(line).not.toMatch(/TODO|lorem|xxx/i);
    });
  });

  it("asks every question as a question", () => {
    const d = buildDiscussion(paper);
    d.questions.forEach((q) => expect(q.trim().endsWith("?")).toBe(true));
  });
});
