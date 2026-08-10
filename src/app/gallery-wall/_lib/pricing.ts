/**
 * A rough print-cost estimate for a wall.
 *
 * Prices are Blacks' matte photo-print list prices in CAD, read from
 * blacks.ca on 2026-07-28. They are a snapshot of somebody else's price list,
 * so treat the total as a ballpark for budgeting, not a quote -- prices change,
 * finishes cost more, and taxes and shipping are not included.
 *
 * The two small sizes are the volume rate (Blacks quotes those at 100+ prints),
 * which is why they look so cheap next to the enlargements.
 */

/** Price per print in CAD, keyed by the frame size ids in `frames.ts`. */
export const PRINT_PRICES_CAD: Readonly<Record<string, number>> = {
  "4x6": 0.14,
  "5x7": 0.2,
  "8x10": 5.49,
  "11x14": 11.69,
  "16x20": 22.19,
  "18x24": 28.09,
  "24x36": 37.59,
};

/** Where the numbers came from, so the UI can say so. */
export const PRICE_SOURCE = {
  vendor: "Blacks",
  url: "https://www.blacks.ca/en/products/photo-prints/photoenlargement/",
  currency: "CAD",
  checkedOn: "2026-07-28",
} as const;

export type PriceEstimate = {
  /** Total for every photo we have a price for. */
  total: number;
  /** How many photos are included in that total. */
  priced: number;
  /** Frame size ids we have no price for, so the UI can be honest about it. */
  unpriced: string[];
};

/**
 * Add up the print cost for a wall. Sizes with no listed price are counted in
 * `unpriced` rather than guessed at, so the total is never quietly wrong.
 */
export function estimatePrintCost(sizeIds: readonly string[]): PriceEstimate {
  return sizeIds.reduce<PriceEstimate>(
    (estimate, sizeId) => {
      const price = PRINT_PRICES_CAD[sizeId];
      if (price === undefined) {
        return estimate.unpriced.includes(sizeId)
          ? estimate
          : { ...estimate, unpriced: [...estimate.unpriced, sizeId] };
      }
      return {
        ...estimate,
        total: Math.round((estimate.total + price) * 100) / 100,
        priced: estimate.priced + 1,
      };
    },
    { total: 0, priced: 0, unpriced: [] },
  );
}

/** Format a CAD amount for display. */
export const formatCad = (amount: number): string => `$${amount.toFixed(2)}`;

/**
 * Combined sales tax by Canadian province or territory (GST + PST/QST, or HST),
 * as of 2026-07-28. Blacks is a Canadian retailer, so anywhere else we show the
 * pre-tax total and say we don't know the rate rather than inventing one.
 */
const TAX_RATES: Readonly<Record<string, number>> = {
  alberta: 0.05,
  "british columbia": 0.12,
  manitoba: 0.12,
  "new brunswick": 0.15,
  "newfoundland and labrador": 0.15,
  "northwest territories": 0.05,
  "nova scotia": 0.14,
  nunavut: 0.05,
  ontario: 0.13,
  "prince edward island": 0.15,
  quebec: 0.14975,
  québec: 0.14975,
  saskatchewan: 0.11,
  yukon: 0.05,
};

export type TaxLookup = {
  /** Combined rate, or null when we have no rate for this place. */
  rate: number | null;
  /** The region the rate belongs to, for display. */
  region: string | null;
};

/**
 * The sales tax rate for a location. Returns a null rate outside Canada, or for
 * a Canadian region we don't recognise, so the UI can say so plainly.
 */
export function taxRateFor(
  location: { country?: string | null; regionName?: string | null } | null,
): TaxLookup {
  if (!location?.country || !location.regionName)
    return { rate: null, region: null };
  const country = location.country.trim().toLowerCase();
  if (country !== "canada" && country !== "ca")
    return { rate: null, region: null };
  const region = location.regionName.trim();
  const rate = TAX_RATES[region.toLowerCase()];
  return rate === undefined ? { rate: null, region } : { rate, region };
}

/** Apply a tax rate to a subtotal, rounded to cents. */
export function withTax(subtotal: number, rate: number): number {
  return Math.round(subtotal * (1 + rate) * 100) / 100;
}
