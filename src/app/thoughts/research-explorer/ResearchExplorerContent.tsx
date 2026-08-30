import ThoughtLayout from "@/app/thoughts/ThoughtLayout";
import { Update, WhatsNext } from "@/app/thoughts/_shared/ThoughtUpdates";

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
          A vascular surgery resident needs a research project, and the hard
          part isn&apos;t generating ideas. It&apos;s knowing which idea is
          actually unclaimed. &quot;Has anyone studied this?&quot; is a question
          you can only answer by searching, and searching twenty candidate
          topics by hand is an afternoon you spend before you&apos;ve learned
          anything. So I built the afternoon into a page: every candidate topic
          gets scored against how much literature already exists, the papers
          behind that score are one click away, and the populations those papers
          enrolled are charted so the gaps show themselves.
        </>
      }
    >
      <nav
        aria-label="Update timeline"
        className="rounded-xl border border-border bg-surface p-5"
      >
        <h2 className="text-sm font-semibold text-foreground">Timeline</h2>
        <p className="mt-1 text-xs text-muted">
          Newest first &mdash; this write-up has updates, jump to one.
        </p>
        <ol className="mt-3 space-y-2 text-sm">
          <li className="flex items-baseline gap-3">
            <span className="w-24 shrink-0 text-xs tabular-nums text-muted">
              Aug 8, 2026
            </span>
            <a
              href="#update-2026-08-08-journal-club"
              className="text-primary-600 hover:underline dark:text-primary-400"
            >
              Journal club: turning a citation into something to prepare
            </a>
          </li>
          <li className="flex items-baseline gap-3">
            <span className="w-24 shrink-0 text-xs tabular-nums text-muted">
              Aug 7, 2026
            </span>
            <a
              href="#update-2026-08-07-counts"
              className="text-primary-600 hover:underline dark:text-primary-400"
            >
              Counts: papers per topic as plain numbers, split by population
            </a>
          </li>
          <li className="flex items-baseline gap-3">
            <span className="w-24 shrink-0 text-xs tabular-nums text-muted">
              Aug 7, 2026
            </span>
            <a
              href="#update-2026-08-07-coverage"
              className="text-primary-600 hover:underline dark:text-primary-400"
            >
              Every count says how far back it reaches
            </a>
          </li>
          <li className="flex items-baseline gap-3">
            <span className="w-24 shrink-0 text-xs tabular-nums text-muted">
              Aug 7, 2026
            </span>
            <a
              href="#update-2026-08-07-mobile"
              className="text-primary-600 hover:underline dark:text-primary-400"
            >
              Mobile first, and the guard for a route I shipped broken
            </a>
          </li>
        </ol>
      </nav>

      <Section title="How to use it, if you're the one doing the research">
        <p className="mb-4 text-muted">
          The page is built around one workflow: narrow from a field to a
          question you can actually answer with the patients you have access to.
        </p>
        <ol className="space-y-4 text-sm">
          <Step n={1} title="Scan the Topics tab for the amber Sparse badges.">
            Topics are grouped by area — aortic, limb salvage, carotid, venous,
            access, training, disparities. The badge reflects the last five
            years: <em>Sparse</em> under twenty papers, <em>Emerging</em> under
            seventy-five, <em>Active</em> above that. Sparse is where a good
            retrospective review is genuinely additive rather than the twelfth
            entry in a crowded field, and Emerging is where a field is picking
            up but the evidence hasn&apos;t caught up yet.
          </Step>
          <Step
            n={2}
            title="Don't wait for a topic that says zero — there isn't one."
          >
            There is a <em>No research yet</em> badge and you will never see it
            on this tab, which is worth saying plainly because I originally
            wrote this guide telling you to look for it. Every topic here is a
            recognised area of vascular surgery, and recognised areas have
            literature — the quietest one still has eight papers. A true zero
            exists, but it lives in the <em>intersection</em> of a topic and a
            population, not in a topic on its own. That is what the filters and
            the Counts tab are for, and reading <em>0 of 15 · 0%</em> there is
            the finding the green badge was supposed to represent.
          </Step>
          <Step n={3} title="Open a topic and read what already exists.">
            Every topic expands into its most recent papers, newest first, each
            linking straight to PubMed. This is the step that saves the most
            time: five minutes of reading tells you whether the sparse count
            means &quot;nobody has asked this&quot; or &quot;three groups asked
            it and it turned out to be uninteresting.&quot; The methods sections
            are also the template — if two of the three existing papers are
            single-center retrospective cohorts, that&apos;s a signal about what
            is feasible at one hospital.
          </Step>
          <Step
            n={4}
            title="Narrow to a population and watch the count collapse."
          >
            Inside an open topic there are filter chips for sex, age band, race
            and ethnicity, and health populations — diabetes, CKD and dialysis,
            smokers, obesity, rural, frail. Toggle one and the paper list
            re-queries scoped to it. A topic with 300 papers that drops to 4
            when you add <em>Indigenous peoples</em> or <em>dialysis</em> is not
            a crowded field. It&apos;s a crowded field with a hole in it, and
            the hole is the project.
          </Step>
          <Step
            n={5}
            title="Check the Discovered tab for what I didn't think of."
          >
            The curated topics are the ones I decided were worth asking about,
            which is a real limitation — it can only surface gaps someone
            already suspected. The Discovered tab asks the literature instead:
            it samples the two hundred most recent vascular papers, tallies
            their MeSH headings, throws out the boilerplate and anything already
            on the Topics tab, and scores what&apos;s left the same way. A
            heading that keeps recurring in recent work but has almost no
            accumulated literature behind it is a field turning its attention
            somewhere before the evidence has caught up. That&apos;s a good
            place to be early.
          </Step>
          <Step n={6} title="Use the Demographics tab to find the hole first.">
            Same data, inverted. Instead of picking a topic and checking its
            coverage, it charts coverage across every population for a scope, so
            the underrepresented groups are visible before you&apos;ve committed
            to a question. Open a topic on the Topics tab and this rescopes to
            it; leave it closed and you get the whole field.
          </Step>
          <Step n={7} title="Use the Journals tab to aim the finished paper.">
            Browsing recent output journal by journal answers a different
            question — not &quot;what&apos;s unstudied&quot; but &quot;where
            does work like mine get published, and what does that journal
            currently care about.&quot; Worth doing before writing, not after.
          </Step>
        </ol>
        <p className="mt-4 text-sm text-muted">
          The shape of a good answer coming out of this: a specific question, in
          a specific population, that the literature has left thin, with three
          or four existing papers whose methods you can adapt.
        </p>
      </Section>

      <Section title="Where the data comes from">
        <p className="mb-3 text-muted">
          Two databases, both through public APIs. I looked at scraping journal
          sites and it&apos;s the wrong trade: NCBI&apos;s E-utilities is free,
          needs no key, indexes essentially every medical journal, and returns
          structured records with MeSH terms already applied. A scraper would be
          more code, more fragile, legally murkier, and worse data. Europe PMC
          joins it as a second source for the coverage scraping would otherwise
          have been for — preprints and records PubMed doesn&apos;t carry.
        </p>
        <ul className="space-y-2 text-sm text-muted">
          <Bullet>
            <span className={code}>esearch</span> with{" "}
            <span className={code}>rettype=count</span> for the evidence levels
            — two calls per topic, all-time and last five years.
          </Bullet>
          <Bullet>
            <span className={code}>esearch</span> then{" "}
            <span className={code}>esummary</span> for the paper lists, sorted
            by date, merged with Europe PMC results and deduped by DOI, then by
            normalized title when a record has no DOI.
          </Bullet>
          <Bullet>
            Europe PMC&apos;s <span className={code}>resultType=core</span>{" "}
            returns MeSH headings as JSON. PubMed only offers them as XML, and
            that difference is the entire reason auto-derived topics were cheap
            enough to build.
          </Bullet>
          <Bullet>
            Nothing is stored. It&apos;s live through BFF routes with a day-long
            CDN cache, so the upstreams see about one scan a day no matter how
            many people browse.
          </Bullet>
        </ul>
        <p className="mt-3 text-sm text-muted">
          Every publication list names the databases it searched, and the two
          sources are deliberately not equal partners: evidence levels are
          computed from PubMed alone. Mixing indexes into one denominator would
          make the none/sparse/active numbers mean something different depending
          on which sources answered, which is worse than a slightly narrower
          count that always means the same thing.
        </p>
      </Section>

      <Section title="The curated layer is the actual product">
        <p className="mb-3 text-muted">
          The API is the easy half. What makes the page useful is a hand-written
          data file: about two dozen candidate topics, each with its own PubMed
          query in PubMed&apos;s own syntax, plus the journals and the
          demographic clauses. Keeping the queries as data rather than
          generating them means every number on the page is traceable to a
          search you can paste into PubMed yourself and verify.
        </p>
        <p className="mb-3 text-muted">
          I originally planned to leave it there, on the grounds that
          auto-derived topics would be noisy term soup rather than research
          questions. Building both changed my mind about the framing rather than
          the criticism: derived headings genuinely are worse as questions, but
          they&apos;re better as <em>signal</em>. The curated list can only
          contain gaps I already suspected, and a tool whose whole purpose is
          finding what nobody has looked at shouldn&apos;t be bounded by what
          one person thought of. So the two tabs do different jobs — curated
          topics are questions you can act on today, discovered headings are
          where to look next — and keeping them separate is what makes the
          noisier half tolerable.
        </p>
        <p className="mb-3 text-muted">
          The discovered path is also the one place a search fragment originates
          upstream instead of from my file, so it gets validated as a MeSH
          descriptor before it can become part of a query — words, digits, and
          the comma-and-hyphen punctuation NLM actually uses. Anything else is
          rejected rather than escaped, since a descriptor never needs quotes or
          brackets and the only thing that would want them is an injected
          clause.
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
            yet,&quot; it isn&apos;t degraded — it&apos;s lying, and lying in
            the most damaging direction. So a failed scan returns 502 and the
            page says so.
          </Bullet>
        </ul>
      </Section>

      <Section title="Two decisions I reversed">
        <p className="mb-3 text-muted">
          I wrote the plan before the code and reviewed it before building,
          which caught both of the things I&apos;d have otherwise shipped wrong.
          Curated-only topics was one, covered above. The other was calling
          PubMed sufficient on its own — true for counting, false for reading,
          because preprints are exactly where an unclaimed topic shows early
          activity and PubMed is the last place they appear. Both changes cost
          more in the plan than they would have cost to skip, and far less than
          discovering them after the fact.
        </p>
      </Section>

      <section
        id="update-2026-08-08-journal-club"
        className="scroll-mt-24 rounded-xl border border-primary-400/40 bg-primary-500/5 p-5"
      >
        <p className="text-xs font-semibold uppercase tracking-wider text-primary-600 dark:text-primary-400">
          Update &mdash; August 8, 2026
        </p>
        <h2 className="mt-1 mb-3 text-lg font-bold">
          Journal club: turning a citation into something to prepare
        </h2>
        <p className="text-muted">
          Finding a paper and being ready to discuss it are different problems.
          A citation on its own gives a trainee nothing to prepare with, and the
          hour before a journal club is spent working out what is actually
          arguable about the study rather than arguing about it. So there is now
          a Journal club tab: papers from the last two years on a chosen topic,
          each arriving with at least three points to raise and three questions
          to put to the room.
        </p>
        <p className="mt-3 text-muted">
          <strong>The prompts had to be grounded or not exist.</strong> The easy
          version writes three questions that fit any paper &mdash; what was the
          design, what were the limitations, does it change practice &mdash; and
          that is worse than no prompts at all, because it looks like
          preparation and teaches nothing. There is no LLM in this app to do
          better, so the substance comes from two things Europe PMC returns as
          structured JSON: NLM publication types, which name the design
          authoritatively rather than leaving it to be guessed from prose, and
          abstracts marked up with{" "}
          <span className={code}>&lt;h4&gt;Methods&lt;/h4&gt;</span> headings.
        </p>
        <p className="mt-3 text-muted">
          That is enough to be specific. A retrospective cohort gets told that
          confounding by indication is the standing threat; a meta-analysis gets
          told it inherits every bias of the studies pooled into it; a case
          report gets told it can prove something is possible and never how
          often. The results sentence is quoted back with a nudge to check
          whether the effect is absolute or relative, and the paper&apos;s own
          conclusion is quoted into a question &mdash;{" "}
          <em>
            what would have to be true of these patients for that to hold for
            yours?
          </em>{" "}
          Sample size is extracted when the methods state one, and deliberately
          not guessed when they don&apos;t: a wrong number in a discussion
          prompt is worse than no number, so anything shaped like a year is
          rejected outright.
        </p>
        <p className="mt-3 text-muted">
          <strong>Two things I chose to leave imperfect.</strong> Papers without
          an abstract are dropped rather than given generic prompts &mdash; the
          floor of three points exists to guarantee usefulness, not to be filled
          with filler, and the fallbacks that do exist still name this
          paper&apos;s journal, year or title. And the sample-size extractor
          misses abstracts that spell numbers out (&quot;Two thousand
          thirty-nine patients&quot;), which I found in live output and left
          alone: catching it means parsing written numerals, and the failure
          mode of missing a number is a quieter prompt, while the failure mode
          of parsing it wrong is a false one.
        </p>
      </section>

      <section
        id="update-2026-08-07-counts"
        className="scroll-mt-24 rounded-xl border border-primary-400/40 bg-primary-500/5 p-5"
      >
        <p className="text-xs font-semibold uppercase tracking-wider text-primary-600 dark:text-primary-400">
          Update &mdash; August 7, 2026
        </p>
        <h2 className="mt-1 mb-3 text-lg font-bold">
          Counts: papers per topic as plain numbers, split by population
        </h2>
        <p className="text-muted">
          The evidence badges answer &quot;is this crowded?&quot; but they round
          a number into a word, and the question I actually kept asking was
          numeric: how many papers, on this topic, in the last five years, about
          these patients. So there is now a Counts tab that is just that &mdash;
          every topic with its five-year count, sortable fewest-first so the
          thin ones rise to the top.
        </p>
        <p className="mt-3 text-muted">
          Picking a population adds two things to each row: the count within it,
          and the share of that topic&apos;s own total. The share is the part
          that earns its place. A raw filtered count can&apos;t distinguish a
          small topic from an underrepresented population &mdash; four papers is
          a lot for a niche question and nothing for a busy one. Reading{" "}
          <em>0 of 15 &middot; 0%</em> down a sorted column is the fastest way
          I&apos;ve found to see where a group simply hasn&apos;t been studied.
          It costs no extra request either: the unscoped and scoped scans are
          both already in the query cache, so the share is a division.
        </p>
        <p className="mt-3 text-muted">
          <strong>What I deliberately did not build.</strong> The obvious
          version of this is the full matrix &mdash; every topic against every
          population, precomputed. That is 384 upstream queries, roughly two
          minutes of paced calls, and the first visitor would wait all of it for
          a grid they would read four cells of. The split is fetched per topic,
          on expand, over the same five-year window as the column it came from.
          An all-time split sitting beside a five-year total would be two
          different questions sharing a row.
        </p>
        <p className="mt-3 text-muted">
          Filters that lead nowhere are now disabled rather than offered: once a
          population is selected, the remaining ones are counted on top of it
          and any combination that would return zero papers is greyed out with
          its count. Offering a filter that leads to an empty list wastes
          exactly the time this tool exists to save.
        </p>
      </section>

      <section
        id="update-2026-08-07-coverage"
        className="scroll-mt-24 rounded-xl border border-primary-400/40 bg-primary-500/5 p-5"
      >
        <p className="text-xs font-semibold uppercase tracking-wider text-primary-600 dark:text-primary-400">
          Update &mdash; August 7, 2026
        </p>
        <h2 className="mt-1 mb-3 text-lg font-bold">
          Every count says how far back it reaches
        </h2>
        <p className="text-muted">
          &quot;824 papers&quot; means nothing without knowing whether that is
          one year or forty, and the page was quietly leaving that to inference.
          The routes now return the window they actually counted, so Counts
          reads <em>Papers published 2021&ndash;2026</em> with real years rather
          than a vague &quot;last five years&quot;, and the all-time columns say
          plainly that they cover every year PubMed indexes. Publication lists
          name the oldest paper on screen &mdash; they are capped at the twenty
          newest, so that is the floor of what you are looking at, not the floor
          of what matched.
        </p>
        <p className="mt-3 text-muted">
          The demographic scans also say when they are still running. Sixteen
          paced upstream counts take about twenty seconds, and until this change
          the bars rendered at zero width in the meantime. On a page whose
          entire purpose is that a zero is a real finding, a scan in progress
          that looks identical to &quot;nobody has studied this&quot; is the
          worst possible failure. Now it says so, in words, and withholds the
          numbers until they are real.
        </p>
        <p className="mt-3 text-muted">
          Each population on the Demographics tab is also clickable now, opening
          the papers for that group as its own section underneath &mdash; scoped
          to the open topic when there is one, or the whole field when there
          isn&apos;t. Seeing that a group has 80 papers and being unable to read
          any of them was a dead end.
        </p>
      </section>

      <section
        id="update-2026-08-07-mobile"
        className="scroll-mt-24 rounded-xl border border-primary-400/40 bg-primary-500/5 p-5"
      >
        <p className="text-xs font-semibold uppercase tracking-wider text-primary-600 dark:text-primary-400">
          Update &mdash; August 7, 2026
        </p>
        <h2 className="mt-1 mb-3 text-lg font-bold">
          Mobile first, and the guard for a route I shipped broken
        </h2>
        <p className="text-muted">
          This page shipped with no <code className={code}>page.tsx</code>. It
          was registered in both registries, appeared on the index, and loaded
          an error page. Its own test rendered the content component directly,
          which passed happily while the route did not exist &mdash; the test
          asserted the wrong thing, which is the more interesting half of the
          bug.
        </p>
        <p className="mt-3 text-muted">
          Adding the file was one line. The fix worth having is the guard: a
          test now walks the feature and write-up registries and checks the
          filesystem for a real page behind every internal link. It failed on
          the branch naming this exact page, and it will fail for the next
          registry entry someone adds without a route. A one-line fix would have
          left the same hole open.
        </p>
        <p className="mt-3 text-muted">
          The explorer is also laid out for a phone now, and it needed to be: on
          a 390px screen the tab row ran off the right edge, so two of six tabs
          were unreachable &mdash; Demographics clipped, Sources invisible
          entirely. The demographic rows pinned a fixed-width label and count
          against a flexible bar, which left the bar a sliver. Labels and
          numbers now share a line with the bar full-width beneath, tap targets
          are 44px, cards stack instead of cramping, and the provenance sentence
          in the header is hidden on small screens because it was pushing the
          first real number below the fold.
        </p>
        <p className="mt-3 text-muted">
          <strong>One correction worth recording.</strong> I read the phone
          screenshot as showing the population chips clipped at the right edge
          and changed a <code className={code}>fieldset</code> to a labelled
          group to fix it. Measuring the elements in the browser showed the
          chips had been wrapping correctly the whole time and I had mistaken
          the fold for a cut. The change stayed, because a row of toggle buttons
          genuinely should not be a fieldset, but it fixed nothing &mdash; and I
          would rather have that written down than quietly filed as a win.
        </p>
      </section>

      <Section title="What's next">
        <ul className="space-y-2 text-sm text-muted">
          <Bullet>
            A sources panel to add, edit, or ignore databases and journals —
            deliberately scoped after the core, since finding research matters
            more than configuring where it comes from.
          </Bullet>
          <Bullet>
            Saving a snapshot of a scan so the same topics can be compared over
            months. That needs somewhere to put it, which this app doesn&apos;t
            have yet.
          </Bullet>
          <Bullet>
            Study-design tagging — RCT versus retrospective cohort versus case
            series — so &quot;12 papers&quot; can distinguish a settled question
            from twelve case reports.
          </Bullet>
          <Bullet>
            <strong className="text-foreground">
              Retune the badge thresholds, or stop hard-coding them.
            </strong>{" "}
            The 20 and 75 cutoffs come from one snapshot of the curated topics
            &mdash; five-year counts running 4 to 502, median 74 &mdash; and the
            literature will drift out from under them. Three options, roughly in
            order of effort. Retune the two constants when the spread moves,
            which is the honest minimum. Add a fourth band, since 12 of 25 still
            sit in Active and the busiest topic has 33 times the papers of the
            quietest. Or make the thresholds percentile-relative, computed from
            the current scan so they self-adjust &mdash; more robust, but the
            labels stop meaning a fixed thing and a topic can change band
            because its neighbours moved, not because it did. I&apos;d want to
            see a second snapshot before choosing.
          </Bullet>
          <Bullet>
            <strong className="text-foreground">
              A zero state that can actually be reached.
            </strong>{" "}
            &quot;No research yet&quot; is unreachable on a topic and always
            will be, because the topics are curated recognised areas. It fires
            only on topic-and-population intersections, which live on Counts.
            Either surface those intersections as first-class findings on the
            Topics tab &mdash; &quot;this topic has three populations with zero
            papers&quot; &mdash; or drop the badge from the topic scale and stop
            implying a state that cannot happen there.
          </Bullet>
          <Bullet>
            <strong className="text-foreground">A node graph</strong> of the
            whole corpus: papers as nodes, linked to the topics and populations
            they cover, so clusters and empty regions are visible at a glance
            rather than one query at a time. The tabs answer questions you
            already thought to ask; a graph would show the shape of the
            literature, including the gaps between clusters that no filter
            combination would surface because nobody would think to try it. The
            data is already there — every paper carries MeSH headings, and the
            topic and demographic clauses are exactly the edges — so this is a
            rendering problem rather than a data one. Deferred because laying
            out thousands of nodes usefully, and keeping it readable on a phone,
            is its own project.
          </Bullet>
        </ul>
      </Section>
      <Update
        id="update-2026-08-29-my-topics"
        date="August 29, 2026"
        title="Your own topics, without handing PubMed a raw query"
      >
        <p>
          The curated list answers &ldquo;which of these is unclaimed&rdquo;.
          The obvious next question is &ldquo;what about mine&rdquo;, and the
          tool had no answer. It does now: type a plain-language phrase and it
          gets everything a curated topic gets &mdash; a live evidence badge,
          recent papers from both databases, and the demographic filters.
        </p>
        <p>
          The interesting constraint is that this had to happen without ever
          letting a typed string reach PubMed as search syntax. That invariant
          already existed for discovered MeSH descriptors, and the shape it
          takes here is the same: each word is checked against a narrow pattern
          &mdash; letters, digits, inner hyphens, one to eight of them &mdash;
          and then <em>compiled</em> into <code>word[tiab]</code> clauses
          server-side rather than escaped and forwarded. Anything carrying
          quotes, brackets or a field tag is rejected outright, by the same rule
          in the browser and in the API, so the form can say no immediately
          without the two disagreeing later.
        </p>
        <p>
          Every custom search is still scoped to vascular surgery. A bare word
          like <code>thrombolysis</code> would otherwise measure all of
          medicine, and the number it produced would look exactly as
          authoritative as the curated ones while meaning something else
          entirely.
        </p>
        <p>
          Topics live in localStorage next to the custom journals, which keeps
          them personal to the browser and avoids inventing an account system
          for a page that has never needed one &mdash; at the cost, honestly
          stated, of them not following you to your phone.
        </p>
      </Update>

      <WhatsNext
        nowShipped={[
          "Curated topics carrying their own PubMed queries in PubMed syntax, so every number on the page traces back to a search anyone can paste in and check.",
          "Evidence thresholds calibrated against the real spread of counts rather than guessed — the first version put twenty of twenty-five topics in one bucket and promised a badge that could never appear.",
          "An upstream failure returns an error instead of rendering every topic as having no research, because on this page a zero is the finding and a lie in that direction is the most damaging one available.",
          "Discussion prompts built from indexed study design and structured abstracts, so they argue with a specific paper rather than fitting any paper.",
          "Topics of your own, compiled from plain words into title/abstract clauses server-side, so nothing typed into the page ever reaches PubMed as query syntax.",
        ]}
        couldImprove={[
          "No study-design tagging on the counts, so twelve papers cannot be told apart from twelve case reports without opening them.",
          "Nothing is persisted, so a scan cannot be compared with the same scan a month later — which is the obvious way to spot a field actually moving.",
          "The innovation signals are a hand-written list and will miss any technique they do not name.",
          "Custom topics live in localStorage, so they are personal to one browser and do not follow you to another device.",
        ]}
        upcoming={[
          "The node graph: papers as nodes linked to their topics and populations, so the gaps between clusters are visible at a glance rather than one query at a time.",
          "Study-design tagging on the counts, which would make the sparse/emerging/active scale considerably more meaningful.",
        ]}
      />
    </ThoughtLayout>
  );
}
