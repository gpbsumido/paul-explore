import { describe, it, expect } from "vitest";
import { intervieweeTopicSchema } from "./types";
import { TOPICS, topicById, relatedTopics } from "./topics.data";

/**
 * The deck is only as trustworthy as its data: a topic that points at a related
 * id that doesn't exist would render a dead card, and a duplicate id would make
 * two topics fight over one URL. These are the checks that let me paste a fresh
 * batch of prep notes in and know the pages still resolve.
 */
describe("interviewee topics data", () => {
  it("parses every topic against the schema", () => {
    for (const topic of TOPICS) {
      expect(() => intervieweeTopicSchema.parse(topic)).not.toThrow();
    }
  });

  it("has enough topics to be a deck worth opening", () => {
    expect(TOPICS.length).toBeGreaterThanOrEqual(4);
  });

  it("gives every topic a unique id", () => {
    const ids = TOPICS.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("only relates topics to ones that actually exist", () => {
    const ids = new Set(TOPICS.map((t) => t.id));
    for (const topic of TOPICS) {
      for (const related of topic.related) {
        expect(ids.has(related), `${topic.id} -> ${related}`).toBe(true);
      }
    }
  });

  it("never relates a topic to itself", () => {
    for (const topic of TOPICS) {
      expect(topic.related).not.toContain(topic.id);
    }
  });

  it("gives every topic at least one question to answer", () => {
    for (const topic of TOPICS) {
      expect(topic.entries.length).toBeGreaterThan(0);
      for (const entry of topic.entries) {
        expect(entry.points.length).toBeGreaterThan(0);
      }
    }
  });
});

describe("topic lookup helpers", () => {
  it("finds a topic by id", () => {
    const first = TOPICS[0];
    expect(topicById(first.id)).toEqual(first);
  });

  it("returns undefined for an unknown id", () => {
    expect(topicById("not-a-real-topic")).toBeUndefined();
  });

  it("resolves a topic's related ids to real topics, skipping any that vanished", () => {
    const withRelated = TOPICS.find((t) => t.related.length > 0);
    expect(withRelated).toBeDefined();
    const resolved = relatedTopics(withRelated!);
    expect(resolved.map((t) => t.id)).toEqual(withRelated!.related);
  });
});
