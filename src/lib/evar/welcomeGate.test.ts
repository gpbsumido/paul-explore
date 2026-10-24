import { describe, it, expect, vi } from "vitest";
import { WELCOME_GATE_SCRIPT, WELCOME_PATH, hasBeenWelcomed, markWelcomed } from "./welcomeGate";

/** A browser with these keys in storage, or storage that throws. */
const browser = (stored: Record<string, string> | "blocked") => {
  const replace = vi.fn();
  const localStorage =
    stored === "blocked"
      ? {
          getItem: () => {
            throw new Error("blocked");
          },
        }
      : { getItem: (key: string) => stored[key] ?? null };
  return { window: { localStorage, location: { replace } }, replace };
};

/** Runs the inline script the practice page ships, against a stub window. */
const runGate = (win: unknown) => new Function("window", WELCOME_GATE_SCRIPT)(win);

describe("the welcome gate script", () => {
  it("sends a first visit to the welcome page", () => {
    const { window, replace } = browser({});
    runGate(window);
    expect(replace).toHaveBeenCalledWith(WELCOME_PATH);
    expect(WELCOME_PATH).toBe("/evar/welcome");
  });

  it("lets someone who has seen the welcome page straight in", () => {
    const { window, replace } = browser({ "evar-welcomed": "true" });
    runGate(window);
    expect(replace).not.toHaveBeenCalled();
  });

  it("counts the old study popup's answer as having been welcomed", () => {
    const { window, replace } = browser({ "evar-study-asked": "true" });
    runGate(window);
    expect(replace).not.toHaveBeenCalled();
  });

  it("never redirects when storage is blocked, so nobody gets stuck on the welcome page", () => {
    const { window, replace } = browser("blocked");
    expect(() => runGate(window)).not.toThrow();
    expect(replace).not.toHaveBeenCalled();
  });
});

describe("hasBeenWelcomed and markWelcomed", () => {
  it("agree with the script", () => {
    expect(hasBeenWelcomed({ getItem: () => null })).toBe(false);
    expect(hasBeenWelcomed({ getItem: (k) => (k === "evar-welcomed" ? "true" : null) })).toBe(true);
    expect(hasBeenWelcomed({ getItem: (k) => (k === "evar-study-asked" ? "true" : null) })).toBe(true);
    expect(
      hasBeenWelcomed({
        getItem: () => {
          throw new Error("blocked");
        },
      }),
    ).toBe(true);
  });

  it("marks this browser as welcomed, and shrugs off storage that throws", () => {
    const setItem = vi.fn();
    markWelcomed({ setItem });
    expect(setItem).toHaveBeenCalledWith("evar-welcomed", "true");
    expect(() =>
      markWelcomed({
        setItem: () => {
          throw new Error("blocked");
        },
      }),
    ).not.toThrow();
  });
});
