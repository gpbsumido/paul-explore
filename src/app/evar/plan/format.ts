const cadCents = new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" });
const cadWhole = new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD", maximumFractionDigits: 0 });
const cadRate = new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD", minimumFractionDigits: 4 });
const usdShort = new Intl.NumberFormat("en-CA", { style: "currency", currency: "USD", minimumFractionDigits: 0, maximumFractionDigits: 3 });
const whole = new Intl.NumberFormat("en-CA", { maximumFractionDigits: 0 });
const oneDecimal = new Intl.NumberFormat("en-CA", { maximumFractionDigits: 1 });
const twoDecimals = new Intl.NumberFormat("en-CA", { maximumFractionDigits: 2 });
const longDate = new Intl.DateTimeFormat("en-CA", { dateStyle: "long", timeZone: "UTC" });

/** Canadian dollars to the cent, like `$1,348.94`. */
export const cad = (n: number) => cadCents.format(n);

/** Canadian dollars rounded to the dollar, for prose like "about $99 a year". */
export const cadRounded = (n: number) => cadWhole.format(n);

/** An exchange rate to four places, like `$1.3993`. */
export const rate = (n: number) => cadRate.format(n);

/** A US list price as written on the price list, like `US$5` or `US$0.025`. */
export const usd = (n: number) => usdShort.format(n);

/** A count with thousands separators, like `300,000`. */
export const count = (n: number) => whole.format(n);

/** Hours, to a decimal place only when there is one. */
export const hours = (n: number) => `${oneDecimal.format(n)} ${n === 1 ? "hour" : "hours"}`;

/** A size in gigabytes as MB under one GB, like `705 MB` or `7.05 GB`. */
export const size = (gb: number) => (gb < 1 ? `${whole.format(gb * 1000)} MB` : `${twoDecimals.format(gb)} GB`);

/** A number of months the way it's said: "1 month", "1 year and 6 months", "2 years". */
export function duration(months: number): string {
  const years = Math.floor(months / 12);
  const rest = months % 12;
  const y = years === 0 ? "" : years === 1 ? "1 year" : `${years} years`;
  const m = rest === 0 ? "" : rest === 1 ? "1 month" : `${rest} months`;
  return [y, m].filter(Boolean).join(" and ");
}

/** An ISO date as "October 23, 2026". */
export const checkedOn = (iso: string) => longDate.format(new Date(`${iso}T00:00:00Z`));
