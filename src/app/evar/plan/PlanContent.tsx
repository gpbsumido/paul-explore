import type { ReactNode } from "react";
import Link from "next/link";
import PageHeader from "@/components/PageHeader";
import {
  BIGGEST,
  ESTIMATED,
  MEASURED,
  MIDDLE,
  PRICES,
  PRICES_CHECKED,
  SLIDERS,
  SMALLEST,
  SOURCES,
  STEPS,
  estimate,
  toCad,
  usageFor,
  type Scenario,
} from "@/lib/evar/costs";
import CostCalculator from "./CostCalculator";
import { cad, cadRounded, checkedOn, count, duration, hours, rate, size, usd } from "./format";

const linkClass = "underline underline-offset-2 hover:text-foreground";
const th = "py-1.5 pr-3 font-medium";
const td = "py-2 pr-3 align-top";
const money = `${td} text-right font-mono tabular-nums text-foreground`;

/** A captioned table that scrolls on its own when it's wider than the page. */
function Table({ caption, children }: { caption: string; children: ReactNode }) {
  return (
    <div className="mt-4 overflow-x-auto">
      <table className="w-full text-left text-[14px]">
        <caption className="mb-2 text-left text-[15px] font-semibold text-foreground">{caption}</caption>
        {children}
      </table>
    </div>
  );
}

function Section({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section aria-labelledby={`${id}-heading`} className="mt-12">
      <h2 id={`${id}-heading`} className="text-xl font-bold text-foreground">
        {title}
      </h2>
      {children}
    </section>
  );
}

function Subsection({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section aria-labelledby={`${id}-heading`} id={id} className="mt-8">
      <h3 id={`${id}-heading`} className="text-[17px] font-semibold text-foreground">
        {title}
      </h3>
      {children}
    </section>
  );
}

const prose = "mt-3 max-w-prose text-[15px] leading-relaxed text-foreground";
const muted = "mt-3 max-w-prose text-[14px] leading-relaxed text-muted";

const lineOf = (s: Scenario, id: "resident" | "storage" | "delivery") =>
  estimate(s).lines.find((l) => l.id === id)?.cad ?? 0;
const withoutResident = (s: Scenario) => estimate(s).total - lineOf(s, "resident");
const sizes = [
  { name: "Smallest", scenario: SMALLEST },
  { name: "Middle", scenario: MIDDLE },
  { name: "Biggest", scenario: BIGGEST },
];
const caseLabel = (s: Scenario) =>
  `${count(s.scans)} scans, ${count(s.peoplePerDay)} people a day doing ${count(s.scansEachPerDay)} each`;

/**
 * The plan for EVAR Sizing: what it's for, and what running it on its own
 * domain would cost, from one dated set of list prices.
 */
