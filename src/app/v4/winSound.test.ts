import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

/**
 * The mobile bug these tests pin down: the jingle used to build a fresh
 * AudioContext inside the post-spin timeout, well outside the click that
 * started the spin. On iOS that context is born suspended and never plays. The
 * fix unlocks one context during the gesture and reuses it, so the tests count
 * contexts and check the gesture actually resumes one.
 */

type Ctx = {
  state: string;
  currentTime: number;
  destination: object;
  resumes: number;
  oscillatorsStarted: number;
};

const built: Ctx[] = [];

class FakeParam {
  value = 0;
  setValueAtTime() {}
  linearRampToValueAtTime() {}
  exponentialRampToValueAtTime() {}
}

class FakeAudioContext {
  state = "suspended";
  currentTime = 0;
  destination = {};
  private record: Ctx;

  constructor() {
    this.record = {
      state: this.state,
      currentTime: 0,
      destination: this.destination,
      resumes: 0,
      oscillatorsStarted: 0,
    };
    built.push(this.record);
  }

  createGain() {
    return { gain: new FakeParam(), connect() {} };
  }

  createOscillator() {
    const rec = this.record;
    return {
      type: "square",
      frequency: new FakeParam(),
      connect() {},
      start() {
        rec.oscillatorsStarted += 1;
      },
      stop() {},
    };
  }

  resume() {
    this.state = "running";
    this.record.state = "running";
    this.record.resumes += 1;
    return Promise.resolve();
  }

  close() {
    this.state = "closed";
    return Promise.resolve();
  }
}

const installAudio = () => {
  built.length = 0;
  vi.stubGlobal("AudioContext", FakeAudioContext);
  Reflect.deleteProperty(
    window as unknown as Record<string, unknown>,
    "webkitAudioContext",
  );
};

const loadSound = async () => {
  vi.resetModules();
  return import("./winSound");
};

describe("winSound", () => {
  beforeEach(() => {
    window.localStorage.clear();
    installAudio();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("unlocks the audio context during the gesture, so a later jingle is not born suspended", async () => {
    const { unlockWinAudio } = await loadSound();

    unlockWinAudio();

    expect(built).toHaveLength(1);
    expect(built[0].resumes).toBeGreaterThan(0);
    expect(built[0].state).toBe("running");
  });

  it("reuses the gesture-unlocked context to play, not a fresh suspended one", async () => {
    const { unlockWinAudio, playWinSound } = await loadSound();

    unlockWinAudio();
    playWinSound();

    // The whole point of the fix: one context, opened in the gesture and reused
    // when the jingle fires. A second context here would be the mobile bug.
    expect(built).toHaveLength(1);
    expect(built[0].oscillatorsStarted).toBeGreaterThan(0);
  });

  it("stays silent and opens no context when the user has muted it", async () => {
    const { unlockWinAudio, playWinSound, setSoundEnabled } = await loadSound();
    setSoundEnabled(false);

    unlockWinAudio();
    playWinSound();

    expect(built).toHaveLength(0);
  });

  it("never throws when Web Audio is unavailable", async () => {
    vi.stubGlobal("AudioContext", undefined);
    Reflect.deleteProperty(
      window as unknown as Record<string, unknown>,
      "webkitAudioContext",
    );
    const { unlockWinAudio, playWinSound } = await loadSound();

    expect(() => {
      unlockWinAudio();
      playWinSound();
    }).not.toThrow();
  });
});
