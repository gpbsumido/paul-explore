/**
 * Turning a paper into something worth an hour of discussion.
 *
 * The hard part is not finding recent papers, it is that a citation on its own
 * gives a trainee nothing to prepare. What makes this possible without an LLM
 * is that Europe PMC hands back two structured things: NLM publication types,
 * which name the design authoritatively rather than leaving it to be guessed
 * from prose, and abstracts marked up with <h4>Methods</h4> style headings.
 *
 * Everything below is grounded in those. A prompt that could be printed on a
 * card and handed to any paper -- "what was the study design?" -- is worse than
 * no prompt, because it wastes the reader's attention and teaches nothing.
 */

export type AbstractSections = {
  background: string | null;
  objective: string | null;
  methods: string | null;
  results: string | null;
  conclusions: string | null;
  /** The whole abstract as plain text, headings stripped. */
  body: string;
};

const stripTags = (text: string): string =>
  text
    .replace(/<[^>]+>/g, " ")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();

/** Headings vary in spelling and number; map the ones that actually appear. */
const SECTION_ALIASES: Record<string, keyof Omit<AbstractSections, "body">> = {
  background: "background",
  introduction: "background",
  context: "background",
  objective: "objective",
  objectives: "objective",
  purpose: "objective",
  aim: "objective",
  aims: "objective",
  methods: "methods",
  method: "methods",
  "materials and methods": "methods",
  "research design and methods": "methods",
  "patients and methods": "methods",
  results: "results",
  findings: "results",
  conclusion: "conclusions",
  conclusions: "conclusions",
};

/**
 * Splits a Europe PMC abstract into its labelled sections.
 *
 * An unstructured abstract is not a failure -- plenty are a single paragraph --
 * so it comes back whole in `body` rather than being dropped.
 */
export function parseAbstractSections(abstractText: string): AbstractSections {
  const sections: AbstractSections = {
    background: null,
    objective: null,
    methods: null,
    results: null,
    conclusions: null,
    body: stripTags(abstractText),
  };

  const pattern = /<h4>([^<]+)<\/h4>([\s\S]*?)(?=<h4>|$)/g;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(abstractText)) !== null) {
    const key =
      SECTION_ALIASES[match[1].trim().toLowerCase().replace(/:$/, "")];
    const value = stripTags(match[2]);
    if (key && value) sections[key] = value;
  }

  return sections;
}

export type Design = {
  label: string;
  /** The weakness this design always carries, in the reader's own terms. */
  caveat: string;
  /** True when conclusions can be causal rather than associational. */
  canSupportCausality: boolean;
};

/**
 * Publication types, most specific first. NLM applies several at once -- an RCT
 * is also a "Journal Article" -- so order decides which one gets named.
 */
const BY_PUB_TYPE: { type: string; design: Design }[] = [
  {
    type: "meta-analysis",
    design: {
      label: "Meta-analysis",
      caveat:
        "A pooled estimate inherits every bias of the studies inside it, so heterogeneity and the inclusion criteria matter more than the headline effect size.",
      canSupportCausality: false,
    },
  },
  {
    type: "systematic review",
    design: {
      label: "Systematic review",
      caveat:
        "The conclusion is only as good as the search strategy and what the field chose to publish, so publication bias is the first thing to press on.",
      canSupportCausality: false,
    },
  },
  {
    type: "randomized controlled trial",
    design: {
      label: "Randomised controlled trial",
      caveat:
        "Randomisation handles confounding, so the questions move to whether the enrolled patients resemble yours and whether the endpoint is one that matters to them.",
      canSupportCausality: true,
    },
  },
  {
    type: "case reports",
    design: {
      label: "Case report",
      caveat:
        "A single case can prove something is possible and can never establish how often it happens or whether it was the treatment that did it.",
      canSupportCausality: false,
    },
  },
  {
    type: "multicenter study",
    design: {
      label: "Multicentre study",
      caveat:
        "Several sites widen the case mix, which helps generalisability but introduces variation in technique and follow-up between centres; confounding by indication still applies.",
      canSupportCausality: false,
    },
  },
  {
    type: "observational study",
    design: {
      label: "Observational study",
      caveat:
        "Treatment was not assigned at random, so confounding by indication -- sicker patients getting a different operation -- is the standing threat to every association reported.",
      canSupportCausality: false,
    },
  },
  {
    type: "comparative study",
    design: {
      label: "Comparative study",
      caveat:
        "Groups that were not randomised differ in ways the paper may not have measured, so any difference in outcome may belong to the patients rather than the treatment.",
      canSupportCausality: false,
    },
  },
  {
    type: "review",
    design: {
      label: "Narrative review",
      caveat:
        "A narrative review reflects what its authors chose to cite, so it is a useful map of a field and weak evidence for any specific claim.",
      canSupportCausality: false,
    },
  },
];