export default function PlanContent() {
  const perScan = lineOf({ ...MIDDLE, scans: 1 }, "resident");
  const freeOpens = Math.floor((PRICES.cloudfrontFreeGb.value * 1000) / MEASURED.scanMb);
  const top = usageFor({
    peoplePerDay: SLIDERS.peoplePerDay.max,
    scansEachPerDay: SLIDERS.scansEachPerDay.max,
    months: SLIDERS.months.max,
  });

  return (
    <div className="min-h-dvh bg-background">
      <PageHeader
        breadcrumbs={[{ label: "Dashboard", href: "/" }, { label: "EVAR Sizing", href: "/evar" }, { label: "Plan" }]}
        maxWidth="max-w-4xl"
      />
      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        <h1 className="text-2xl font-bold text-foreground text-balance">The plan for EVAR Sizing</h1>
        <p className={prose}>
          Before an endovascular aneurysm repair, someone measures the patient&apos;s CT scan: how wide the aorta is
          just below the kidneys, how long that healthy neck runs before the aneurysm starts, how wide the aneurysm
          gets, and how wide each iliac artery is. Those numbers decide which stent graft fits.{" "}
          <Link href="/evar" className={linkClass}>
            EVAR Sizing
          </Link>{" "}
          is a place to practise taking them and find out how close you were.
        </p>

        <Section id="aims" title="What I'm trying to do">
          <ul className="mt-3 grid max-w-prose grid-cols-1 gap-3 text-[15px] leading-relaxed text-foreground">
            <li>
              <strong>Practice with an answer key.</strong> Trainees measure synthetic and real scans and get every
              number checked, then pick a graft from the Medtronic, Gore and Cook sizing tables.
            </li>
            <li>
              <strong>A study of how the skill grows.</strong> Anyone who joins has each attempt kept under a random
              id, so students, residents, fellows and staff surgeons can be compared over training. The study needs
              ethics approval before its data is used.
            </li>
            <li>
              <strong>More real scans.</strong> Real CT from openly licensed collections, each measured once by a
              resident so it has answers to check against.
            </li>
            <li>
              <strong>A site of its own.</strong> It moves off my portfolio to its own domain, and this page is what
              that costs.
            </li>
          </ul>
        </Section>

        <Section id="how" title="How a case works">
          <ol className="mt-3 grid max-w-prose list-decimal grid-cols-1 gap-2 pl-5 text-[15px] leading-relaxed text-foreground">
            <li>
              <strong>Pick a case:</strong> a synthetic phantom, or a real scan.
            </li>
            <li>
              <strong>Measure:</strong> scroll the slices and put calipers on the neck, the sac and both iliacs.
            </li>
            <li>
              <strong>Size the graft:</strong> choose a main body and limbs from a maker&apos;s sizing table.
            </li>
            <li>
              <strong>See how close you were:</strong> each number against its answer and the tolerance it&apos;s
              graded at.
            </li>
          </ol>
        </Section>

        <Section id="costs" title="What it costs">
          <p className={prose}>
            Everything here is in Canadian dollars. Most of these services bill in US dollars, so each US price is
            converted at the Bank of Canada&apos;s rate for {checkedOn(PRICES_CHECKED)}: US$1 ={" "}
            {rate(PRICES.cadPerUsd.value)}. The prices are each company&apos;s list price on that day.
          </p>
          <p className={prose}>
            Running the site is the small part: about {cadRounded(withoutResident(SMALLEST))} for a year at its
            quietest and {cadRounded(withoutResident(BIGGEST))} at its busiest. The real cost is a resident&apos;s
            time to set each scan&apos;s answers, {cad(perScan)} a scan at the rate below, so{" "}
            {cadRounded(lineOf({ ...MIDDLE, scans: 10 }, "resident"))} for 10 scans and{" "}
            {cadRounded(lineOf({ ...MIDDLE, scans: 1000 }, "resident"))} for 1,000.
          </p>

          <Subsection id="estimate" title="Estimate it">
            <p className={muted}>
              The sliders start on the middle case: {caseLabel(MIDDLE)}, for {duration(MIDDLE.months)}, with the
              resident at {cadRounded(MIDDLE.residentPerHour)} an hour and {MIDDLE.minutesPerScan} minutes a scan.
              Their tops are the biggest case I&apos;ve planned for.
            </p>
            <CostCalculator />
          </Subsection>

          <Subsection id="range" title="The range">
            <Table caption="The range, from the smallest case to the biggest">
              <thead>
                <tr className="text-[12px] text-muted">
                  <th scope="col" className={th}>How long</th>
                  {sizes.map(({ name, scenario }) => (
                    <th key={name} scope="col" className={`${th} text-right`}>
                      {name}
                      <span className="block font-normal">{caseLabel(scenario)}</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {STEPS.months.map((months) => (
                  <tr key={months} className="border-t border-border">
                    <th scope="row" className={`${td} font-normal text-foreground`}>{duration(months)}</th>
                    {sizes.map(({ name, scenario }) => (
                      <td key={name} className={money}>{cad(estimate({ ...scenario, months }).total)}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </Table>
            <p className={muted}>
              Every case uses {cadRounded(MIDDLE.residentPerHour)} an hour and {MIDDLE.minutesPerScan} minutes a
              scan. Without the resident&apos;s time, the biggest case is{" "}
              {cad(withoutResident({ ...BIGGEST, months: 24 }))} for two years.
            </p>
          </Subsection>
        </Section>

        <Section id="where" title="Where the money goes">
          <Subsection id="storage" title="Storing and delivering the scans">
            <p className={prose}>
              A real scan is about {MEASURED.scanMb} MB once it&apos;s prepared: cropped to the aorta, one byte a
              voxel, and compressed. Amazon S3 in Canada charges {usd(PRICES.s3PerGbMonth.value)} a GB each month to
              keep it, which is the cheap half. The other half is the resident who measures it.
            </p>
            <Table caption="The library: storage and a resident's time, by number of scans">
              <thead>
                <tr className="text-[12px] text-muted">
                  <th scope="col" className={th}>Scans</th>
                  <th scope="col" className={th}>Space</th>
                  <th scope="col" className={`${th} text-right`}>Storage for a year</th>
                  <th scope="col" className={th}>Resident&apos;s time</th>
                  <th scope="col" className={`${th} text-right`}>Resident&apos;s cost, once</th>
                </tr>
              </thead>
              <tbody>
                {STEPS.scans.map((scans) => (
                  <tr key={scans} className="border-t border-border">
                    <th scope="row" className={`${td} font-normal text-foreground`}>{count(scans)}</th>
                    <td className={`${td} text-muted`}>{size((scans * MEASURED.scanMb) / 1000)}</td>
                    <td className={money}>{cad(lineOf({ ...MIDDLE, scans, months: 12 }, "storage"))}</td>
                    <td className={`${td} text-muted`}>{hours((scans * MIDDLE.minutesPerScan) / 60)}</td>
                    <td className={money}>{cad(lineOf({ ...MIDDLE, scans }, "resident"))}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
            <p className={prose}>
              Each time someone opens a real scan, their browser downloads it. CloudFront&apos;s first terabyte a month
              is free, about {count(freeOpens)} opens. Past that it&apos;s {usd(PRICES.cloudfrontPerGb.value)} a GB,
              until the flat-rate Pro plan, {usd(PRICES.cloudfrontFlatPro.value)} a month for{" "}
              {PRICES.cloudfrontFlatProTb.value} TB, is the cheaper way. The phantoms are drawn in the browser, so
              they cost nothing to deliver.
            </p>
            <Table caption="Scan delivery a month, by people a day and scans each a day">
              <thead>
                <tr className="text-[12px] text-muted">
                  <th scope="col" className={th}>People a day</th>
                  {STEPS.scansEachPerDay.map((each) => (
                    <th key={each} scope="col" className={`${th} text-right`}>{`${each} scans each`}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {STEPS.peoplePerDay.map((people) => (
                  <tr key={people} className="border-t border-border">
                    <th scope="row" className={`${td} font-normal text-foreground`}>{`${people} people a day`}</th>
                    {STEPS.scansEachPerDay.map((each) => {
                      const month = { ...MIDDLE, peoplePerDay: people, scansEachPerDay: each, months: 1 };
                      return (
                        <td key={each} className={money}>
                          {cad(lineOf(month, "delivery"))}
                          <span className="block text-[12px] text-muted">{size(usageFor(month).scanGbPerMonth)}</span>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </Table>
          </Subsection>

          <Subsection id="running" title="Running it">
            <Table caption="The services it runs on">
              <thead>
                <tr className="text-[12px] text-muted">
                  <th scope="col" className={th}>Service</th>
                  <th scope="col" className={th}>What it does</th>
                  <th scope="col" className={th}>Plan and list price</th>
                  <th scope="col" className={`${th} text-right`}>In Canadian dollars</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-t border-border">
                  <th scope="row" className={`${td} font-normal text-foreground`}>Vercel</th>
                  <td className={`${td} text-muted`}>Serves the pages. The phantoms are drawn in the browser.</td>
                  <td className={`${td} text-muted`}>
                    Hobby, free for a non-commercial site, with {PRICES.vercelHobbyTransferGb.value} GB of data,{" "}
                    {count(PRICES.vercelHobbyCalls.value)} function calls and {PRICES.vercelHobbyCpuHours.value} CPU
                    hours a month. Pro is {usd(PRICES.vercelPro.value)} a month.
                  </td>
                  <td className={money}>
                    {cad(0)}
                    <span className="block text-[12px] text-muted">Pro: {cad(toCad(PRICES.vercelPro.value))} a month</span>
                  </td>
                </tr>
                <tr className="border-t border-border">
                  <th scope="row" className={`${td} font-normal text-foreground`}>Railway</th>
                  <td className={`${td} text-muted`}>Runs the API and the study&apos;s database.</td>
                  <td className={`${td} text-muted`}>
                    Hobby, {usd(PRICES.railwayHobby.value)} a month, which includes that much usage. Memory is{" "}
                    {usd(PRICES.railwayMemoryPerGbMonth.value)} a GB, CPU {usd(PRICES.railwayCpuPerVcpuMonth.value)} a
                    core and disk {usd(PRICES.railwayDiskPerGbMonth.value)} a GB, each a month.
                  </td>
                  <td className={money}>{cad(toCad(PRICES.railwayHobby.value))} a month</td>
                </tr>
                <tr className="border-t border-border">
                  <th scope="row" className={`${td} font-normal text-foreground`}>Auth0</th>
                  <td className={`${td} text-muted`}>Signs in anyone who joins the study.</td>
                  <td className={`${td} text-muted`}>
                    Free, up to {count(PRICES.auth0FreeMonthlyUsers.value)} people a month, with one custom address
                    for the sign-in page.
                  </td>
                  <td className={money}>{cad(0)}</td>
                </tr>
                <tr className="border-t border-border">
                  <th scope="row" className={`${td} font-normal text-foreground`}>Amazon S3</th>
                  <td className={`${td} text-muted`}>Keeps the real scans.</td>
                  <td className={`${td} text-muted`}>{usd(PRICES.s3PerGbMonth.value)} a GB a month, in Canada (Central).</td>
                  <td className={money}>
                    {cad(lineOf({ ...MIDDLE, scans: 1000, months: 1 }, "storage"))} a month
                    <span className="block text-[12px] text-muted">for 1,000 scans</span>
                  </td>
                </tr>
                <tr className="border-t border-border">
                  <th scope="row" className={`${td} font-normal text-foreground`}>Amazon CloudFront</th>
                  <td className={`${td} text-muted`}>Delivers the scans to browsers.</td>
                  <td className={`${td} text-muted`}>
                    The first terabyte a month free, then {usd(PRICES.cloudfrontPerGb.value)} a GB, or{" "}
                    {usd(PRICES.cloudfrontFlatPro.value)} a month flat for {PRICES.cloudfrontFlatProTb.value} TB.
                  </td>
                  <td className={money}>
                    {cad(0)}
                    <span className="block text-[12px] text-muted">
                      up to {cad(toCad(PRICES.cloudfrontFlatPro.value))} a month
                    </span>
                  </td>
                </tr>
              </tbody>
            </Table>
          </Subsection>

          <Subsection id="adding" title="Adding more scans">
            <p className={prose}>
              My part is small: put the prepared scan in the bucket and add a line to the manifest. Each scan then
              needs a resident to measure it on the admin page and enter its five answers, so there&apos;s something
              to grade against. At {MIDDLE.minutesPerScan} minutes a scan and {cadRounded(MIDDLE.residentPerHour)} an
              hour, that&apos;s {cad(perScan)} a scan.
            </p>
            <Table caption="What one more scan takes">
              <thead>
                <tr className="text-[12px] text-muted">
                  <th scope="col" className={th}>Step</th>
                  <th scope="col" className={th}>Who</th>
                  <th scope="col" className={th}>Time</th>
                  <th scope="col" className={`${th} text-right`}>Cost</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-t border-border">
                  <th scope="row" className={`${td} font-normal text-foreground`}>
                    Find an openly licensed CT and prepare it with the script
                  </th>
                  <td className={`${td} text-muted`}>Me</td>
                  <td className={`${td} text-muted`}>A few minutes</td>
                  <td className={money}>{cad(PRICES.scanLicence.value)}</td>
                </tr>
                <tr className="border-t border-border">
                  <th scope="row" className={`${td} font-normal text-foreground`}>Upload it and add it to the manifest</th>
                  <td className={`${td} text-muted`}>Me</td>
                  <td className={`${td} text-muted`}>A few minutes</td>
                  <td className={money}>under $0.01</td>
                </tr>
                <tr className="border-t border-border">
                  <th scope="row" className={`${td} font-normal text-foreground`}>Measure it and enter its five answers</th>
                  <td className={`${td} text-muted`}>A resident</td>
                  <td className={`${td} text-muted`}>About {MIDDLE.minutesPerScan} minutes</td>
                  <td className={money}>{cad(perScan)}</td>
                </tr>
                <tr className="border-t border-border">
                  <th scope="row" className={`${td} font-normal text-foreground`}>Keep it stored</th>
                  <td className={`${td} text-muted`}>S3</td>
                  <td className={`${td} text-muted`}>Ongoing</td>
                  <td className={money}>under $0.01 a year</td>
                </tr>
              </tbody>
            </Table>
            <p className={muted}>
              For a sense of the time: in a Leiden study, six observers took 20 sizing measurements on each of 20
              scans, and it took {PRICES.planningMinutesFastest.value} to {PRICES.planningMinutesSlowest.value}{" "}
              minutes a scan whichever planning software they used. Five measurements here, with time to check them,
              is about {MIDDLE.minutesPerScan}. A second resident measuring each scan on their own, so the two answers
              can be compared, doubles the resident&apos;s line.
            </p>
          </Subsection>

          <Subsection id="domain" title="A domain of its own">
            <p className={prose}>
              Cloudflare sells domains at what the registry charges, with WHOIS privacy included, and renews them at
              the same price. A .ca needs a Canadian presence. DNS comes with the domain and Vercel issues the HTTPS
              certificate, so neither costs anything.
            </p>
            <Table caption="A domain, by ending">
              <thead>
                <tr className="text-[12px] text-muted">
                  <th scope="col" className={th}>Ending</th>
                  <th scope="col" className={`${th} text-right`}>First year</th>
                  <th scope="col" className={`${th} text-right`}>Each year after</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { ending: ".com", first: PRICES.domainComFirst.value, renewal: PRICES.domainComRenewal.value },
                  { ending: ".ca", first: PRICES.domainCaFirst.value, renewal: PRICES.domainCaRenewal.value },
                  { ending: ".org", first: PRICES.domainOrgFirst.value, renewal: PRICES.domainOrgRenewal.value },
                ].map(({ ending, first, renewal }) => (
                  <tr key={ending} className="border-t border-border">
                    <th scope="row" className={`${td} font-normal text-foreground`}>{ending}</th>
                    <td className={money}>{cad(toCad(first))}</td>
                    <td className={money}>{cad(toCad(renewal))}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
            <p className={muted}>The totals above use .com.</p>
          </Subsection>

          <Subsection id="else" title="Everything else">
            <Table caption="Everything else">
              <thead>
                <tr className="text-[12px] text-muted">
                  <th scope="col" className={th}>Item</th>
                  <th scope="col" className={`${th} text-right`}>Cost</th>
                  <th scope="col" className={th}>Notes</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-t border-border">
                  <th scope="row" className={`${td} font-normal text-foreground`}>A contact address at the domain</th>
                  <td className={money}>{cad(PRICES.emailForwarding.value)}</td>
                  <td className={`${td} text-muted`}>Cloudflare Email Routing forwards it to my inbox. It only receives.</td>
                </tr>
                <tr className="border-t border-border">
                  <th scope="row" className={`${td} font-normal text-foreground`}>A mailbox that can also send</th>
                  <td className={money}>{cad(PRICES.workspaceStarterCad.value)} a month</td>
                  <td className={`${td} text-muted`}>
                    Google Workspace Business Starter, one person, with a one-year commitment. Optional, and not in
                    the totals.
                  </td>
                </tr>
                <tr className="border-t border-border">
                  <th scope="row" className={`${td} font-normal text-foreground`}>Ethics review for the study</th>
                  <td className={money}>{cad(0)} expected</td>
                  <td className={`${td} text-muted`}>
                    Unfunded studies usually aren&apos;t charged. Industry-sponsored ones are: the University of
                    Waterloo charges {cadRounded(PRICES.ethicsIndustryReviewCad.value)} for an initial review. It&apos;s
                    needed before the study&apos;s data is used.
                  </td>
                </tr>
                <tr className="border-t border-border">
                  <th scope="row" className={`${td} font-normal text-foreground`}>Scan licences</th>
                  <td className={money}>{cad(PRICES.scanLicence.value)}</td>
                  <td className={`${td} text-muted`}>Open collections under CC BY 4.0, credited on the page.</td>
                </tr>
                <tr className="border-t border-border">
                  <th scope="row" className={`${td} font-normal text-foreground`}>The intro video</th>
                  <td className={money}>{cad(0)}</td>
                  <td className={`${td} text-muted`}>Recorded from the practice itself.</td>
                </tr>
                <tr className="border-t border-border">
                  <th scope="row" className={`${td} font-normal text-foreground`}>My time</th>
                  <td className={`${td} text-right text-muted`}>Not counted</td>
                  <td className={`${td} text-muted`}>Pointing the site at the scans and uploading them.</td>
                </tr>
              </tbody>
            </Table>
          </Subsection>
        </Section>

        <Section id="assumptions" title="What I've assumed">
          <ul className="mt-3 grid max-w-prose list-disc grid-cols-1 gap-2 pl-5 text-[14px] leading-relaxed text-foreground">
            <li>
              Every scan someone does is a fresh {MEASURED.scanMb} MB download, and everyone has joined the study, so
              every case is saved. Browser caching and people who don&apos;t join only bring the numbers down.
            </li>
            <li>A month is {MEASURED.daysPerMonth} days, and each person visits once a day.</li>
            <li>
              A saved attempt takes about {MEASURED.recordKb} KB in the database: a full attempt is 1,111 bytes of
              JSON, plus its columns and indexes.
            </li>
            <li>
              A first visit to the practice downloads {MEASURED.pageMb} MB, measured: 12 KB of HTML and 401 KB of
              scripts and styles.
            </li>
            <li>
              <strong>An estimate:</strong> the API and database use about {usd(ESTIMATED.railwayIdleUsd)} a month of
              Railway at rest, inside its {usd(PRICES.railwayHobby.value)} minimum. Only the busiest cases outgrow it,
              once their study records pile up.
            </li>
            <li>
              <strong>An estimate:</strong> each API call through Vercel uses {ESTIMATED.cpuMsPerCall} ms of CPU. At
              the top of every slider that&apos;s {count(top.callsPerMonth)} calls and{" "}
              {top.cpuHoursPerMonth.toFixed(1)} of Hobby&apos;s {PRICES.vercelHobbyCpuHours.value} CPU hours a month,
              so the website stays free.
            </li>
            <li>
              The resident&apos;s rate and minutes are mine to change. The sliders start at{" "}
              {cadRounded(MIDDLE.residentPerHour)} an hour and {MIDDLE.minutesPerScan} minutes.
            </li>
            <li>
              Each bill is converted on its own, so twelve months at {cad(toCad(PRICES.railwayHobby.value))} are
              exactly {cad(toCad(PRICES.railwayHobby.value) * 12)}. Storage is worked out over the whole period,
              because a month of it is a fraction of a cent.
            </li>
          </ul>
        </Section>

        <Section id="sources" title="Sources">
          <ul aria-labelledby="sources-heading" className="mt-3 grid grid-cols-1 gap-1.5 text-[14px] text-muted">
            {SOURCES.map((source) => (
              <li key={source.id}>
                <a href={source.href} className={linkClass} target="_blank" rel="noopener noreferrer">
                  {source.label}
                </a>
              </li>
            ))}
          </ul>
          <p className={muted}>All checked on {checkedOn(PRICES_CHECKED)}.</p>
        </Section>
      </main>
    </div>
  );
}
