/**
 * The rules of The Mind Reader as plain TypeScript.
 *
 * Nothing here knows about Svelte or React. The component owns the screen and
 * the ticking interval; this file owns what a round is allowed to do next, so
 * the whole game can be tested without rendering anything. Every function is
 * pure: the clock and the dice are passed in rather than read.
 */

import { ROLES, type CategoryId, type Role } from "./roles.data";

export const ROUND_MS = 5 * 60 * 1000;

export type CategoryFilter = CategoryId | "all";

export type Phase = "setup" | "secret" | "playing" | "reveal";

export type GameState = {
  phase: Phase;
  category: CategoryFilter;
  role: Role | null;
  seen: readonly string[];
  round: number;
  guessed: number;
  stumped: number;
  /** How the last finished round ended, for the reveal screen. */
  lastOutcome: "guessed" | "stumped" | null;
  /** Wall-clock ms when the round runs out. Null until play starts. */
  endsAt: number | null;
  /** Ms left at the moment of pausing. Null whenever the clock is running. */
  pausedRemaining: number | null;
};

export type Action =
  | { type: "setCategory"; category: CategoryFilter }
  | { type: "deal"; random: () => number }
  | { type: "redraw"; random: () => number }
  | { type: "start"; now: number }
  | { type: "pause"; now: number }
  | { type: "resume"; now: number }
  | { type: "guessed" }
  | { type: "giveUp" }
  | { type: "timeUp" }
  | { type: "next"; random: () => number };

export const initialState = (): GameState => ({
  phase: "setup",
  category: "all",
  role: null,
  seen: [],
  round: 1,
  guessed: 0,
  stumped: 0,
  lastOutcome: null,
  endsAt: null,
  pausedRemaining: null,
});

/**
 * Picks a role nobody has been dealt yet. Once every role in the chosen
 * category has been seen, that category's ids are forgotten and the deck
 * reshuffles, so a long evening never runs dry.
 */
export function drawRole({
  category,
  seen,
  random,
}: {
  category: CategoryFilter;
  seen: readonly string[];
  random: () => number;
}): { role: Role; seen: readonly string[] } {
  const pool = ROLES.filter((r) => category === "all" || r.category === category);
  const fresh = pool.filter((r) => !seen.includes(r.id));
  const candidates = fresh.length > 0 ? fresh : pool;
  const kept =
    fresh.length > 0 ? seen : seen.filter((id) => !pool.some((r) => r.id === id));
  const role = candidates[Math.floor(random() * candidates.length)];
  return { role, seen: [...kept, role.id] };
}

const deal = (state: GameState, random: () => number): GameState => {
  const draw = drawRole({ category: state.category, seen: state.seen, random });
  return { ...state, role: draw.role, seen: draw.seen };
};

const finish = (state: GameState, outcome: "guessed" | "stumped"): GameState =>
  state.phase !== "playing"
    ? state
    : {
        ...state,
        phase: "reveal",
        endsAt: null,
        pausedRemaining: null,
        lastOutcome: outcome,
        [outcome]: state[outcome] + 1,
      };

/** The one place a transition is decided. Invalid moves return the state as is. */
export function reduce(state: GameState, action: Action): GameState {
  switch (action.type) {
    case "setCategory":
      return state.phase === "setup" || state.phase === "secret"
        ? { ...state, category: action.category }
        : state;
    case "deal":
      return state.phase === "setup"
        ? { ...deal(state, action.random), phase: "secret" }
        : state;
    case "redraw":
      return state.phase === "secret" ? deal(state, action.random) : state;
    case "start":
      return state.phase === "secret"
        ? {
            ...state,
            phase: "playing",
            endsAt: action.now + ROUND_MS,
            pausedRemaining: null,
          }
        : state;
    case "pause":
      return state.phase === "playing" &&
        state.endsAt !== null &&
        state.pausedRemaining === null
        ? {
            ...state,
            endsAt: null,
            pausedRemaining: Math.max(0, state.endsAt - action.now),
          }
        : state;
    case "resume":
      return state.phase === "playing" && state.pausedRemaining !== null
        ? {
            ...state,
            endsAt: action.now + state.pausedRemaining,
            pausedRemaining: null,
          }
        : state;
    case "guessed":
      return finish(state, "guessed");
    case "giveUp":
    case "timeUp":
      return finish(state, "stumped");
    case "next":
      return state.phase === "reveal"
        ? { ...deal(state, action.random), phase: "secret", round: state.round + 1 }
        : state;
  }
}

/** Ms left on the round clock, clamped at zero. */
export function remainingMs(state: GameState, now: number): number {
  if (state.pausedRemaining !== null) return state.pausedRemaining;
  if (state.endsAt === null) return ROUND_MS;
  return Math.max(0, state.endsAt - now);
}

/** m:ss, rounding partial seconds up so 0:00 only shows when time is truly up. */
export function formatClock(ms: number): string {
  const total = Math.ceil(ms / 1000);
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}
