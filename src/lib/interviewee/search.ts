import type { Interview, IntervieweeTopic } from "./types";

/** A topic that matched a search, with the interview it belongs to. */
export type TopicHit = {
  interviewId: string;
  interviewTitle: string;
  topic: IntervieweeTopic;
  /** How shallow the match is: 0 title, 1 summary, 2 question, 3 point/detail. Lower is more relevant. */
  rank: number;
};

/**
 * The searchable text of a topic in widening tiers, so a match can be scored by
 * how shallow it is. Tier 0 is just the title; each tier folds in the next-less-
 * prominent field. Every string is lowercased once so matching is a plain
 * substring check.
 */
function tiers(interview: Interview, topic: IntervieweeTopic): string[] {
  const title = topic.title.toLowerCase();
  const summary = [topic.summary, interview.title, interview.summary]
    .join(" ")
    .toLowerCase();
  const questions = topic.entries.map((e) => e.question).join(" ").toLowerCase();
  const deep = topic.entries
    .flatMap((e) => [...e.points, ...(e.details ?? [])])
    .join(" ")
    .toLowerCase();
  return [title, `${title} ${summary}`, `${title} ${summary} ${questions}`,
    `${title} ${summary} ${questions} ${deep}`];
}

/**
 * The shallowest tier whose text contains every term, or -1 if the deepest tier
 * still doesn't (not a hit). A title-only match ranks 0; a match that only
 * surfaces in a bullet point ranks 3, so titles float to the top.
 */
function rankOf(tierTexts: string[], terms: string[]): number {
  for (let tier = 0; tier < tierTexts.length; tier++) {
    if (terms.every((term) => tierTexts[tier].includes(term))) return tier;
  }
  return -1;
}

/**
 * Find every topic whose text matches the query, across all interviews, ranked
 * so title matches come before ones buried in a detail.
 *
 * The query is split on whitespace and every term must appear somewhere in the
 * topic's text (AND), so "profile INP" narrows rather than widens. An empty or
 * whitespace-only query matches nothing — the caller shows the interviews
 * instead of an unfiltered dump. Results are sorted by rank, then by document
 * order, so the ordering is stable.
 */
export function searchInterviewTopics(
  interviews: Interview[],
  query: string,
): TopicHit[] {
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (terms.length === 0) return [];

  const hits: Array<TopicHit & { order: number }> = [];
  let order = 0;
  for (const interview of interviews) {
    for (const topic of interview.topics) {
      const rank = rankOf(tiers(interview, topic), terms);
      if (rank !== -1) {
        hits.push({
          interviewId: interview.id,
          interviewTitle: interview.title,
          topic,
          rank,
          order: order,
        });
      }
      order += 1;
    }
  }

  return hits
    .sort((a, b) => a.rank - b.rank || a.order - b.order)
    .map(({ order: _order, ...hit }) => hit);
}
