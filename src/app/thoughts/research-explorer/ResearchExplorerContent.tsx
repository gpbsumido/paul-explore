"use client";

import ThoughtLayout from "@/app/thoughts/ThoughtLayout";

const code =
  "rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground";

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="mb-3 text-lg font-bold">{title}</h2>
      {children}
    </section>
  );
}

function Bullet({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex gap-2">
      <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-foreground/30" />
      <span>{children}</span>
    </li>
  );
}

function Step({
  n,
  title,
  children,
}: {
  n: number;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <li className="flex gap-3">
      <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-border bg-surface text-xs font-semibold text-foreground">
        {n}
      </span>
      <span>
        <strong className="text-foreground">{title}</strong>
        <span className="mt-1 block text-muted">{children}</span>
      </span>
    </li>
  );
}

export default function ResearchExplorerContent() {
  return (
    <ThoughtLayout
      breadcrumb="Research Explorer"
      title="Measuring the Literature to Find a Research Topic"
      intro={
        <>
          A vascular surgery resident needs a research project, and the hard part
          isn&apos;t generating ideas. It&apos;s knowing which idea is actually
          unclaimed. &quot;Has anyone studied this?&quot; is a question you can
          only answer by searching, and searching twenty candidate topics by hand
          is an afternoon you spend before you&apos;ve learned anything. So I
          built the afternoon into a page: every candidate topic gets scored
          against how much literature already exists, the papers behind that
          score are one click away, and the populations those papers enrolled are
          charted so the gaps show themselves.
        </>
      }
    >
      <Section title="How to use it, if you're the one doing the research">
        <p className="mb-4 text-muted">
          The page is built around one workflow: narrow from a field to a
          question you can actually answer with the patients you have access to.
        </p>
        <ol className="space-y-4 text-sm">
          <Step n={1} title="Scan the Topics tab for the green badges.">
            Topics are grouped by area — aortic, limb salvage, carotid, venous,
            access, training, disparities. A topic marked{" "}
            <em>No research yet</em> has literally zero PubMed hits for its
            query, and <em>Sparse</em> means fewer than 25 papers ever or fewer
            than 10 in the last five years. Those are the ones where a good
            retrospective review is genuinely additive rather than the twelfth
            entry in a crowded field.
          </Step>
          <Step n={2} title="Open a topic and read what already exists.">
            Every topic expands into its most recent papers, newest first, each
            linking straight to PubMed. This is the step that saves the most
            time: five minutes of reading tells you whether the sparse count
            means &quot;nobody has asked this&quot; or &quot;three groups asked
            it and it turned out to be uninteresting.&quot; The methods sections
            are also the template — if two of the three existing papers are
            single-center retrospective cohorts, that&apos;s a signal about what
            is feasible at one hospital.
          </Step>
          <Step n={3} title="Narrow to a population and watch the count collapse.">
            Inside an open topic there are filter chips for sex, age band, race
            and ethnicity, and health populations — diabetes, CKD and dialysis,
            smokers, obesity, rural, frail. Toggle one and the paper list
            re-queries scoped to it. A topic with 300 papers that drops to 4 when
            you add <em>Indigenous peoples</em> or <em>dialysis</em> is not a
            crowded field. It&apos;s a crowded field with a hole in it, and the
            hole is the project.
          </Step>
          <Step n={4} title="Use the Demographics tab to find the hole first.">
            Same data, inverted. Instead of picking a topic and checking its
            coverage, it charts coverage across every population for a scope, so
            the underrepresented groups are visible before you&apos;ve committed
            to a question. Open a topic on the Topics tab and this rescopes to
            it; leave it closed and you get the whole field.
          </Step>
          <Step n={5} title="Use the Journals tab to aim the finished paper.">
            Browsing recent output journal by journal answers a different
            question — not &quot;what&apos;s unstudied&quot; but &quot;where does
            work like mine get published, and what does that journal currently
            care about.&quot; Worth doing before writing, not after.
          </Step>
        </ol>
        <p className="mt-4 text-sm text-muted">
          The shape of a good answer coming out of this: a specific question, in
          a specific population, that the literature has left thin, with three or
          four existing papers whose methods you can adapt.
        </p>
      </Section>

      <Section title="Where the data comes from">
        <p className="mb-3 text-muted">
          PubMed, through the NCBI E-utilities API. I looked at scraping journal
          sites and it&apos;s the wrong trade: E-utilities is free, needs no key,
          indexes essentially every medical journal, and returns structured
          records with MeSH terms already applied. A scraper would be more code,
          more fragile, legally murkier, and worse data. The one thing scraping
          would buy is coverage of preprints and grey literature, and Europe PMC
          exposes most of that through an API too, so that&apos;s the direction
          if I extend it.
        </p>
        <ul className="space-y-2 text-sm text-muted">
          <Bullet>
            <span className={code}>esearch</span> with{" "}
            <span className={code}>rettype=count</span> for the evidence levels —
            two calls per topic, all-time and last five years.
          </Bullet>
          <Bullet>
            <span className={code}>esearch</span> then{" "}
            <span className={code}>esummary</span> for the paper lists, sorted by
            date.
          </Bullet>
          <Bullet>
            Nothing is stored. It&apos;s live through BFF routes with a day-long
            CDN cache, so PubMed sees about one scan a day no matter how many
            people browse.
          </Bullet>
        </ul>
      </Section>

      <Section title="The curated layer is the actual product">
        <p className="mb-3 text-muted">
          The API is the easy half. What makes the page useful is a hand-written
          data file: about two dozen candidate topics, each with its own PubMed
          query in PubMed&apos;s own syntax, plus the journals and the
          demographic clauses. Keeping the queries as data rather than generating
          them means every number on the page is traceable to a search you can
          paste into PubMed yourself and verify.
        </p>
        <p className="mb-3 text-muted">
          I did consider deriving topics automatically from MeSH co-occurrence in
          recent vascular literature. It would look more impressive and be much
          less useful — the output is noisy term pairs, not research questions,
          and a research question is the thing being asked for. Curated topics
          are editable in one file, which is the right amount of machinery.
        </p>
      </Section>

      <Section title="Two decisions worth defending">
        <ul className="space-y-3 text-sm text-muted">
          <Bullet>
            <strong className="text-foreground">
              Thresholds are named constants, not vibes.
            </strong>{" "}
            Zero is <em>none</em>; under 25 total or under 10 recent is{" "}
            <em>sparse</em>; everything else is <em>active</em>. Those numbers
            are arguable, which is exactly why they live in one function with a
            test pinning each boundary. When they turn out to be wrong for a
            subfield, there&apos;s one line to change and the test says what
            changed.
          </Bullet>
          <Bullet>
            <strong className="text-foreground">
              A PubMed outage is an error, not an empty page.
            </strong>{" "}
            The whole feature rests on believing a count of zero. If the API is
            unreachable and the page renders every topic as &quot;no research
            yet,&quot; it isn&apos;t degraded — it&apos;s lying, and lying in the
            most damaging direction. So a failed scan returns 502 and the page
            says so.
          </Bullet>
        </ul>
      </Section>

      <Section title="What's next">
        <ul className="space-y-2 text-sm text-muted">
          <Bullet>
            A sources panel to add, edit, or ignore databases and journals —
            deliberately scoped after the core, since finding research matters
            more than configuring where it comes from.
          </Bullet>
          <Bullet>
            Europe PMC as a second source, deduped by DOI, for preprints.
          </Bullet>
          <Bullet>
            Saving a snapshot of a scan so the same topics can be compared over
            months. That needs somewhere to put it, which this app doesn&apos;t
            have yet.
          </Bullet>
        </ul>
      </Section>
    </ThoughtLayout>
  );
}
