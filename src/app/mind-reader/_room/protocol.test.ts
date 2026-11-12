import { describe, expect, it } from "vitest";
import { isRoomCode, newRoomCode, parseRoomMessage, roomChannel } from "./protocol";

describe("room codes", () => {
  it("are five characters with nothing that reads two ways aloud", () => {
    for (let i = 0; i < 200; i++) {
      const code = newRoomCode(Math.random);
      expect(code).toMatch(/^[A-Z2-9]{5}$/);
      expect(code).not.toMatch(/[ILO01]/);
      expect(isRoomCode(code)).toBe(true);
    }
  });

  it("turns away anything else, so a code can go straight into a channel name", () => {
    for (const bad of ["", "abcde", "ABCD", "ABCDEF", "AB:DE", "ABC0E", "*"]) {
      expect(isRoomCode(bad)).toBe(false);
    }
  });

  it("scopes each room to its own channel", () => {
    expect(roomChannel("K7QX3")).toBe("mind-reader:K7QX3");
  });
});

describe("parseRoomMessage", () => {
  const view = {
    phase: "playing",
    round: 2,
    guessed: 1,
    stumped: 0,
    lastOutcome: "guessed",
    remainingMs: 120_000,
    paused: false,
    role: null,
  };

  it("accepts the three messages a room carries", () => {
    expect(parseRoomMessage({ t: "view", view })).toEqual({ t: "view", view });
    expect(parseRoomMessage({ t: "ask", ask: "pause" })).toEqual({ t: "ask", ask: "pause" });
    expect(parseRoomMessage({ t: "hello" })).toEqual({ t: "hello" });
  });

  it("drops junk and anything asking for a move player B isn't allowed", () => {
    expect(parseRoomMessage(null)).toBeNull();
    expect(parseRoomMessage({ t: "ask", ask: "deal" })).toBeNull();
    expect(parseRoomMessage({ t: "ask", ask: "next" })).toBeNull();
    expect(parseRoomMessage({ t: "view", view: { ...view, remainingMs: -1 } })).toBeNull();
    expect(parseRoomMessage({ t: "view", view: { ...view, phase: "lobby" } })).toBeNull();
  });
});
