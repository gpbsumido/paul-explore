/**
 * What it would cost to run EVAR Sizing on its own domain, worked out from
 * each company's list price on one date and converted to Canadian dollars.
 *
 * Every number the plan page prints comes from here. The prices sit in one
 * table beside the page each was read from, so updating them means this file
 * and nothing else, and the page never types a figure of its own.
 */

/** The day every price below was read off its source, and the exchange rate's date. */
export const PRICES_CHECKED = "2026-10-23";

export type Source = { id: string; label: string; href: string };

export const SOURCES: readonly Source[] = [
  { id: "boc", label: "Bank of Canada, daily exchange rates", href: "https://www.bankofcanada.ca/rates/exchange/daily-exchange-rates/" },
  { id: "s3", label: "Amazon S3 pricing, Canada (Central)", href: "https://aws.amazon.com/s3/pricing/" },
  { id: "cloudfront", label: "Amazon CloudFront, pay-as-you-go pricing", href: "https://aws.amazon.com/cloudfront/pricing/pay-as-you-go/" },
  { id: "cloudfrontFlat", label: "Amazon CloudFront, flat-rate plans", href: "https://aws.amazon.com/cloudfront/pricing/" },
  { id: "railway", label: "Railway pricing", href: "https://railway.com/pricing" },
  { id: "vercelHobby", label: "Vercel, the Hobby plan", href: "https://vercel.com/docs/plans/hobby" },
  { id: "vercel", label: "Vercel pricing", href: "https://vercel.com/pricing" },
  { id: "auth0", label: "Auth0 pricing", href: "https://auth0.com/pricing" },
  { id: "domainCom", label: "Cloudflare Registrar, .com (domainoffer.net)", href: "https://domainoffer.net/tld/com/cloudflare" },
  { id: "domainCa", label: "Cloudflare Registrar, .ca (domainoffer.net)", href: "https://domainoffer.net/tld/ca/cloudflare" },
  { id: "domainOrg", label: "Cloudflare Registrar, .org (domainoffer.net)", href: "https://domainoffer.net/tld/org/cloudflare" },
  { id: "emailRouting", label: "Cloudflare Email Routing", href: "https://developers.cloudflare.com/email-routing/" },
  { id: "workspace", label: "Google Workspace pricing, Canada", href: "https://workspace.google.com/pricing" },
  { id: "waterloo", label: "University of Waterloo, research ethics review fee", href: "https://uwaterloo.ca/research/office-research-ethics/research-ethics-review-fee" },
  { id: "knops", label: "Knöps et al., EVAR sizing with open source software, Annals of Vascular Surgery 2021", href: "https://doi.org/10.1016/j.avsg.2020.08.126" },
  { id: "avt", label: "AVT, the Aortic Vessel Tree CTA collection (CC BY 4.0)", href: "https://doi.org/10.6084/m9.figshare.14806362" },
];

type Price = { value: number; sourceId: string };

/**
 * List prices and plan limits, as the source states them. Amounts are US
 * dollars unless the key ends in `Cad`.
 */
export const PRICES = {
  cadPerUsd: { value: 1.3993, sourceId: "boc" },
  s3PerGbMonth: { value: 0.025, sourceId: "s3" },
  cloudfrontFreeGb: { value: 1000, sourceId: "cloudfront" },
  cloudfrontPerGb: { value: 0.085, sourceId: "cloudfront" },
  cloudfrontFlatPro: { value: 15, sourceId: "cloudfrontFlat" },
  cloudfrontFlatProTb: { value: 50, sourceId: "cloudfrontFlat" },
  railwayHobby: { value: 5, sourceId: "railway" },
  railwayPro: { value: 20, sourceId: "railway" },
  railwayMemoryPerGbMonth: { value: 10, sourceId: "railway" },
  railwayCpuPerVcpuMonth: { value: 20, sourceId: "railway" },
  railwayDiskPerGbMonth: { value: 0.15, sourceId: "railway" },
  vercelHobbyCalls: { value: 1_000_000, sourceId: "vercelHobby" },
  vercelHobbyCpuHours: { value: 4, sourceId: "vercelHobby" },
  vercelHobbyTransferGb: { value: 100, sourceId: "vercelHobby" },
  vercelPro: { value: 20, sourceId: "vercel" },
  auth0FreeMonthlyUsers: { value: 25_000, sourceId: "auth0" },
  domainComFirst: { value: 10.46, sourceId: "domainCom" },
  domainComRenewal: { value: 10.46, sourceId: "domainCom" },
  domainCaFirst: { value: 9.19, sourceId: "domainCa" },
  domainCaRenewal: { value: 9.19, sourceId: "domainCa" },
  domainOrgFirst: { value: 8.5, sourceId: "domainOrg" },
  domainOrgRenewal: { value: 11.2, sourceId: "domainOrg" },
  emailForwarding: { value: 0, sourceId: "emailRouting" },
  workspaceStarterCad: { value: 9.2, sourceId: "workspace" },
  ethicsIndustryReviewCad: { value: 3500, sourceId: "waterloo" },
  planningMinutesFastest: { value: 9.5, sourceId: "knops" },
  planningMinutesSlowest: { value: 11, sourceId: "knops" },
  scanLicence: { value: 0, sourceId: "avt" },
} as const satisfies Record<string, Price>;

