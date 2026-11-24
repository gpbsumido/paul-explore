import { FEATURES } from "@/app/_shared/featureData.data";

/**
 * What the v6 landing shows, by hub feature id. Each list is its own curation
 * and order, but they all resolve through featureFor, so a feature that gets
 * renamed fails loudly instead of quietly dropping off the page.
 */

// Every feature that has a captured preview, so the hero gallery shows the whole
// body of work rather than a curated handful.
export const HERO_IMAGE_IDS = [
  "work-portfolio", "design-system", "operator", "world", "vitals", "flags",
  "pokemon", "particles", "research", "learn", "budget", "fantasy-nba",
  "gallery-wall", "craft", "zeroproof", "calendar",
];

// Every feature with a capture. Each tile shows the app, is named after it, and
// links to its write-up where one exists (or the app itself), so the screenshot,
// the hovered title, and the destination all agree.
export const TILE_IDS = [
  "design-system",
  "operator",
  "world",
  "vitals",
  "flags",
  "work-portfolio",
  "pokemon",
  "particles",
  "research",
  "learn",
  "budget",
  "fantasy-nba",
  "gallery-wall",
  "craft",
  "zeroproof",
  "calendar",
];

// The about band's photo stack: three screens that between them show the range,
// a dense operator dashboard, the design system and a 3D world.
export const PHOTO_STACK_IDS = ["operator", "design-system", "world"];

export const PROJECT_PICKS = [
  { id: "work-portfolio", category: "Interfaces", note: "From shipped product to hands-on demo.", caption: "Product work", number: "01" },
  { id: "design-system", category: "Systems", note: "The building blocks behind everything here.", caption: "Design × engineering", number: "02" },
  { id: "world", category: "Play", note: "Take the scenic route through a tiny Toronto.", caption: "An explorable world", number: "03" },
  { id: "operator", category: "Interfaces", note: "A retail fleet, with every detail one click away.", caption: "Tools for real decisions", number: "04" },
  { id: "flags", category: "Systems", note: "Ship it. Roll it out. Keep a way back.", caption: "Release control", number: "05" },
  { id: "vitals", category: "Systems", note: "This site’s performance, measured in the wild.", caption: "The reality check", number: "06" },
  { id: "pokemon", category: "Play", note: "Three little apps sharing one Pokémon dataset.", caption: "Data, three ways", number: "07" },
  { id: "particles", category: "Play", note: "A constellation that leans toward your cursor.", caption: "A physics toy", number: "08" },
  { id: "research", category: "Interfaces", note: "A reader for the papers I keep going back to.", caption: "Papers, organized", number: "09" },
  { id: "learn", category: "Interfaces", note: "Notes and demos from things I taught myself.", caption: "Self-taught, in public", number: "10" },
  { id: "budget", category: "Systems", note: "Envelopes and forecasts for money that moves.", caption: "Money, planned", number: "11" },
  { id: "fantasy-nba", category: "Play", note: "A whole NBA season, read through real box scores.", caption: "Fantasy, with data", number: "12" },
  { id: "gallery-wall", category: "Play", note: "Frame your photos and print the hang sheet before a nail goes in.", caption: "A wall, measured", number: "13" },
  { id: "zeroproof", category: "Systems", note: "Sports betting with the loss taken out.", caption: "A ledger you can't lose", number: "14" },
  { id: "calendar", category: "Interfaces", note: "Events, countdowns, and a month you can actually plan in.", caption: "Time, laid out", number: "15" },
];

/** The hub entry behind an id. An id naming no feature is a typo, so say which. */
export function featureFor(id: string) {
  const feature = FEATURES.find((item) => item.id === id);
  if (!feature) throw new Error(`The v6 landing picks "${id}", which isn't in FEATURES`);
  return feature;
}
