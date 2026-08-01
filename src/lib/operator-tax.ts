// ---------------------------------------------------------------------------
// Canadian sales tax: GST/HST/PST/QST rates by province, tax breakdowns, and
// per-month remittance history. Operators are assumed to be in Canada.
//
// Rates as of 2026. Three regimes:
//   - HST provinces charge a single combined rate (gst/pst are 0).
//   - GST-only provinces charge the 5% federal rate and nothing provincial.
//   - GST+PST provinces charge the 5% federal rate plus a provincial rate
//     (Quebec's QST of 9.975% sits in the pst slot).
// ---------------------------------------------------------------------------

import type { Sale, ProvinceCode } from "@/types/operator";

export type ProvinceTaxRate = {
  name: string;
  gst: number;
  pst: number;
  hst: number;
};

export const PROVINCE_TAX: Record<ProvinceCode, ProvinceTaxRate> = {
  AB: { name: "Alberta", gst: 0.05, pst: 0, hst: 0 },
  BC: { name: "British Columbia", gst: 0.05, pst: 0.07, hst: 0 },
  MB: { name: "Manitoba", gst: 0.05, pst: 0.07, hst: 0 },
  NB: { name: "New Brunswick", gst: 0, pst: 0, hst: 0.15 },
  NL: { name: "Newfoundland and Labrador", gst: 0, pst: 0, hst: 0.15 },
  NS: { name: "Nova Scotia", gst: 0, pst: 0, hst: 0.14 },
  NT: { name: "Northwest Territories", gst: 0.05, pst: 0, hst: 0 },
  NU: { name: "Nunavut", gst: 0.05, pst: 0, hst: 0 },
  ON: { name: "Ontario", gst: 0, pst: 0, hst: 0.13 },
  PE: { name: "Prince Edward Island", gst: 0, pst: 0, hst: 0.15 },
  QC: { name: "Quebec", gst: 0.05, pst: 0.09975, hst: 0 },
  SK: { name: "Saskatchewan", gst: 0.05, pst: 0.06, hst: 0 },
  YT: { name: "Yukon", gst: 0.05, pst: 0, hst: 0 },
} as const;

export type ProvinceTax = ProvinceTaxRate & { code: ProvinceCode };

export type TaxBreakdown = {
  subtotal: number;
  gst: number;
  pst: number;
  hst: number;
  taxTotal: number;
  total: number;
};

export type TaxHistoryRow = TaxBreakdown & { period: string };

export type RemittanceOwed = {
  federalOwed: number;
  provincialOwed: number;
  totalOwed: number;
};

/**
 * Returns the rate config for a province with its code attached, so callers
 * have the code, human name, and rates in one object.
 */
export function getProvinceTax(code: ProvinceCode): ProvinceTax {
  return { code, ...PROVINCE_TAX[code] };
}

/** Rounds a currency value to the nearest cent. */
function toCents(value: number): number {
  return Math.round(value * 100) / 100;
}

/**
 * Computes the tax breakdown for a subtotal in a given province. Each component
 * (GST, PST/QST, HST) is rounded to the cent independently, then summed, which
 * matches how a real invoice itemizes and totals the taxes.
 */
export function computeTax(
  subtotal: number,
  code: ProvinceCode,
): TaxBreakdown {
  const rate = PROVINCE_TAX[code];
  const gst = toCents(subtotal * rate.gst);
  const pst = toCents(subtotal * rate.pst);
  const hst = toCents(subtotal * rate.hst);
  const taxTotal = toCents(gst + pst + hst);
  return {
    subtotal,
    gst,
    pst,
    hst,
    taxTotal,
    total: toCents(subtotal + taxTotal),
  };
}

/** The YYYY-MM period a timestamp falls in, in UTC. */
function periodOf(timestamp: string): string {
  return timestamp.slice(0, 7);
}

/**
 * Rolls sales up into per-month remittance rows, newest period first. Each row
 * sums the period's sale totals into a subtotal and computes the tax owed on it
 * for the given province.
 */
export function buildTaxHistory(
  sales: readonly Sale[],
  code: ProvinceCode,
  _now: Date = new Date(),
): readonly TaxHistoryRow[] {
  const subtotalByPeriod = new Map<string, number>();
  for (const sale of sales) {
    const period = periodOf(sale.timestamp);
    subtotalByPeriod.set(
      period,
      (subtotalByPeriod.get(period) ?? 0) + sale.total,
    );
  }

  return [...subtotalByPeriod.entries()]
    .sort(([a], [b]) => (a < b ? 1 : a > b ? -1 : 0))
    .map(([period, rawSubtotal]) => {
      const subtotal = toCents(rawSubtotal);
      return { period, ...computeTax(subtotal, code) };
    });
}

/**
 * Totals the tax the operator has collected and must remit across every period,
 * split into the federal portion (GST/HST, remitted to the CRA) and the
 * provincial portion (PST/QST, remitted to the province).
 */
export function summarizeRemittance(
  history: readonly TaxHistoryRow[],
): RemittanceOwed {
  let federalOwed = 0;
  let provincialOwed = 0;
  for (const row of history) {
    federalOwed += row.gst + row.hst;
    provincialOwed += row.pst;
  }
  federalOwed = toCents(federalOwed);
  provincialOwed = toCents(provincialOwed);
  return {
    federalOwed,
    provincialOwed,
    totalOwed: toCents(federalOwed + provincialOwed),
  };
}