/** Things measured on this site rather than read off a price list. */
export const MEASURED = {
  /** `avt-r6.u8.gz` is 7,051,231 bytes, and the prep script makes every scan the same shape. */
  scanMb: 7.05,
  /** A full attempt is 1,111 bytes of JSON; its columns and three indexes bring a row to about this. */
  recordKb: 2,
  /** A first visit to /evar: 12 KB of HTML and 401 KB of JS and CSS, brotli. */
  pageMb: 0.413,
  /** /api/me, the participant and the references, on every visit. */
  callsPerVisit: 3,
  /** Saving an attempt, then the attempts list refetching. */
  callsPerCase: 2,
  daysPerMonth: 30,
} as const;

/** Guesses, labelled as guesses on the page. */
export const ESTIMATED = {
  /** The API and Postgres at rest: about 0.3 GB of memory and a fiftieth of a CPU between them. */
  railwayIdleUsd: 3.4,
  /** Postgres's own files before any study records. */
  railwayBaseDiskGb: 0.5,
  /** Active CPU for one proxied API call. Waiting on the API isn't billed. */
  cpuMsPerCall: 10,
} as const;

export type Scenario = {
  /** Scans in the library, each measured once by a resident. */
  scans: number;
  peoplePerDay: number;
  scansEachPerDay: number;
  months: number;
  /** Canadian dollars an hour for the resident's time. */
  residentPerHour: number;
  minutesPerScan: number;
};

export const SCENARIO_KEYS: readonly (keyof Scenario)[] = [
  "scans",
  "peoplePerDay",
  "scansEachPerDay",
  "months",
  "residentPerHour",
  "minutesPerScan",
];

/**
 * Each slider's range. The tops are the biggest case asked about, so every
 * position stays inside the free tiers assumed below. The library runs from
 * 10 to 1,000, so it moves through stops instead of evenly: tens up to 100,
 * then fifties, then hundreds, which keeps 10 and 50 from being a few pixels
 * apart.
 */
export const SLIDERS: Record<keyof Scenario, { min: number; max: number; step: number; stops?: readonly number[] }> = {
  scans: {
    min: 10,
    max: 1000,
    step: 10,
    stops: [10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 150, 200, 250, 300, 350, 400, 450, 500, 600, 700, 800, 900, 1000],
  },
  peoplePerDay: { min: 1, max: 100, step: 1 },
  scansEachPerDay: { min: 1, max: 100, step: 1 },
  months: { min: 1, max: 24, step: 1 },
  residentPerHour: { min: 20, max: 150, step: 5 },
  minutesPerScan: { min: 5, max: 60, step: 5 },
};

/** Where the sliders start: a hundred scans, fifty people a day doing thirty each, for a year. */
export const MIDDLE: Scenario = {
  scans: 100,
  peoplePerDay: 50,
  scansEachPerDay: 30,
  months: 12,
  residentPerHour: 50,
  minutesPerScan: 15,
};
export const SMALLEST: Scenario = { ...MIDDLE, scans: 10, peoplePerDay: 10, scansEachPerDay: 10 };
export const BIGGEST: Scenario = { ...MIDDLE, scans: 1000, peoplePerDay: 100, scansEachPerDay: 100 };

/** The steps the page's tables are printed at. */
export const STEPS = {
  scans: [10, 50, 100, 500, 1000],
  peoplePerDay: [10, 50, 100],
  scansEachPerDay: [10, 30, 50, 100],
  months: [3, 6, 12, 24],
} as const;

const cadCents = (usd: number) => Math.round(usd * PRICES.cadPerUsd.value * 100);

/**
 * US dollars in Canadian at the checked rate, to the cent.
 *
 * @param usd - An amount in US dollars.
 * @returns The same amount in Canadian dollars, rounded to the cent.
 */
export function toCad(usd: number): number {
  return cadCents(usd) / 100;
}

export type Usage = {
  /** Every scan someone does counts as a fresh download, the worst case. */
  opensPerMonth: number;
  scanGbPerMonth: number;
  pageGbPerMonth: number;
  callsPerMonth: number;
  cpuHoursPerMonth: number;
  /** As if every day brought different people, the most Auth0 could count. */
  peoplePerMonth: number;
  /** Study records added each month, with everyone joined, the worst case. */
  recordsGbPerMonth: number;
  /** All of them by the last month. */
  recordsGb: number;
};

