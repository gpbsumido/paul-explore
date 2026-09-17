import Link from "next/link";
import ThoughtLayout from "@/app/thoughts/ThoughtLayout";
import { Update, WhatsNext } from "@/app/thoughts/_shared/ThoughtUpdates";

/** Inline monospace token, matching the code styling across thoughts pages. */
function C({ children }: { children: React.ReactNode }) {
  return (
    <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
      {children}
    </code>
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

export default function IntervieweeThoughtsContent() {
  return (
    <ThoughtLayout
      breadcrumb="Interviewee"
      title="Interviewee"
      intro={
        <>
          A deck I open mid-interview:{" "}
          <Link
            href="/interviewee"
            className="font-medium text-foreground underline decoration-border underline-offset-4 hover:decoration-foreground"
          >
            /interviewee
          </Link>{" "}
          is organised by job interview &mdash; pick one, and it shows the
          topics for that round; pick a topic, and it opens the bullet-point
          answers with the detail tucked behind a disclosure. The whole thing is
          driven by one data shape, so I can paste in a fresh batch of prep notes
          and have the pages just work. It&rsquo;s an admin-only tool on the{" "}
          <Link
            href="/"
            className="font-medium text-foreground underline decoration-border underline-offset-4 hover:decoration-foreground"
          >
            dashboard
          </Link>{" "}
          &mdash; the content is mine to rehearse, not to publish. This is the
          write-up on why it&rsquo;s built the way it is.
        </>
      }
    >
      <Section title="One shape, fed from markdown">
        <p>
          The thing I wanted was not a page, it was a format. The deck is
          organised by job interview: an <C>Interview</C> owns a list of{" "}
          <C>IntervieweeTopic</C>s, each an id, a title, a one-line summary, a
          list of questions with headline points and optional detail, and the
          ids of related topics in the same interview. The schemas live in{" "}
          <C>src/lib/interviewee/types.ts</C> and are the trust boundary: a test
          parses every interview against them, so a malformed paste fails a test
          rather than a page.
        </p>
        <p className="mt-3">
          That means the workflow is: write notes in the markdown template, hand
          them over to be transformed into <C>interviews.data.ts</C>, and the
          deck, the interview pages, the topic pages, the related cards, and the
          keyboard shortcuts all come out the other side for free. The format is
          the feature; the pages are just a view of it. Related ids resolve{" "}
          <em>within</em> an interview, so the same topic slug can mean different
          things in two different rounds.
        </p>
      </Section>

      <Section title="Behind sign-in, because the content is mine">
        <p>
          The prep notes are personal &mdash; my actual answers for a specific
          company&rsquo;s round &mdash; so the whole feature is admin-only, gated
          exactly like the to-do list. The route is in the session-protected
          prefixes (a signed-out visitor lands on login with a{" "}
          <C>returnTo</C>), and every page then re-checks the admin allowlist and{" "}
          <C>notFound()</C>s anyone else &mdash; a 404 rather than a 403, so the
          page&rsquo;s existence isn&rsquo;t confirmed. Because the pages read the
          session, they&rsquo;re <C>force-dynamic</C> and dropped from the public
          route list, so nothing about them reaches the sitemap. The write-up you
          are reading stays public; the deck itself does not.
        </p>
      </Section>

      <Section title="Keyboard-first, because that's how I'd actually use it">
        <p>
          Mid-interview I don&rsquo;t want to be aiming a cursor. So the deck is
          driven from the keyboard two ways, matching two moods:
        </p>
        <ul className="mt-3 space-y-2">
          <Bullet>
            <span className="font-medium text-foreground">Numbers 1&ndash;9</span>{" "}
            jump straight to a card from anywhere on the page &mdash; the fast
            path when I know where I&rsquo;m going.
          </Bullet>
          <Bullet>
            <span className="font-medium text-foreground">Arrow keys</span> walk
            the grid once a card has focus, a roving-tabindex so the whole grid
            is one tab stop and the arrows don&rsquo;t fight the rest of the page.
          </Bullet>
          <Bullet>
            On a topic, <C>Esc</C> drops back to the deck and the related
            cards keep their own numbers, so I can hop sideways without going
            back first.
          </Bullet>
        </ul>
        <p className="mt-3">
          All of it is guarded against firing while I&rsquo;m typing, and every
          card carries an <C>aria-keyshortcuts</C> so the shortcut is announced,
          not just wired.
        </p>
      </Section>

      <Section title="Answered, but not gone">
        <p>
          Once I&rsquo;ve rehearsed a topic I want it out of the way without
          losing it. Marking a topic answered drops it from the &ldquo;To
          review&rdquo; grid into an &ldquo;Answered&rdquo; one below &mdash;
          still a card, still openable, with a one-tap way to pull it back into
          rotation. The state is a rehearsal preference, not data, so it lives in{" "}
          <C>localStorage</C> via the same <C>useSyncExternalStore</C> pattern
          the rest of the site uses for device-local settings, rather than a
          datastore this doesn&rsquo;t need.
        </p>
      </Section>

      <Update
        id="update-2026-09-17-search"
        date="September 17, 2026"
        title="I'd filed search under someday. It was a pure function and a text box."
      >
        <p>
          The closing block below used to list &ldquo;search or a tag
          filter&rdquo; as a someday. The first time an interview grew past a
          screen I wanted it immediately, and it turned out to be small.
        </p>

        <h3 className="mt-5 mb-2 text-[15px] font-semibold text-foreground">
          The match had to go all the way down, not just titles.
        </h3>
        <p className="text-muted">
          Searching &ldquo;performance&rdquo; and only matching a topic called
          Performance would miss the point a paragraph deep in the refactor
          topic. So the searchable text for a topic is everything: the interview
          it sits in, the topic&rsquo;s title and summary, and every question,
          point, and expandable detail &mdash; joined once and lowercased, so a
          match is a plain substring check and every whitespace-separated term
          has to hit (AND, so terms narrow).
        </p>
        <pre className="mt-3 overflow-x-auto rounded-lg bg-surface p-3 text-[13px] font-mono text-foreground">
          {`[interview.title, interview.summary,
 topic.title, topic.summary,
 ...topic.entries.flatMap(e => [e.question, ...e.points, ...(e.details ?? [])])
].join(" ").toLowerCase()`}
        </pre>

        <h3 className="mt-5 mb-2 text-[15px] font-semibold text-foreground">
          Keeping it out of the keyboard&rsquo;s way.
        </h3>
        <p className="text-muted">
          The deck already grabs number and arrow keys for card nav, which would
          fight a search box. It didn&rsquo;t, because that handler already
          stood down whenever focus was in a field &mdash; so digits and arrows
          type into the box, and Enter opens the top result. The search is a
          pure function I could unit-test on its own; the deck just renders the
          interviews when the box is empty and the hits when it isn&rsquo;t.
        </p>

        <h3 className="mt-5 mb-2 text-[15px] font-semibold text-foreground">
          A title hit shouldn&rsquo;t weigh the same as a footnote.
        </h3>
        <p className="text-muted">
          The first cut sorted by document order, so a topic called Performance
          could sit below one that merely mentions the word in a bullet. The fix
          is to score by how shallow the match is &mdash; the shallowest tier
          whose text contains every term wins, and results sort by that rank.
        </p>
        <pre className="mt-3 overflow-x-auto rounded-lg bg-surface p-3 text-[13px] font-mono text-foreground">
          {`rank 0: title
rank 1: + summary + interview
rank 2: + questions
rank 3: + points & details   // a match only this deep sinks`}
        </pre>

        <h3 className="mt-5 mb-2 text-[15px] font-semibold text-foreground">
          Reviewed isn&rsquo;t forever.
        </h3>
        <p className="text-muted">
          &ldquo;Reviewed&rdquo; used to be a boolean, which is a lie &mdash; I
          forget things. So the store keeps a timestamp per topic now, and a
          topic reviewed more than three days ago resurfaces on its interview
          page as &ldquo;Due to revisit,&rdquo; sorted to the top of the reviewed
          list. A small spaced-repetition nudge, no scheduler.
        </p>

        <h3 className="mt-5 mb-2 text-[15px] font-semibold text-foreground">
          No account, but still portable.
        </h3>
        <p className="text-muted">
          The obvious next step for the reviewed count was &ldquo;sync it to my
          account,&rdquo; but that means a table and an endpoint in the separate
          backend repo &mdash; more than the need justified. The lighter answer:
          export the map to a string, paste it on the other machine, merge. It
          moves between my devices without a server, and a real account sync can
          come later if I actually want it.
        </p>
      </Update>

      <WhatsNext
        nowShipped={[
          "An admin-only deck at /interviewee organised by job interview, driven by one Interview/IntervieweeTopic shape.",
          "Interview pages, topic pages with expandable detail, related-card hops within an interview, and back routes at each level.",
          "Number and arrow-key navigation at every level, plus Esc to return from a topic to its interview.",
          "Reviewed topics demoted but kept reachable, persisted per device and keyed by interview + topic.",
          "The Sardine hiring-manager round loaded in, plus a general-practice interview, from the markdown template.",
          "Full-text search across every interview and topic — titles and all the inner text — in a ranked dropdown, with Enter to open the top result.",
          "A spaced-repetition nudge: topics reviewed more than three days ago flagged 'Due to revisit' and floated up their interview's reviewed list.",
          "Export/import of reviewed progress, so it moves between my devices without a server.",
        ]}
        couldImprove={[
          "Ranking is coarse tiers, not real scoring — term frequency or proximity would order the deep matches better.",
          "The revisit threshold is a flat three days; a proper schedule would space repeats out as a topic sticks.",
          "Export/import is manual — a real account-backed sync (an endpoint in the backend repo) would make it automatic across devices.",
        ]}
        upcoming={[
          "Nothing scheduled — it does what I need for the next round of interviews.",
        ]}
      />
    </ThoughtLayout>
  );
}
