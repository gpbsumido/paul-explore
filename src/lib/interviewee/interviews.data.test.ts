import { describe, it, expect } from "vitest";
import { interviewSchema } from "./types";
import {
  INTERVIEWS,
  interviewById,
  topicInInterview,
  relatedTopicsInInterview,
} from "./interviews.data";

/**
 * The deck is organised by interview, so the invariants live at both levels: an
 * interview points at real topics, and a topic's related ids resolve within its
 * own interview. These are the checks that let me paste a fresh batch of prep
 * notes in and know every page still resolves.
 */
describe("interviewee interviews data", () => {
  it("parses every interview against the schema", () => {
    for (const interview of INTERVIEWS) {
      expect(() => interviewSchema.parse(interview)).not.toThrow();
    }
  });

  it("gives every interview a unique id", () => {
    const ids = INTERVIEWS.map((i) => i.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("includes the Sardine hiring-manager interview", () => {
    const sardine = interviewById("sardine-2-hiring-manager");
    expect(sardine?.title).toBe("Sardine Interview 2: Hiring manager");
    expect(sardine!.topics.length).toBeGreaterThan(0);
  });

  it("gives every topic a unique id within its interview", () => {
    for (const interview of INTERVIEWS) {
      const ids = interview.topics.map((t) => t.id);
      expect(new Set(ids).size, interview.id).toBe(ids.length);
    }
  });

  it("only relates a topic to another topic in the same interview", () => {
    for (const interview of INTERVIEWS) {
      const ids = new Set(interview.topics.map((t) => t.id));
      for (const topic of interview.topics) {
        for (const related of topic.related) {
          expect(ids.has(related), `${interview.id}/${topic.id} -> ${related}`).toBe(
            true,
          );
        }
      }
    }
  });

  it("never relates a topic to itself", () => {
    for (const interview of INTERVIEWS) {
      for (const topic of interview.topics) {
        expect(topic.related).not.toContain(topic.id);
      }
    }
  });

  it("gives every topic at least one question with at least one point", () => {
    for (const interview of INTERVIEWS) {
      for (const topic of interview.topics) {
        expect(topic.entries.length, `${interview.id}/${topic.id}`).toBeGreaterThan(0);
        for (const entry of topic.entries) {
          expect(entry.points.length).toBeGreaterThan(0);
        }
      }
    }
  });
});

describe("interview lookup helpers", () => {
  it("finds an interview by id", () => {
    const first = INTERVIEWS[0];
    expect(interviewById(first.id)).toEqual(first);
  });

  it("returns undefined for an unknown interview id", () => {
    expect(interviewById("not-a-real-interview")).toBeUndefined();
  });

  it("finds a topic within an interview", () => {
    const interview = INTERVIEWS[0];
    const topic = interview.topics[0];
    expect(topicInInterview(interview, topic.id)).toEqual(topic);
  });

  it("resolves related ids to real topics in the same interview, in order", () => {
    const interview = INTERVIEWS.find((i) =>
      i.topics.some((t) => t.related.length > 0),
    );
    expect(interview).toBeDefined();
    const topic = interview!.topics.find((t) => t.related.length > 0)!;
    const resolved = relatedTopicsInInterview(interview!, topic);
    expect(resolved.map((t) => t.id)).toEqual(topic.related);
  });
});
