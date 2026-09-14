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

/** A pending ask to join a budget. Delivered across accounts once there is a
 * backend; for now it lives in the same store the owner reads. */
export const joinRequestSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
  createdAt: z.string(),
});
export type JoinRequest = z.infer<typeof joinRequestSchema>;

/**
 * The whole shared budget as it lives in one storage key. The sharing fields
 * carry `.default()` so a budget stored before they existed still loads instead
 * of being thrown away and reset.
 */
export const budgetSchema = z.object({
  people: z.array(personSchema).min(1),
  activePersonId: z.string(),
  cycleStartDay: z.number().int().min(1).max(28),
  expenses: z.array(expenseSchema),
  visibility: z.enum(["private", "public"]).default("private"),
  ownerEmail: z.string().optional(),
  joinRequests: z.array(joinRequestSchema).default([]),
});
export type Budget = z.infer<typeof budgetSchema>;
