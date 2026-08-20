import Link from "next/link";
import ThoughtLayout from "@/app/thoughts/ThoughtLayout";
import { WhatsNext } from "@/app/thoughts/_shared/ThoughtUpdates";

/** Inline monospace token, matches the code styling used across thoughts pages. */
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

export default function CommandPaletteThoughtsContent() {
  return (
    <ThoughtLayout
      breadcrumb="Command Palette"
      title="Command Palette"
      intro={
        <>
          Every page on this site can be reached with a keystroke.{" "}
          <span className="font-medium text-foreground">⌘K</span> (or{" "}
          <span className="font-medium text-foreground">Ctrl+K</span>, or a bare{" "}
          <span className="font-medium text-foreground">/</span> when you
          aren&rsquo;t typing) opens a palette that fuzzy-searches every
          feature, dev-note, and the handful of actions worth having a shortcut
          for. This is the write-up on how it&rsquo;s built, and why it leans on
          data the site already had.
        </>
      }
    >
      <Section title="One instance, opened from anywhere">
        <p>
          The palette is a single component mounted high in the tree, not
          something each page renders for itself. That&rsquo;s the whole trick
          that keeps it simple: there&rsquo;s exactly one piece of open/closed
          state, one keyboard listener, one focus trap. A global <C>keydown</C>{" "}
          listener opens it on <C>⌘K</C>/<C>Ctrl+K</C> from anywhere, or on a
          lone <C>/</C> — but only when you&rsquo;re not typing into an{" "}
          <C>input</C>, <C>textarea</C>, <C>select</C>, or a{" "}
          <C>contenteditable</C>, so the slash key stays a normal keystroke in a
          form.
        </p>
        <p className="mt-3">
          Some surfaces want their own visible trigger instead of a floating
          pill. The graph landing and the hub fill every corner with their own
          chrome, so there a &ldquo;Search&rdquo; affordance sits in the header
          and opens the same palette by dispatching a window event —{" "}
          <C>commandpalette:open</C> — rather than being wired to its internal
          state. The keyboard hotkey already worked off a window listener, so
          the event is just the same door with a second handle.
        </p>
      </Section>

      <Section title="The registry is the hub's data, reused">
        <p>
          The palette doesn&rsquo;t keep its own list of what exists. It builds
          the searchable set from the exact same <C>FEATURES</C> and{" "}
          <C>THOUGHTS</C> arrays the{" "}
          <Link href="/" className="underline underline-offset-2">
            hub
          </Link>{" "}
          and the{" "}
          <Link href="/thoughts" className="underline underline-offset-2">
            dev-notes index
          </Link>{" "}
          render from, plus a few core static pages (Home, Settings, Résumé) and
          one non-navigation action: toggle the theme.
        </p>
        <ul className="mt-3 space-y-2">
          <Bullet>
            Add a feature to the hub and it shows up in the palette for free —
            there is no second place to register it, so the two can&rsquo;t
            drift apart.
          </Bullet>
          <Bullet>
            Each command carries a keyword list seeded from its title and id, so
            a query can still hit an entry when the visible label doesn&rsquo;t
            contain the letters you typed.
          </Bullet>
          <Bullet>
            Results stay grouped — Pages, Dev Notes, Actions — so a growing
            registry reads as sections rather than one long list.
          </Bullet>
        </ul>
      </Section>

      <Section title="A fuzzy matcher small enough to read">
        <p>
          Rather than pull in a search dependency, the matcher is a greedy
          subsequence scan you can read end to end. It walks the query left to
          right, consumes the next matching character in the text, and scores
          each hit by where it lands: a bonus for a prefix match, a smaller one
          for landing at a word boundary (after a space, <C>-</C>, <C>/</C>, or{" "}
          <C>_</C>), and another for a run of consecutive characters. An empty
          query matches everything with a neutral score, so the palette shows
          the full registry the moment it opens.
        </p>
        <p className="mt-3">
          It also returns the matched character ranges, folded into contiguous
          spans, so the UI can <span className="font-medium">highlight</span>{" "}
          the part of each result you actually typed — the scoring and the
          highlighting come from the same pass instead of matching twice.
        </p>
      </Section>

      <Section title="An honest combobox, not a div with a listener">
        <p>
          The palette is a real ARIA combobox. The input owns the interaction;
          arrow keys, <C>Enter</C>, and <C>Escape</C> all live on it, and it
          points at the active result with <C>aria-activedescendant</C> rather
          than moving DOM focus into the list. That&rsquo;s the pattern screen
          readers expect from a search box that filters a list beneath it, and
          it means keyboard users never lose the caret while they navigate.
        </p>
        <p className="mt-3">
          Two <C>jsx-a11y</C> lint rules fire false positives on this shape —
          they want keyboard handlers on the individual option rows, but in this
          pattern the keyboard lives on the input, not the options — so those
          are the only two suppressions, documented at the call site. The
          shortcut-hint text is platform-aware (<C>⌘K</C> on Apple devices,{" "}
          <C>Ctrl K</C> elsewhere), resolved after mount so it stays
          hydration-safe, and its colour clears WCAG AA contrast.
        </p>
      </Section>

      <Section title="What I&rsquo;d revisit">
        <p>
          Today the only non-navigation command is the theme toggle. The
          registry is shaped to hold more — anything with an <C>actionId</C>
          instead of an <C>href</C> — so recent pages, &ldquo;copy current
          URL,&rdquo; or per-feature actions could slot in without touching the
          matcher or the combobox. The deliberate call for the first version was
          to make everything the site already has reachable in one keystroke,
          and to do it without a search library or a second source of truth to
          keep in sync.
        </p>
      </Section>
      <WhatsNext
        nowShipped={[
          "One instance mounted once and opened from anywhere, rather than a palette per page that would drift in behaviour.",
          "The registry built from the hub's own feature data, so a new feature appears in the palette without being registered twice.",
          "A fuzzy matcher small enough to read in one sitting, instead of a dependency for eighty lines of logic.",
        ]}
        couldImprove={[
          "Only static routes and features are indexed. It cannot find a specific card, store or paper, which is what people would actually search for.",
          "There is no recent or frequent ordering, so the tenth use is exactly as much work as the first.",
          "The matcher has no notion of aliases, so the word someone actually types has to be in the title.",
        ]}
        upcoming={[
          "Index deeper than routes, starting with whatever a page's own search already knows how to find.",
        ]}
      />
    </ThoughtLayout>
  );
}
