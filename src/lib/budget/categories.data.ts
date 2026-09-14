import type { Budget } from "./types";

/** A budget category. The id is stable and stored on each expense. */
export type Category = { id: string; label: string; emoji: string };

/**
 * The preset categories. A fixed set is enough for the fast-add flow, and the
 * emoji doubles as the tap target's icon so the grid reads at a glance.
 */
export const CATEGORIES: readonly Category[] = [
  { id: "food", label: "Food", emoji: "\u{1F354}" },
  { id: "groceries", label: "Groceries", emoji: "\u{1F6D2}" },
  { id: "entertainment", label: "Fun", emoji: "\u{1F3AC}" },
  { id: "school", label: "School", emoji: "\u{1F393}" },
  { id: "transport", label: "Transport", emoji: "\u{1F686}" },
  { id: "rent", label: "Rent", emoji: "\u{1F3E0}" },
  { id: "health", label: "Health", emoji: "\u{1F48A}" },
  { id: "other", label: "Other", emoji: "\u{1F4E6}" },
] as const;

/** Look a category up by id, falling back to "Other" for an unknown one. */
export const categoryById = (id: string): Category =>
  CATEGORIES.find((c) => c.id === id) ?? CATEGORIES[CATEGORIES.length - 1];

/** Tags a visitor can attach while adding, and later filter on. */
export const PRESET_TAGS: readonly string[] = [
  "necessary",
  "unnecessary",
  "recurring",
];

/** The person every budget starts with, before anyone else is added. */
const STARTER_PERSON = { id: "p-you", name: "You" };

/** A fresh budget for a browser that has never logged anything. */
export const STARTER_BUDGET: Budget = {
  people: [STARTER_PERSON],
  activePersonId: STARTER_PERSON.id,
  cycleStartDay: 1,
  expenses: [],
  visibility: "private",
  joinRequests: [],
};
