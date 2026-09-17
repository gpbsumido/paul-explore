import Link from "next/link";
import ThoughtLayout from "@/app/thoughts/ThoughtLayout";
import { WhatsNext } from "@/app/thoughts/_shared/ThoughtUpdates";

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
          shows topic cards, a card opens the bullet-point answers with the
          detail tucked behind a disclosure, and the whole thing is driven by
          one data shape so I can paste in a fresh batch of prep notes and have
          the pages just work. It&rsquo;s one of the tools on the{" "}
          <Link
            href="/"
            className="font-medium text-foreground underline decoration-border underline-offset-4 hover:decoration-foreground"
          >
            dashboard
          </Link>
          . This is the write-up on why it&rsquo;s built the way it is.
        </>
      }
    >
      <Section title="One shape, fed from markdown">
        <p>
          The thing I wanted was not a page, it was a format. Everything the deck
          renders comes from a single{" "}
          <C>IntervieweeTopic</C> array &mdash; an id, a title, a one-line
          summary, a list of questions each with headline points and optional
          detail, and the ids of related topics. The schema lives in{" "}
          <C>src/lib/interviewee/types.ts</C> and is the trust boundary: a test
          parses every topic against it, so a malformed paste fails a test rather
          than a page.
        </p>
        <p className="mt-3">
          That means the workflow is: write notes in the markdown template, hand
          them over to be transformed into <C>topics.data.ts</C>, and the deck,
          the topic pages, the related cards, and the keyboard shortcuts all come
          out the other side for free. The format is the feature; the pages are
          just a view of it.
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

      <WhatsNext
        nowShipped={[
          "A deck at /interviewee driven by one IntervieweeTopic shape, with topic pages, related-card hops, and a back route.",
          "Number and arrow-key navigation, plus Esc to return to the deck.",
          "Answered topics demoted but kept reachable, persisted per device.",
          "A markdown template so a batch of notes transforms straight into the data.",
        ]}
        couldImprove={[
          "Search or a tag filter would help once the deck grows past a screen.",
          "A spaced-repetition nudge could resurface a topic I marked answered a while ago.",
        ]}
        upcoming={[
          "Nothing scheduled — it does what I need for the next round of interviews.",
        ]}
      />
    </ThoughtLayout>
  );
}