/** Text fallbacks, for when the publication types say nothing useful. */
const BY_TEXT: { pattern: RegExp; design: Design }[] = [
  {
    pattern: /\brandomi[sz]ed\b/i,
    design: BY_PUB_TYPE[2].design,
  },
  {
    pattern: /\bretrospective\b/i,
    design: {
      label: "Retrospective cohort",
      caveat:
        "Records collected for care rather than research mean missing data is rarely random, and confounding by indication is the standing threat to every association.",
      canSupportCausality: false,
    },
  },
  {
    pattern: /\bprospective\b/i,
    design: {
      label: "Prospective cohort",
      caveat:
        "Data collected to a protocol is cleaner than a chart review, but nobody was randomised, so confounding still explains any difference as easily as the treatment does.",
      canSupportCausality: false,
    },
  },
  {
    pattern: /\bcase[- ]control\b/i,
    design: {
      label: "Case-control study",
      caveat:
        "Cases and controls are selected after the outcome is known, so how controls were chosen decides the result more than anything else in the paper.",
      canSupportCausality: false,
    },
  },
  {
    pattern: /\bcross[- ]sectional\b/i,
    design: {
      label: "Cross-sectional study",
      caveat:
        "Exposure and outcome are measured at the same moment, so the paper cannot say which came first.",
      canSupportCausality: false,
    },
  },
  {
    pattern: /\bregistry\b/i,
    design: {
      label: "Registry analysis",
      caveat:
        "Registries capture what centres chose to submit, so completeness varies by site and unmeasured confounding is the standing threat.",
      canSupportCausality: false,
    },
  },
];

const UNKNOWN: Design = {
  label: "Design not stated",
  caveat:
    "The abstract does not say how this was designed, which is itself worth noting -- work out from the methods whether anything here can support more than an association.",
  canSupportCausality: false,
};

/** Names the design, believing the publication types before the prose. */
export function detectDesign({
  pubTypes,
  title,
  abstract,
}: {
  pubTypes: string[];
  title: string;
  abstract: string;
}): Design {
  const types = pubTypes.map((t) => t.toLowerCase());

  const multicentre = types.includes("multicenter study");
  const observational = types.includes("observational study");
  if (multicentre && observational) {
    return {
      ...BY_PUB_TYPE[5].design,
      label: "Multicentre observational study",
    };
  }

  for (const { type, design } of BY_PUB_TYPE) {
    if (types.includes(type)) return design;
  }

  const text = `${title} ${abstract}`;
  for (const { pattern, design } of BY_TEXT) {
    if (pattern.test(text)) return design;
  }

  return UNKNOWN;
}

/**
 * Pulls the cohort size out of the methods.
 *
 * Deliberately conservative: a wrong number in a discussion prompt is worse
 * than no number, so anything that looks like a year is rejected and nothing
 * is inferred when no count is stated.
 */
export function extractSampleSize(text: string): number | null {
  const explicit = text.match(/\bn\s*=\s*([\d,]+)/i);
  if (explicit) {
    const value = Number(explicit[1].replace(/,/g, ""));
    return Number.isFinite(value) && value > 0 ? value : null;
  }

  const counted = text.match(
    /\b([\d,]{1,9})\s+(?:consecutive\s+)?(?:patients|participants|subjects|cases|limbs|procedures|repairs)\b/i,
  );
  if (!counted) return null;

  const value = Number(counted[1].replace(/,/g, ""));
  if (!Number.isFinite(value) || value <= 0) return null;

  // A bare 1990-2035 is far more likely a year than a cohort size.
  const looksLikeYear = /^(19|20)\d{2}$/.test(counted[1]);
  return looksLikeYear ? null : value;
}

export type Innovation = {
  /** How many distinct innovation signals the paper carries. */
  score: number;
  /** The matched signals, named so the reason is visible rather than a black box. */
  signals: string[];
};

/**
 * Signals that a paper is about something new rather than another outcomes
 * series. Two kinds: claims of novelty, and named emerging technologies.
 *
 * The matched signals are returned, not just a score, because "this is
 * innovative, trust me" is not a useful thing to tell a reader deciding what to
 * spend an hour on. Seeing that it matched "first-in-human" and "robotic" lets
 * her judge whether the label is earned.
 */
const INNOVATION_SIGNALS: { label: string; pattern: RegExp }[] = [
  { label: "first-in-human", pattern: /\bfirst[- ]in[- ]human\b/i },
  {
    label: "first report",
    pattern: /\bfirst (?:report|case|series|experience)\b/i,
  },
  { label: "novel", pattern: /(?<!no |nothing )\bnovel\b/i },
  {
    label: "new technique",
    pattern: /\bnew (?:technique|approach|device|method)\b/i,
  },
  { label: "innovative", pattern: /\binnovat(?:ive|ion)\b/i },
  { label: "proof of concept", pattern: /\bproof[- ]of[- ]concept\b/i },
  { label: "feasibility study", pattern: /\bfeasibility\b/i },
  { label: "pilot study", pattern: /\bpilot (?:study|trial)\b/i },
  { label: "initial experience", pattern: /\b(?:initial|early) experience\b/i },
  { label: "emerging", pattern: /\bemerging\b/i },
  { label: "next-generation", pattern: /\bnext[- ]generation\b/i },
  {
    label: "machine learning",
    pattern: /\b(?:machine learning|deep learning|neural network)\b/i,
  },
  {
    label: "artificial intelligence",
    pattern: /\b(?:artificial intelligence|\bAI\b)/,
  },
  { label: "robotic", pattern: /\brobotic?\b/i },
  { label: "3D printing", pattern: /\b3[dD][- ]print/i },
  {
    label: "bioengineered",
    pattern: /\bbio(?:engineered|printed|resorbable)\b/i,
  },
  {
    label: "gene or cell therapy",
    pattern: /\b(?:gene therapy|cell therapy|stem cell)\b/i,
  },
  {
    label: "wearable or remote monitoring",
    pattern: /\b(?:wearable|remote monitoring|telemonitoring)\b/i,
  },
];

