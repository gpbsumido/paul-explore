import { describe, it, expect } from "vitest";
import {
  parseAbstractSections,
  detectDesign,
  extractSampleSize,
  buildDiscussion,
  detectInnovation,
} from "./journalClub";
import {
  ASK_MODELS,
  RECOMMENDED_MODEL,
  isAskModel,
} from "./askModels";

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

  it.each([
    ["Introduction", "background"],
    ["Context", "background"],
    ["Purpose", "objective"],
    ["Aims", "objective"],
    ["Materials and Methods", "methods"],
    ["Patients and Methods", "methods"],
    ["Findings", "results"],
    ["Conclusions:", "conclusions"],
  ] as const)("files a %s heading under %s", (heading, section) => {
    const parsed = parseAbstractSections(`<h4>${heading}</h4>Something stated.`);
    expect(parsed[section]).toBe("Something stated.");
  });

  it("leaves a heading with nothing under it empty rather than blank", () => {
    const parsed = parseAbstractSections("<h4>Results</h4><h4>Conclusions</h4>Done.");
    expect(parsed.results).toBeNull();
    expect(parsed.conclusions).toBe("Done.");
  });

  it("ignores a heading it doesn't recognise, but keeps its text in the body", () => {
    const parsed = parseAbstractSections("<h4>Funding</h4>None declared.");
    expect(parsed.body).toContain("None declared.");
    expect([parsed.background, parsed.objective, parsed.methods, parsed.results, parsed.conclusions]).toEqual([
      null, null, null, null, null,
    ]);
  });

  it("turns markup into spaces and unescapes entities in the body", () => {
    const parsed = parseAbstractSections("Stenosis &lt;50% in <i>all</i>patients &amp; controls");
    expect(parsed.body).toBe("Stenosis <50% in all patients & controls");
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

  it("names a multicentre study and an observational study on their own", () => {
    const only = (pubType: string) => detectDesign({ pubTypes: [pubType], title: "", abstract: "" }).label;
    expect(only("Multicenter Study")).toBe("Multicentre study");
    expect(only("Observational Study")).toBe("Observational study");
  });

  it("matches publication types whatever their capitalisation", () => {
    expect(detectDesign({ pubTypes: ["SYSTEMATIC REVIEW"], title: "", abstract: "" }).label).toBe("Systematic review");
  });

  it("reads the design off the title as well as the abstract, whatever the case", () => {
    const label = detectDesign({ pubTypes: [], title: "Prospective registry of limb salvage", abstract: "" }).label;
    expect(label).toBe("Prospective cohort");
  });

  it("says only a randomised trial can support causal claims", () => {
    const supports = (pubTypes: string[]) => detectDesign({ pubTypes, title: "", abstract: "" }).canSupportCausality;
    expect(supports(["Randomized Controlled Trial"])).toBe(true);
    expect(supports(["Observational Study"])).toBe(false);
    expect(supports([])).toBe(false);
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
    expect(extractSampleSize("In 2019 patients were enrolled")).toBeNull();
  });

  it("refuses a count of zero, whichever way it is written", () => {
    expect(extractSampleSize("The cohort (n = 0) was empty")).toBeNull();
    expect(extractSampleSize("We reviewed 0 patients")).toBeNull();
  });

  it("counts consecutive patients, limbs and procedures", () => {
    expect(extractSampleSize("We treated 87 consecutive patients")).toBe(87);
    expect(extractSampleSize("including 1,350 limbs")).toBe(1350);
    expect(extractSampleSize("after 40 procedures")).toBe(40);
  });

  it("prefers a stated n to a loose count elsewhere in the sentence", () => {
    expect(extractSampleSize("Of 900 patients screened, the cohort (n = 412) was analysed")).toBe(412);
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

  it("reads the sample size from the methods before the rest of the abstract", () => {
    const d = buildDiscussion({
      ...paper,
      abstract: "<h4>Background</h4>Of 9,000 patients screened nationally.<h4>Methods</h4>We analysed 412 patients.",
    });
    expect(d.points.join(" ")).toContain("412");
    expect(d.points.join(" ")).not.toContain("9,000");
  });

  it("says case, not cases, for a single patient", () => {
    const d = buildDiscussion({ ...paper, abstract: "<h4>Methods</h4>A report on 1 patients." });
    expect(d.points.join(" ")).toMatch(/rests on 1 case\./);
    expect(d.questions.join(" ")).toContain("With 1 case,");
  });

  it("quotes only the first sentence of the results, trimmed to a sensible length", () => {
    const long = `${"A very long finding ".repeat(20)}ends here. A second sentence.`;
    const d = buildDiscussion({
      ...paper,
      abstract: `<h4>Results</h4>Uptake was 41% in women. Then something else.<h4>Conclusions</h4>${long}`,
    });
    const text = d.points.join(" ");
    expect(text).toContain("What the paper reports: Uptake was 41% in women. Check");
    expect(text).not.toContain("Then something else");
    expect(text).toContain("…");
    expect(text).not.toContain("A second sentence");
  });

  it("closes with the randomisation question for a trial and the confounding one for the rest", () => {
    const rct = buildDiscussion({ ...paper, pubTypes: ["Randomized Controlled Trial"] });
    const cohort = buildDiscussion({ ...paper, pubTypes: ["Observational Study"] });
    expect(rct.questions.join(" ")).toContain("Randomisation removes confounding");
    expect(cohort.questions.join(" ")).toContain("Nothing here was randomised");
    expect(rct.questions.join(" ")).not.toContain("Nothing here was randomised");
  });

  it("names the journal and year in the fallback prompts, or says the journal is unnamed", () => {
    const bare = { title: "A short report.", abstract: "", pubTypes: [] as string[] };
    const named = buildDiscussion({ ...bare, journal: "Ann Vasc Surg", pubDate: "2025-04-02" });
    expect(named.points.join(" ")).toContain("Published in Ann Vasc Surg in 2025.");
    const unnamed = buildDiscussion({ ...bare, journal: "", pubDate: "" });
    expect(unnamed.points.join(" ")).toContain("Published in an unnamed journal.");
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

describe("detectInnovation", () => {
  it("recognises a paper announcing something new", () => {
    const r = detectInnovation({
      title: "First-in-human experience with a novel bioresorbable scaffold.",
      abstract: "We report the initial experience in six patients.",
    });
    expect(r.score).toBeGreaterThan(0);
    expect(r.signals.join(" ").toLowerCase()).toContain("first-in-human");
  });

  it("recognises a paper about an emerging technology", () => {
    const r = detectInnovation({
      title: "Machine learning for predicting aneurysm growth.",
      abstract: "A deep learning model was trained on serial imaging.",
    });
    expect(r.score).toBeGreaterThan(0);
    expect(r.signals.some((s) => /machine learning/i.test(s))).toBe(true);
  });

  it("scores a paper carrying several signals above one carrying a single signal", () => {
    const many = detectInnovation({
      title: "First-in-human robotic endovascular repair: a novel technique.",
      abstract: "Proof of concept in three patients.",
    });
    const one = detectInnovation({
      title: "A novel scoring system.",
      abstract: "Retrospective validation.",
    });
    expect(many.score).toBeGreaterThan(one.score);
  });

  it("does not call a routine outcomes paper innovative", () => {
    const r = detectInnovation({
      title: "Thirty-day mortality after elective open repair.",
      abstract:
        "We retrospectively reviewed consecutive patients and report standard outcomes.",
    });
    expect(r.score).toBe(0);
    expect(r.signals).toEqual([]);
  });

  it("does not fire on a paper merely saying results were not novel", () => {
    // "no novel" and "nothing novel" are the opposite claim.
    const r = detectInnovation({
      title: "Outcomes after repair.",
      abstract: "No novel complications were observed during follow-up.",
    });
    expect(r.score).toBe(0);
  });

  it.each([
    "There was nothing novel in the complication profile.",
    "The technique was not innovative.",
    "No new technique was introduced.",
  ])("does not fire on a denial: %s", (abstract) => {
    expect(detectInnovation({ title: "Outcomes after repair.", abstract }).signals).toEqual([]);
  });

  it("keeps the signals a denial doesn't touch", () => {
    const r = detectInnovation({
      title: "Outcomes after repair.",
      abstract: "No novel complications were seen. A machine learning model was used.",
    });
    expect(r.signals).toEqual(["machine learning"]);
  });

  it("reads AI as a capitalised word, not any 'ai' inside another", () => {
    const hits = (abstract: string) => detectInnovation({ title: "", abstract }).signals;
    expect(hits("An AI-assisted workflow.")).toEqual(["artificial intelligence"]);
    expect(hits("Reviewed by Ai Nguyen and the aide.")).toEqual([]);
  });

  it("reads a denial through the markup around the word", () => {
    const r = detectInnovation({ title: "", abstract: "No <i>novel</i> complications were seen." });
    expect(r.signals).toEqual([]);
  });

  it("strips markup before looking for signals", () => {
    const r = detectInnovation({ title: "A <i>novel</i> stent", abstract: "" });
    expect(r.signals).toEqual(["novel"]);
  });

  it("names every signal it matched, so the reason is visible", () => {
    const r = detectInnovation({
      title: "A novel robotic approach.",
      abstract: "",
    });
    expect(r.signals.length).toBeGreaterThan(0);
    r.signals.forEach((s) => expect(s.trim().length).toBeGreaterThan(0));
  });
});

describe("ask models", () => {
  it("offers exactly three, with one recommended", () => {
    expect(ASK_MODELS).toHaveLength(3);
    expect(ASK_MODELS.filter((m) => m.recommended)).toHaveLength(1);
    expect(RECOMMENDED_MODEL).toBe("gpt-4.1");
  });

  it("explains what each is for, so the choice is not a guess", () => {
    ASK_MODELS.forEach((m) => {
      expect(m.note.length).toBeGreaterThan(40);
      expect(m.label.length).toBeGreaterThan(0);
    });
  });

  it("rejects anything not on the list", () => {
    expect(isAskModel("gpt-4.1")).toBe(true);
    expect(isAskModel("gpt-4-turbo")).toBe(false);
    expect(isAskModel("")).toBe(false);
    expect(isAskModel(undefined)).toBe(false);
  });
});
