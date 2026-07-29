import type { WorldExhibit } from "@/types/world";

// Each feature gets a booth at the Toronto landmark that suits it best. The
// positions are in world units on the same grid as cityLayout.ts — keep them
// on sidewalks and plazas, never inside a collider (the integrity tests check).
export const EXHIBITS: readonly WorldExhibit[] = [
  {
    featureId: "particles",
    landmark: "CN Tower",
    blurb: "The tower's LED show, bottled — an interactive particle network you can steer.",
    position: { x: -38, z: 37 },
  },
  {
    featureId: "fantasy-nba",
    landmark: "Scotiabank Arena",
    blurb: "Home of the Raptors: bracket picks, live player stats, and a public leaderboard.",
    position: { x: 6, z: 40 },
  },
  {
    featureId: "work-portfolio",
    landmark: "Union Station",
    blurb: "Every commute ends somewhere — rebuilt features from a decade of past products.",
    position: { x: -14, z: 31.5 },
  },
  {
    featureId: "calendar",
    landmark: "Nathan Phillips Square",
    blurb: "The city square keeps the schedule: a four-view calendar backed by Postgres.",
    position: { x: -18, z: -16.5 },
  },
  {
    featureId: "vitals",
    landmark: "Yonge-Dundas Square",
    blurb: "Big screens, real numbers — Core Web Vitals from every page load, P75'd.",
    position: { x: 28, z: -27 },
  },
  {
    featureId: "design-system",
    landmark: "OCAD Sharp Centre",
    blurb: "Design school in the sky: the shared component library, rendered live.",
    position: { x: -44, z: -17.5 },
  },
  {
    featureId: "gallery-wall",
    landmark: "Art Gallery of Ontario",
    blurb: "Hang your own exhibition — photos auto-framed onto a wall, rendered to scale.",
    position: { x: -50, z: -23.5 },
  },
  {
    featureId: "pokemon",
    landmark: "Kensington Market",
    blurb: "The market stalls trade cards: TCG browser, Pocket expansions, and a Pokédex.",
    position: { x: -66, z: -48 },
  },
  {
    featureId: "operator",
    landmark: "St. Lawrence Market",
    blurb: "A market runs on logistics — manage a smart-store retail fleet in real time.",
    position: { x: 56, z: 31.5 },
  },
  {
    featureId: "craft",
    landmark: "Gooderham Flatiron",
    blurb: "Built in 1892, still standing: the traits of a lead front-end dev, with receipts.",
    position: { x: 50, z: 24.5 },
  },
  {
    featureId: "flags",
    landmark: "Queen's Park",
    blurb: "Where toggles become law — a feature-flag console with rollouts and audit logs.",
    position: { x: -30, z: -64 },
  },
  {
    featureId: "learn",
    landmark: "University of Toronto",
    blurb: "Lecture hall optional: interactive deep-dives into algorithms and patterns.",
    position: { x: 0, z: -68 },
  },
];
