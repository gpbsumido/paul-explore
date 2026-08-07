/**
 * The models the ask box may use.
 *
 * Three, deliberately: enough to trade cost against depth, few enough that the
 * choice is obvious. Anything not on this list is rejected server-side, so a
 * crafted request can't point the account's credit at an expensive model
 * nobody chose.
 */
export type AskModelId = "gpt-4o-mini" | "gpt-4.1" | "gpt-5";

export type AskModel = {
  id: AskModelId;
  label: string;
  /** What it is good for, in the terms the choice actually turns on. */
  note: string;
  recommended: boolean;
};

export const ASK_MODELS: AskModel[] = [
  {
    id: "gpt-4o-mini",
    label: "Quick",
    note: "Cheapest and fastest. Fine for summarising or looking something up in the abstract; noticeably vaguer when asked to judge a study's weaknesses.",
    recommended: false,
  },
  {
    id: "gpt-4.1",
    label: "Balanced",
    note: "Strong enough for critical appraisal at a fraction of the top-tier cost. The right default for journal club questions.",
    recommended: true,
  },
  {
    id: "gpt-5",
    label: "Deepest",
    note: "Best reasoning, highest cost and latency. Worth it for a question you would otherwise take to a supervisor.",
    recommended: false,
  },
];

export const RECOMMENDED_MODEL: AskModelId =
  ASK_MODELS.find((m) => m.recommended)?.id ?? "gpt-4.1";

/** Server-side guard: only a listed id may be sent upstream. */
export function isAskModel(value: unknown): value is AskModelId {
  return ASK_MODELS.some((m) => m.id === value);
}
