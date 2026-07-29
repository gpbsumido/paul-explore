// Mutable channels shared between the DOM HUD and the R3F render loop. Plain
// refs, not state — they change every frame and must never trigger re-renders.

export type PlayerSnapshot = {
  x: number;
  z: number;
  heading: number;
};

export type JoystickState = {
  x: number;
  z: number;
};
