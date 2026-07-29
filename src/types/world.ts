// Shared types for the /world explorable Toronto scene. The whole game core is
// pure data-in data-out, so everything here is readonly.

export type Vec2 = {
  readonly x: number;
  readonly z: number;
};

// Axis-aligned box on the ground plane, center + half extents. Matches how
// buildings are laid out, so the same data drives meshes and collision.
export type RectCollider = {
  readonly x: number;
  readonly z: number;
  readonly halfX: number;
  readonly halfZ: number;
};

export type PlayerState = {
  readonly position: Vec2;
  // Units per second in world space.
  readonly velocity: Vec2;
  // Y rotation in radians. 0 faces +z, matching atan2(v.x, v.z), so the avatar
  // group can use it directly as rotation.y.
  readonly heading: number;
  // Height above the ground and vertical speed, for jumping.
  readonly y: number;
  readonly vy: number;
};

// Camera-space move intent: x is strafe (right positive), z is forward/back
// (forward negative, matching the screen "up = away" convention).
export type MoveInput = {
  readonly x: number;
  readonly z: number;
  readonly running: boolean;
  readonly jump: boolean;
};

export type WorldExhibit = {
  // Must match a FeatureItem id in src/app/_shared/featureData.tsx — the
  // exhibit pulls its title, color, and href from there.
  readonly featureId: string;
  // The real Toronto landmark this exhibit lives at.
  readonly landmark: string;
  // One-line placard blurb, written for the world (not the hub description).
  readonly blurb: string;
  readonly position: Vec2;
  // The main exhibition gets the grand treatment (bigger ring, banner, star
  // on the minimap). Exactly one exhibit carries this.
  readonly featured?: boolean;
};
