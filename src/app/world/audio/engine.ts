"use client";

import type { AmbienceMix } from "@/lib/world/soundscape";

// Everything you hear is generated in the browser: filtered noise for traffic,
// waves and rain, a couple of detuned oscillators for the streetcar, short
// bursts for footsteps. No audio files, so nothing to download, license, or
// keep in the repo.

const RAMP = 0.35;

/** A few seconds of white noise to loop as the base of every airy sound. */
function makeNoiseBuffer(context: AudioContext): AudioBuffer {
  const seconds = 4;
  const buffer = context.createBuffer(1, context.sampleRate * seconds, context.sampleRate);
  const channel = buffer.getChannelData(0);
  for (let i = 0; i < channel.length; i += 1) {
    channel[i] = Math.random() * 2 - 1;
  }
  return buffer;
}

type NoiseChannel = {
  readonly gain: GainNode;
  readonly source: AudioBufferSourceNode;
  readonly filter: BiquadFilterNode;
};

function createNoiseChannel(
  context: AudioContext,
  destination: AudioNode,
  options: { type: BiquadFilterType; frequency: number; q?: number },
  buffer: AudioBuffer,
): NoiseChannel {
  const source = context.createBufferSource();
  source.buffer = buffer;
  source.loop = true;
  const filter = context.createBiquadFilter();
  filter.type = options.type;
  filter.frequency.value = options.frequency;
  if (options.q !== undefined) filter.Q.value = options.q;
  const gain = context.createGain();
  gain.gain.value = 0;
  source.connect(filter).connect(gain).connect(destination);
  source.start();
  return { gain, source, filter };
}

export type WorldAudio = {
  setMix(mix: AmbienceMix): void;
  footstep(): void;
  jump(): void;
  chime(): void;
  setMuted(muted: boolean): void;
  dispose(): void;
};

/**
 * Builds the soundscape. Must be called from a user gesture — browsers refuse
 * to start an AudioContext otherwise.
 */
export function createWorldAudio(): WorldAudio | null {
  const Ctor =
    typeof window === "undefined"
      ? undefined
      : window.AudioContext ??
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;

  const context = new Ctor();
  // Contexts are born suspended; without this nothing is ever audible even
  // though the whole graph is running.
  void context.resume();
  const master = context.createGain();
  master.gain.value = 0.7;
  master.connect(context.destination);

  const noise = makeNoiseBuffer(context);

  // Traffic: low rumble with a slow swell so it never sits perfectly still.
  const city = createNoiseChannel(context, master, { type: "lowpass", frequency: 380 }, noise);
  // Waves: a band around the hiss of water, breathing in and out.
  const waves = createNoiseChannel(context, master, { type: "bandpass", frequency: 620, q: 0.7 }, noise);
  // Rain: brighter, denser hiss.
  const rain = createNoiseChannel(context, master, { type: "highpass", frequency: 1400 }, noise);

  const swell = context.createOscillator();
  swell.frequency.value = 0.08;
  const swellDepth = context.createGain();
  swellDepth.gain.value = 120;
  swell.connect(swellDepth).connect(city.filter.frequency);
  swell.start();

  const waveSwell = context.createOscillator();
  waveSwell.frequency.value = 0.19;
  const waveDepth = context.createGain();
  waveDepth.gain.value = 180;
  waveSwell.connect(waveDepth).connect(waves.filter.frequency);
  waveSwell.start();

  // Streetcar: two slightly detuned saws through a lowpass, which is most of
  // the way to an electric motor.
  const carGain = context.createGain();
  carGain.gain.value = 0;
  const carFilter = context.createBiquadFilter();
  carFilter.type = "lowpass";
  carFilter.frequency.value = 700;
  carFilter.connect(carGain).connect(master);
  const carOscillators = [88, 91.5].map((frequency) => {
    const osc = context.createOscillator();
    osc.type = "sawtooth";
    osc.frequency.value = frequency;
    osc.connect(carFilter);
    osc.start();
    return osc;
  });

  const rampTo = (param: AudioParam, value: number) => {
    param.cancelScheduledValues(context.currentTime);
    param.setTargetAtTime(value, context.currentTime, RAMP);
  };

  /** A short burst of filtered noise — the shape of a footstep or a landing. */
  const burst = (frequency: number, duration: number, level: number) => {
    const source = context.createBufferSource();
    source.buffer = noise;
    source.loop = true;
    const filter = context.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.value = frequency;
    filter.Q.value = 1.4;
    const gain = context.createGain();
    gain.gain.setValueAtTime(level, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + duration);
    source.connect(filter).connect(gain).connect(master);
    source.start();
    source.stop(context.currentTime + duration + 0.02);
  };

  return {
    setMix(mix) {
      rampTo(city.gain.gain, mix.city * 0.55);
      rampTo(waves.gain.gain, mix.waves * 0.6);
      rampTo(rain.gain.gain, mix.rain * 0.32);
      rampTo(carGain.gain, mix.streetcar * 0.22);
    },
    footstep() {
      burst(700 + Math.random() * 260, 0.09, 0.15);
    },
    jump() {
      burst(1500, 0.16, 0.11);
    },
    chime() {
      const osc = context.createOscillator();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(880, context.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1320, context.currentTime + 0.12);
      const gain = context.createGain();
      gain.gain.setValueAtTime(0.2, context.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.45);
      osc.connect(gain).connect(master);
      osc.start();
      osc.stop(context.currentTime + 0.5);
    },
    setMuted(muted) {
      // Unmuting can happen long after the page loaded, by which point the
      // browser may have suspended us again.
      if (!muted) void context.resume();
      rampTo(master.gain, muted ? 0 : 0.7);
    },
    dispose() {
      [city.source, waves.source, rain.source].forEach((source) => source.stop());
      carOscillators.forEach((osc) => osc.stop());
      swell.stop();
      waveSwell.stop();
      void context.close();
    },
  };
}
