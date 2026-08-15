import { describe, it, expect } from "vitest";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { BAND_VALUES } from "./accentBand";
import { join, relative, sep } from "node:path";

const SRC = join(process.cwd(), "src");

/**
 * The archived landing generations are history exhibits behind /discover's
 * archive banner. Their stock-Tailwind look IS the exhibit — retuning them
 * would erase the thing the archive is there to show.
 */
const ARCHIVE = [
  "src/app/LandingContent.tsx",
  "src/app/landing/",
  "src/app/v2/",
  "src/app/v3/",
];

/**
 * Colour that encodes identity or a published convention, not design language.
 * Retuning any of these is a bug wearing a retune's clothes: a Lakers purple,
 * a water-type blue and a Web Vitals red all mean something specific.
 */
const IDENTITY = [
  "src/lib/nbaTeamColors.ts",
  "src/lib/graphql.ts",
  "src/lib/tcg.ts",
  "src/lib/vitals.ts",
  "src/app/world/outfits.ts",
  "src/app/world/skyPresets.ts",
  "src/lib/world/seasons.ts",
  "src/app/settings/SettingsContent.tsx",
];

/**
 * 3D scene art direction — building materials, foliage, weather. A world
 * restyle is its own change, not part of applying the page design language.
 */
const SCENE_ART = [
  "src/app/world/Landmarks.tsx",
  "src/app/world/CityScene.tsx",
  "src/app/world/Player.tsx",
  "src/app/world/Raccoons.tsx",
  "src/app/world/Collectibles.tsx",
  "src/app/world/Weather.tsx",
  "src/app/world/Trail.tsx",
  "src/app/world/GhostPlayer.tsx",
  "src/app/world/RemoteExplorers.tsx",
  "src/app/world/Exhibits.tsx",
  "src/app/world/ExhibitVignettes.tsx",
  "src/app/world/textures.ts",
];

/**
 * Write-ups that quote a colour inside a prose code sample. The hex is the
 * subject of the sentence, not a style on the page.
 */
const PROSE = [
  "src/app/thoughts/v2-redesign/V2RedesignContent.tsx",
  "src/app/thoughts/styling/StylingContent.tsx",
  "src/app/thoughts/landing-page/LandingChat.tsx",
  "src/app/thoughts/design-system-charts/DesignSystemChartsContent.tsx",
  "src/app/design-system/catalog.ts",
];

const EXCLUDED = [...ARCHIVE, ...IDENTITY, ...SCENE_ART, ...PROSE];

/**
 * Every stock Tailwind colour family. `neutral` is deliberately absent: the app
 * overrides that name in its own `@theme`, so `neutral-500` is the warm grey
 * from tokens.css, not Tailwind's.
 *
 * The first cut of this list missed red, green, yellow and orange, which left
 * blocks half-converted -- a token success bar next to a stock red one is worse
 * than either on its own.
 */
const STOCK_UTILITY =
  /-(blue|violet|indigo|sky|purple|slate|rose|amber|emerald|cyan|teal|fuchsia|pink|lime|red|green|yellow|orange|gray|zinc|stone)-\d{2,3}\b/;

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) return walk(full);
    return [full];
  });
}

function liveSourceFiles(): string[] {
  return walk(SRC)
    .filter((file) => /\.(ts|tsx|css)$/.test(file))
    .filter((file) => !/\.(test|spec)\.(ts|tsx)$/.test(file))
    .map((file) => relative(process.cwd(), file).split(sep).join("/"))
    .filter((file) => !EXCLUDED.some((skip) => file.startsWith(skip)));
}

/**
 * Every hex the design tokens themselves define — the three identity ramps, the
 * semantic surfaces and the feature accents. Read from the stylesheet rather
 * than copied, so adding a token never means updating this test.
 */
function tokenHexes(): Set<string> {
  const css = readFileSync(join(SRC, "styles/tokens.css"), "utf8");
  return new Set(
    (css.match(/#[0-9a-fA-F]{6}\b/g) ?? []).map((hex) => hex.toLowerCase()),
  );
}

/** The tone band, the same one `thoughtColors.test.ts` pins the registry into. */
function inToneBand(hex: string): boolean {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  const d = max - min;
  const s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1));
  return s >= 0.24 && s <= 0.68 && l >= 0.33 && l <= 0.62;
}

/**
 * A hex literal on a live surface has to be a colour the palette accounts for:
 * a token value, one of the named band accents, or any other hue that sits in
 * the tone band. Hue is free -- it is the identity of whatever is being
 * coloured -- so the band, not the named list, is the real contract. The
 * registry accents are the reason: there are far more of them than there are
 * names, and they are all legitimately in band.
 *
 * Black and white pass because they are used as overlay and mask endpoints
 * rather than as colour.
 */
function isOffPalette(hex: string, tokens: Set<string>): boolean {
  const value = hex.toLowerCase();
  if (value === "#000000" || value === "#ffffff") return false;
  if (tokens.has(value)) return false;
  if ((BAND_VALUES as readonly string[]).includes(value)) return false;
  return !inToneBand(value);
}

/**
 * The retune only holds if nothing quietly reintroduces the stock palette. This
 * reads the real source rather than a registry, because the surfaces that were
 * off-palette were exactly the ones no registry covered.
 */
describe("live surfaces carry the palette", () => {
  it("uses no stock Tailwind colour utilities", () => {
    const offenders = liveSourceFiles().flatMap((file) =>
      readFileSync(join(process.cwd(), file), "utf8")
        .split("\n")
        .map((line, index) => ({ line, number: index + 1 }))
        .filter(({ line }) => STOCK_UTILITY.test(line))
        .map(({ line, number }) => `${file}:${number} ${line.trim()}`),
    );

    expect(offenders).toEqual([]);
  });

  it("writes no hex literal outside the palette", () => {
    const tokens = tokenHexes();
    const offenders = liveSourceFiles()
      .filter((file) => file !== "src/styles/tokens.css")
      .filter((file) => file !== "src/app/globals.css")
      .flatMap((file) =>
        readFileSync(join(process.cwd(), file), "utf8")
          .split("\n")
          .flatMap((line, index) =>
            (line.match(/#[0-9a-fA-F]{6}\b/g) ?? [])
              .filter((hex) => isOffPalette(hex, tokens))
              .map((hex) => `${file}:${index + 1} ${hex}`),
          ),
      );

    expect(offenders).toEqual([]);
  });
});