/**
 * How much traffic a month of this scenario makes.
 *
 * @param s - People a day, scans each a day, and how many months.
 * @returns Downloads, data, API calls and CPU a month, and the records stored by the end.
 */
export function usageFor({ peoplePerDay, scansEachPerDay, months }: Pick<Scenario, "peoplePerDay" | "scansEachPerDay" | "months">): Usage {
  const visits = peoplePerDay * MEASURED.daysPerMonth;
  const opensPerMonth = visits * scansEachPerDay;
  const callsPerMonth = visits * (MEASURED.callsPerVisit + MEASURED.callsPerCase * scansEachPerDay);
  const recordsGbPerMonth = (opensPerMonth * MEASURED.recordKb) / 1_000_000;
  return {
    opensPerMonth,
    scanGbPerMonth: (opensPerMonth * MEASURED.scanMb) / 1000,
    pageGbPerMonth: (visits * MEASURED.pageMb) / 1000,
    callsPerMonth,
    cpuHoursPerMonth: (callsPerMonth * ESTIMATED.cpuMsPerCall) / 3_600_000,
    peoplePerMonth: visits,
    recordsGbPerMonth,
    recordsGb: recordsGbPerMonth * months,
  };
}

/** Which way CloudFront is cheapest for a month's data. */
export type DeliveryPlan = "free" | "perGb" | "flat";

/**
 * A month of scan delivery: free up to the terabyte, then by the GB, or the
 * flat-rate Pro plan once that's cheaper.
 *
 * @param scanGbPerMonth - Data delivered in a month.
 * @returns The plan that's cheapest and what it costs that month, in US dollars.
 */
export function deliveryFor(scanGbPerMonth: number): { plan: DeliveryPlan; usd: number } {
  const overGb = Math.max(0, scanGbPerMonth - PRICES.cloudfrontFreeGb.value);
  if (overGb === 0) return { plan: "free", usd: 0 };
  const perGb = overGb * PRICES.cloudfrontPerGb.value;
  // Stryker disable next-line EqualityOperator: at exactly the flat price both plans cost the same, so which one it names changes no number.
  return perGb <= PRICES.cloudfrontFlatPro.value ? { plan: "perGb", usd: perGb } : { plan: "flat", usd: PRICES.cloudfrontFlatPro.value };
}

export type LineId = "resident" | "servers" | "delivery" | "storage" | "domain" | "website" | "signIn";
export type Line = { id: LineId; cad: number };
export type Estimate = { lines: readonly Line[]; total: number; usage: Usage; delivery: DeliveryPlan };

/**
 * What a scenario costs over its months, line by line, in Canadian dollars.
 *
 * Each bill is converted on its own, a month of Railway or a year of the
 * domain, so twelve months at $7.00 come to exactly $84.00. Storage is
 * worked out over the whole period instead, because a month of it is a
 * fraction of a cent. The total is the sum of the lines as shown.
 *
 * @param s - The scenario.
 * @returns Each line, the total, the usage behind them, and the delivery plan.
 */
export function estimate(s: Scenario): Estimate {
  const usage = usageFor(s);
  const delivery = deliveryFor(usage.scanGbPerMonth);
  const months = Array.from({ length: s.months }, (_, i) => i + 1);

  const serverCents = months
    .map((m) => {
      const diskGb = ESTIMATED.railwayBaseDiskGb + usage.recordsGbPerMonth * m;
      const usageUsd = ESTIMATED.railwayIdleUsd + diskGb * PRICES.railwayDiskPerGbMonth.value;
      return cadCents(Math.max(PRICES.railwayHobby.value, usageUsd));
    })
    .reduce((sum, c) => sum + c, 0);
  const years = Math.ceil(s.months / 12);
  const libraryGb = (s.scans * MEASURED.scanMb) / 1000;

  const lineCents: Record<LineId, number> = {
    resident: Math.round(s.scans * (s.minutesPerScan / 60) * s.residentPerHour * 100),
    servers: serverCents,
    delivery: cadCents(delivery.usd) * s.months,
    storage: cadCents(libraryGb * PRICES.s3PerGbMonth.value * s.months),
    domain: cadCents(PRICES.domainComFirst.value) + cadCents(PRICES.domainComRenewal.value) * (years - 1),
    website: 0,
    signIn: 0,
  };
  const ids: readonly LineId[] = ["resident", "servers", "delivery", "storage", "domain", "website", "signIn"];
  const lines = ids.map((id) => ({ id, cad: lineCents[id] / 100 }));
  const total = ids.reduce((sum, id) => sum + lineCents[id], 0) / 100;
  return { lines, total, usage, delivery: delivery.plan };
}