/** Phrases that use a signal word to deny it. */
const NEGATIONS = /\b(?:no|nothing|not) (?:novel|new|innovative)\b/i;

export function detectInnovation({
  title,
  abstract,
}: {
  title: string;
  abstract: string;
}): Innovation {
  const text = stripTags(`${title} ${abstract}`);
  const negated = NEGATIONS.test(text);

  const signals = INNOVATION_SIGNALS.filter(({ label, pattern }) => {
    if (!pattern.test(text)) return false;
    // "No novel complications were observed" is the opposite claim.
    const claimsNovelty = ["novel", "new technique", "innovative"].includes(
      label,
    );
    return !(negated && claimsNovelty);
  }).map(({ label }) => label);

  return { score: signals.length, signals };
}

export type Discussion = {
  design: Design;
  points: string[];
  questions: string[];
};

/** Trims a sentence for quoting without leaving it dangling mid-clause. */
const firstSentence = (text: string): string => {
  const match = text.match(/^(.*?[.!?])(\s|$)/);
  const sentence = (match?.[1] ?? text).trim();
  return sentence.length > 240 ? `${sentence.slice(0, 237)}…` : sentence;
};

/**
 * Builds the discussion material for one paper.
 *
 * Guarantees at least three points and three questions. The guarantee is met
 * with prompts that still reference this paper's design, journal or year --
 * never a placeholder, because the floor existing is not a reason to fill it
 * with something worthless.
 */
export function buildDiscussion({
  title,
  journal,
  pubDate,
  abstract,
  pubTypes,
}: {
  title: string;
  journal: string;
  pubDate: string;
  abstract: string;
  pubTypes: string[];
}): Discussion {
  const sections = parseAbstractSections(abstract);
  const design = detectDesign({ pubTypes, title, abstract: sections.body });
  const n = extractSampleSize(sections.methods ?? sections.body);
  const year = pubDate.slice(0, 4);

  const points: string[] = [];
  const questions: string[] = [];

  points.push(`${design.label}. ${design.caveat}`);

  if (n !== null) {
    points.push(
      `The analysis rests on ${n.toLocaleString()} ${
        n === 1 ? "case" : "cases"
      }. Work out whether that is enough to detect a difference that would change what you do, or only enough to describe the cohort.`,
    );
    questions.push(
      `With ${n.toLocaleString()} ${n === 1 ? "case" : "cases"}, what size of effect could this study realistically have detected, and would a smaller but real difference still matter clinically?`,
    );
  }

  if (sections.results) {
    points.push(
      `What the paper reports: ${firstSentence(sections.results)} Check whether the effect is expressed in absolute or relative terms, and what the confidence interval does to it.`,
    );
  }

  if (sections.conclusions) {
    const claim = firstSentence(sections.conclusions);
    points.push(
      `The authors conclude: ${claim} Decide whether the design and the numbers actually support a claim that strong.`,
    );
    questions.push(
      `The paper concludes ${claim.replace(/[.!?]$/, "")} — what would have to be true of these patients for that to hold for yours?`,
    );
  }

  if (sections.methods) {
    questions.push(
      `Reading the methods, which single decision would most change the result if it had gone the other way?`,
    );
  }

  questions.push(
    design.canSupportCausality
      ? `Randomisation removes confounding, so what is left: are the enrolled patients like the ones you see, and is the primary endpoint one they would care about?`
      : `Nothing here was randomised, so what unmeasured difference between the groups could produce this result on its own?`,
  );

  // The floor. These still name this paper rather than sitting there as filler.
  const fallbackPoints = [
    `Published in ${journal || "an unnamed journal"}${year ? ` in ${year}` : ""}. Where a paper appears shapes who has already read it and which conclusions the field has quietly accepted.`,
    `Read the title as a claim: "${title.replace(/\.$/, "")}". Ask what evidence would be needed to state it that plainly, and whether this paper supplies it.`,
    `The abstract is not the paper. Before discussing, note which numbers you would need from the full text to judge the conclusion.`,
  ];
  const fallbackQuestions = [
    `If you were designing the follow-up study to this one, what would you change first?`,
    `Does this change anything you would do on Monday, and if not, what is missing?`,
    `Which patients in your own practice does this paper simply not speak to?`,
  ];

  for (const point of fallbackPoints) {
    if (points.length >= 3) break;
    points.push(point);
  }
  for (const question of fallbackQuestions) {
    if (questions.length >= 3) break;
    questions.push(question);
  }

  return { design, points, questions };
}
