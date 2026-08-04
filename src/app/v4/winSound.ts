/**
 * The win jingle, synthesised rather than sampled.
 *
 * A square-wave arpeggio through the Web Audio API costs no network request, no
 * binary in the repo, and sounds like the arcade cabinet the confetti is
 * pretending to be. An mp3 of a real slot machine would be a payload, a licence
 * question, and a worse match for the visuals.
 *
 * The jingle plays a beat *after* the spin, from a timeout, not straight from
 * the click. On a phone that matters: iOS leaves an AudioContext born outside a
 * user gesture suspended forever, so a context made at jingle time never makes
 * a sound. So the context is opened and resumed once, synchronously, inside the
 * spin click (`unlockWinAudio`), then reused when the jingle finally fires. It
 * is a no-op when the user has muted it or the API is unavailable.
 */

export const SOUND_PREF_KEY = "v4-win-sound";

/** Whether the jingle should play. Defaults to on; the toggle persists off. */
export function soundEnabled(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(SOUND_PREF_KEY) !== "off";
  } catch {
    return true;
  }
}

/** Persist the preference. */
export function setSoundEnabled(on: boolean): void {
  try {
    window.localStorage.setItem(SOUND_PREF_KEY, on ? "on" : "off");
  } catch {
    // A blocked localStorage is not worth failing a sound toggle over.
  }
}

/** A rising major arpeggio, then the octave -- the classic payout shape. */
const NOTES = [523.25, 659.25, 783.99, 1046.5];

type AudioCtor = typeof AudioContext;

// One context for the life of the page, opened during a gesture and kept
// running. Making a fresh one per win is what left mobile silent, and closing
// it between wins would just re-lock it.
let shared: AudioContext | null = null;

function audioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (shared && shared.state !== "closed") return shared;
  const Ctor: AudioCtor | undefined =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: AudioCtor }).webkitAudioContext;
  shared = Ctor ? new Ctor() : null;
  return shared;
}

/**
 * Open and resume the audio context from inside the spin click, so the jingle
 * that fires a couple of seconds later plays on a context the browser already
 * trusts. Without this the win is silent on iOS. Safe to call every spin; a
 * no-op when muted or unsupported, and never throws.
 */
export function unlockWinAudio(): void {
  if (!soundEnabled()) return;
  try {
    const ctx = audioContext();
    if (ctx && ctx.state === "suspended") void ctx.resume();
  } catch {
    // A decoration failing to arm is not worth breaking the spin over.
  }
}

/**
 * Play the jingle. Silent when muted or unsupported; never throws, because a
 * decoration failing is not worth breaking the spin over.
 */
export function playWinSound(): void {
  if (!soundEnabled()) return;

  try {
    const ctx = audioContext();
    if (!ctx) return;
    // Resume again in case the unlock never ran (e.g. the user muted, then
    // unmuted, then this win landed without a fresh spin gesture).
    if (ctx.state === "suspended") void ctx.resume();

    const now = ctx.currentTime;
    const master = ctx.createGain();
    // Quiet by default: this fires unprompted after a spin, so it should read
    // as a chime from across the room, not a notification in your ear.
    master.gain.value = 0.07;
    master.connect(ctx.destination);

    NOTES.forEach((freq, i) => {
      const at = now + i * 0.075;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      // Square wave: the 8-bit timbre that matches the pixel confetti.
      osc.type = "square";
      osc.frequency.setValueAtTime(freq, at);
      gain.gain.setValueAtTime(0, at);
      gain.gain.linearRampToValueAtTime(1, at + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, at + 0.22);
      osc.connect(gain);
      gain.connect(master);
      osc.start(at);
      osc.stop(at + 0.24);
    });

    // A final shimmer on the octave, a beat after the run finishes.
    const tail = ctx.createOscillator();
    const tailGain = ctx.createGain();
    const tailAt = now + NOTES.length * 0.075 + 0.04;
    tail.type = "square";
    tail.frequency.setValueAtTime(NOTES[NOTES.length - 1] * 2, tailAt);
    tailGain.gain.setValueAtTime(0, tailAt);
    tailGain.gain.linearRampToValueAtTime(0.6, tailAt + 0.01);
    tailGain.gain.exponentialRampToValueAtTime(0.001, tailAt + 0.4);
    tail.connect(tailGain);
    tailGain.connect(master);
    tail.start(tailAt);
    tail.stop(tailAt + 0.42);

    // The context is deliberately left open and running: it is the one the
    // gesture unlocked, and closing it would re-lock mobile for the next win.
  } catch {
    // A win chime failing is never worth breaking the spin over.
  }
}
