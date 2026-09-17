/**
 * The key a topic's answered state is stored under. Topic ids are only unique
 * within an interview, so the answered store is keyed by both — otherwise a
 * "testing" topic in one interview would share its reviewed state with a
 * "testing" topic in another.
 */
export const answeredKey = (interviewId: string, topicId: string): string =>
  `${interviewId}/${topicId}`;
