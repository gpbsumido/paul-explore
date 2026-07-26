/** Query text plus which visible row the keyboard cursor sits on. */
export type PaletteState = {
  query: string;
  activeIndex: number;
};

export type PaletteAction =
  | { type: "SET_QUERY"; query: string }
  /** Step the cursor by `delta`, wrapping within `count` visible results. */
  | { type: "MOVE"; delta: number; count: number }
  | { type: "RESET" };

export const initialPaletteState: PaletteState = { query: "", activeIndex: 0 };

/**
 * Pure reducer for the palette's query and active-row cursor. Typing resets the
 * cursor to the top; MOVE wraps around both ends of the current result count and
 * stays put when there are no results.
 */
export function paletteReducer(
  state: PaletteState,
  action: PaletteAction,
): PaletteState {
  switch (action.type) {
    case "SET_QUERY":
      return { query: action.query, activeIndex: 0 };
    case "MOVE": {
      if (action.count <= 0) return { ...state, activeIndex: 0 };
      const next =
        (((state.activeIndex + action.delta) % action.count) + action.count) %
        action.count;
      return { ...state, activeIndex: next };
    }
    case "RESET":
      return initialPaletteState;
  }
}
