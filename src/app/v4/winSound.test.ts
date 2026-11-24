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
  /** Closes the underlying context, the way a browser can under memory pressure. */
  closeNow: () => void;
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
      closeNow: () => {
        void this.close();
      },
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
    this.record.state = "closed";
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
    vi.restoreAllMocks();
    Reflect.deleteProperty(
      window as unknown as Record<string, unknown>,
      "webkitAudioContext",
    );
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

  it("resumes a suspended context at jingle time when the unlock never ran", async () => {
    const { playWinSound } = await loadSound();

    playWinSound();

    expect(built).toHaveLength(1);
    expect(built[0].resumes).toBeGreaterThan(0);
  });

  it("plays the four-note run plus the shimmer on the octave", async () => {
    const { playWinSound } = await loadSound();

    playWinSound();

    expect(built[0].oscillatorsStarted).toBe(5);
  });

  it("builds a fresh context once the shared one has been closed", async () => {
    const { unlockWinAudio, playWinSound } = await loadSound();
    unlockWinAudio();
    built[0].closeNow();

    playWinSound();

    expect(built).toHaveLength(2);
    expect(built[1].oscillatorsStarted).toBeGreaterThan(0);
  });

  it("falls back to webkitAudioContext on older Safari", async () => {
    vi.stubGlobal("AudioContext", undefined);
    Object.defineProperty(window, "webkitAudioContext", {
      value: FakeAudioContext,
      configurable: true,
    });
    const { playWinSound } = await loadSound();

    playWinSound();

    expect(built).toHaveLength(1);
    expect(built[0].oscillatorsStarted).toBeGreaterThan(0);
  });

  it("never throws when the browser refuses to build a context", async () => {
    vi.stubGlobal(
      "AudioContext",
      class {
        constructor() {
          throw new Error("blocked by autoplay policy");
        }
      },
    );
    const { unlockWinAudio, playWinSound } = await loadSound();

    expect(() => {
      unlockWinAudio();
      playWinSound();
    }).not.toThrow();
  });
});

describe("sound preference", () => {
  beforeEach(() => {
    window.localStorage.clear();
    installAudio();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("is on until the visitor turns it off", async () => {
    const { soundEnabled } = await loadSound();

    expect(soundEnabled()).toBe(true);
  });

  it("remembers a mute across page loads, and an unmute undoes it", async () => {
    const first = await loadSound();
    first.setSoundEnabled(false);

    const afterReload = await loadSound();
    expect(afterReload.soundEnabled()).toBe(false);

    afterReload.setSoundEnabled(true);
    expect(afterReload.soundEnabled()).toBe(true);
  });

  it("stays on, and the toggle does not throw, when localStorage is blocked", async () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("storage blocked");
    });
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("storage blocked");
    });
    const { soundEnabled, setSoundEnabled } = await loadSound();

    expect(() => setSoundEnabled(false)).not.toThrow();
    expect(soundEnabled()).toBe(true);
  });
});
