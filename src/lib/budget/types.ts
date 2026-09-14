import { z } from "zod";

/**
 * The budget domain, kept deliberately small. There is no server behind this
 * yet (see the write-up): a visitor's budget lives in their own browser. Money
 * is stored as integer cents so nothing rounds under a float, and an expense is
 * attributed to a single person for now. Splitting one item across people is a
 * later feature, which is why attribution is a plain personId rather than a
 * splits array today.
 */

/** Someone the budget is shared with. Just a label in the local model. */
export const personSchema = z.object({
  id: z.string(),
  name: z.string(),
});
export type Person = z.infer<typeof personSchema>;

/** A single logged spend. */
export const expenseSchema = z.object({
  id: z.string(),
  categoryId: z.string(),
  amountCents: z.number().int().positive(),
  occurredAt: z.string(),
  personId: z.string(),
  tags: z.array(z.string()),
  note: z.string().optional(),
});
export type Expense = z.infer<typeof expenseSchema>;

/** The whole shared budget as it lives in one storage key. */
export const budgetSchema = z.object({
  people: z.array(personSchema).min(1),
  activePersonId: z.string(),
  cycleStartDay: z.number().int().min(1).max(28),
  expenses: z.array(expenseSchema),
});
export type Budget = z.infer<typeof budgetSchema>;
