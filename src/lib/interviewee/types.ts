import { z } from "zod";

/**
 * The shape of the interviewee deck. Everything the pages render is fed from
 * this, so a markdown file of prep notes can be transformed straight into a
 * `topics.data.ts` and the site picks it up. The schema is the trust boundary:
 * `topics.data.test.ts` parses every topic against it, so a malformed paste
 * fails a test rather than a page.
 *
 * See TOPICS_TEMPLATE.md for the markdown format the data is transformed from.
 */

/** One interview question and how I want to answer it. */
export const intervieweeEntrySchema = z.object({
  /** The question or prompt, as it might be asked. */
  question: z.string().min(1),
  /** The headline answer, as bullet points. Always shown. */
  points: z.array(z.string().min(1)).min(1),
  /** Deeper detail, tucked behind an expandable disclosure. Optional. */
  details: z.array(z.string().min(1)).optional(),
});
export type IntervieweeEntry = z.infer<typeof intervieweeEntrySchema>;

/** A topic card on the deck, and the page it opens. */
export const intervieweeTopicSchema = z.object({
  /** URL slug and stable id, e.g. "system-design". */
  id: z
    .string()
    .min(1)
    .regex(/^[a-z0-9-]+$/, "id must be a lowercase slug"),
  /** Card title. */
  title: z.string().min(1),
  /** One line shown on the card and under the topic heading. */
  summary: z.string().min(1),
  /** The questions, in the order I'd rehearse them. */
  entries: z.array(intervieweeEntrySchema).min(1),
  /** Ids of sibling topics to surface as cards on the topic page. */
  related: z.array(z.string().min(1)).default([]),
});
export type IntervieweeTopic = z.infer<typeof intervieweeTopicSchema>;
