import type { Interview, IntervieweeTopic } from "./types";

/** A topic that matched a search, with the interview it belongs to. */
export type TopicHit = {
  interviewId: string;
  interviewTitle: string;
  topic: IntervieweeTopic;
};

/**
 * Everything about a topic that a search should look through: the interview it
 * sits in, the topic's own title and summary, and every question, point, and
 * expandable detail. Joined and lowercased once so matching is a plain substring
 * check.
 */
function haystack(interview: Interview, topic: IntervieweeTopic): string {
  return [
    interview.title,
    interview.summary,
    topic.title,
    topic.summary,
    ...topic.entries.flatMap((entry) => [
      entry.question,
      ...entry.points,
      ...(entry.details ?? []),
    ]),
  ]
    .join(" ")
    .toLowerCase();
}

/**
 * Find every topic whose text matches the query, across all interviews.
 *
 * The query is split on whitespace and every term must appear somewhere in the
 * topic's text (AND), so "profile INP" narrows rather than widens. An empty or
 * whitespace-only query matches nothing — the caller shows the interviews
 * instead of an unfiltered dump. Order follows the data: interviews then their
 * topics, so results are stable and grouped.
 */
export function searchInterviewTopics(
  interviews: Interview[],
  query: string,
): TopicHit[] {
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (terms.length === 0) return [];

  const hits: TopicHit[] = [];
  for (const interview of interviews) {
    for (const topic of interview.topics) {
      const hay = haystack(interview, topic);
      if (terms.every((term) => hay.includes(term))) {
        hits.push({
          interviewId: interview.id,
          interviewTitle: interview.title,
          topic,
        });
      }
    }
  }
  return hits;
}
