// Wardrobe for the explorer. Team looks are color schemes only — shapes and
// numbers, no logos. Exposed skin uses the shared skin tone.

export const SKIN_TONE = "#ffdfc2";

export type Outfit = {
  readonly id: string;
  readonly label: string;
  readonly cap: string;
  readonly capBrim: string;
  // Small round mark on the cap front.
  readonly capMark: string;
  readonly jersey: string;
  readonly jerseyTrim: string;
  // Upper-arm color; the skin tone reads as a sleeveless jersey.
  readonly sleeve: string;
  readonly hands: string;
  readonly shorts: string;
  // Lower leg: skin for shorts looks, fabric for baseball pants.
  readonly calves: string;
  readonly shoes: string;
  readonly number?: string;
  readonly numberColor?: string;
  // Swatch dot in the HUD picker.
  readonly accent: string;
};

export const OUTFITS: readonly Outfit[] = [
  {
    id: "blue-jays",
    label: "Blue Jays",
    cap: "#134a8e",
    capBrim: "#0d356b",
    capMark: "#ffffff",
    jersey: "#134a8e",
    jerseyTrim: "#ffffff",
    sleeve: "#134a8e",
    hands: SKIN_TONE,
    shorts: "#e8e8e6",
    calves: "#e8e8e6",
    shoes: "#23272f",
    accent: "#134a8e",
  },
  {
    id: "raptors",
    label: "Raptors",
    cap: "#0b0b0e",
    capBrim: "#ce1141",
    capMark: "#c4ced4",
    jersey: "#ce1141",
    jerseyTrim: "#0b0b0e",
    sleeve: SKIN_TONE,
    hands: SKIN_TONE,
    shorts: "#0b0b0e",
    calves: SKIN_TONE,
    shoes: "#f5f0e8",
    number: "6",
    numberColor: "#ffffff",
    accent: "#ce1141",
  },
  {
    id: "tempo",
    label: "Tempo",
    cap: "#5b2d8c",
    capBrim: "#43206a",
    capMark: "#e11d48",
    jersey: "#5b2d8c",
    jerseyTrim: "#e11d48",
    sleeve: SKIN_TONE,
    hands: SKIN_TONE,
    shorts: "#43206a",
    calves: SKIN_TONE,
    shoes: "#f5f0e8",
    number: "26",
    numberColor: "#ffffff",
    accent: "#5b2d8c",
  },
  {
    id: "spurs-wemby",
    label: "Wemby",
    cap: "#0b0b0e",
    capBrim: "#23272f",
    capMark: "#c4ced4",
    jersey: "#c4ced4",
    jerseyTrim: "#0b0b0e",
    sleeve: SKIN_TONE,
    hands: SKIN_TONE,
    shorts: "#0b0b0e",
    calves: SKIN_TONE,
    shoes: "#0b0b0e",
    number: "1",
    numberColor: "#0b0b0e",
    accent: "#c4ced4",
  },
];

export const outfitById = (id: string | null): Outfit =>
  OUTFITS.find((o) => o.id === id) ?? OUTFITS[0];
