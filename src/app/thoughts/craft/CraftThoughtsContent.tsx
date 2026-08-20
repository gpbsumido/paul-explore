import Link from "next/link";
import ThoughtLayout from "@/app/thoughts/ThoughtLayout";
import { WhatsNext } from "@/app/thoughts/_shared/ThoughtUpdates";
import { CRAFT_TRAITS } from "@/lib/craft";

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

export default function CraftThoughtsContent() {
  return (
    <ThoughtLayout
      breadcrumb="Craft"
      title="Craft"
      intro={
        <>
          A résumé says &ldquo;strong performance skills.&rdquo; Anyone can. The{" "}
          <Link
            href="/craft"
            className="paul-touch-min inline-flex items-center font-medium text-foreground underline underline-offset-2"
          >
            Craft page
          </Link>{" "}
          tries the opposite: name the traits a lead front-end developer is
          actually measured on, then hang each one off something in this project
          you can open and check. Fewer adjectives, more receipts.
        </>
      }
    >
      <Section title="Why build this at all">
        <p>
          This whole site is already the portfolio. Every feature and every
          dev-note is a small argument for some competency, but that argument is
          scattered. Someone skimming the hub sees a calendar and a Pokédex, not
          &ldquo;system design&rdquo; or &ldquo;type safety.&rdquo; The Craft
          page is the missing index: it names the trait, then points at the
          proof. It turns a pile of demos into a claim with citations.
        </p>
        <p className="mt-3">
          The traits themselves are the ones that separate a senior who ships
          from a lead who is trusted with the shape of the whole front end:{" "}
          {CRAFT_TRAITS.map((t, i) => (
            <span key={t.id}>
              {i > 0 ? ", " : ""}
              <span className="font-medium text-foreground">{t.title}</span>
            </span>
          ))}
          .
        </p>
      </Section>

      <Section title="Evidence over adjectives">
        <p>
          The design rule was simple: no trait ships without at least two pieces
          of evidence, and every piece of evidence is a real, reachable page.
          &ldquo;Performance&rdquo; links to the live{" "}
          <Link href="/vitals" className="underline underline-offset-2">
            Web Vitals
          </Link>{" "}
          dashboard and the write-ups on bundle size, render cost, and tree
          shaking. &ldquo;Working with libraries&rdquo; links to the Motion and
          Particle labs and the note on why this site drops Apollo for a plain
          fetch. The page argues from things you can click, not from a list of
          buzzwords.
        </p>
      </Section>

      <Section title="The test that keeps it honest">
        <p>
          The risk with a page like this is rot. A write-up gets renamed, a
          route moves, and suddenly &ldquo;proof&rdquo; is a 404. So the trait
          data lives in <C>src/lib/craft.ts</C> and a test walks every evidence
          link and asserts it resolves to a real feature href, a real dev-note
          href, or a small allow-list of known routes.
        </p>
        <ul className="mt-3 space-y-2">
          <Bullet>
            Cross-checking against the live <C>FEATURES</C> and <C>THOUGHTS</C>{" "}
            arrays means a dead evidence link fails CI, not the reader.
          </Bullet>
          <Bullet>
            Every trait needs a unique id and at least two links, so the page
            can never quietly degrade into a one-source claim.
          </Bullet>
          <Bullet>
            The data is the source of truth for the page copy, the mini-preview
            on the hub card, and this very paragraph&apos;s trait list, so they
            can&apos;t drift apart.
          </Bullet>
        </ul>
      </Section>

      <Section title="Accessible by construction">
        <p>
          Each trait is a header <C>button</C> that owns its{" "}
          <C>aria-expanded</C> state and points at the panel it controls with{" "}
          <C>aria-controls</C>, so the whole matrix is operable from the
          keyboard with a visible focus ring. Everything starts expanded so
          nothing hides behind a click, a single toggle collapses or expands the
          set, and the reveal animation is gated on{" "}
          <C>prefers-reduced-motion</C>. A <C>vitest-axe</C> scan in the test
          suite fails the build on a violation.
        </p>
      </Section>

      <Section title="What I&rsquo;d revisit">
        <p>
          Right now the traits are hand-ordered and self-selected, which is
          honest but subjective. A future version could weight each trait by how
          much evidence actually backs it, or let a reader filter the hub by the
          trait they care about. For now the goal was smaller and worth doing on
          its own: make the implicit claim of the whole site explicit, and make
          it impossible to leave a broken citation behind.
        </p>
      </Section>
      <WhatsNext
        nowShipped={[
          "Every trait is backed by a link to the work in this repo that demonstrates it, because a list of adjectives about yourself is worth nothing.",
          "A test that fails when a trait points at something that no longer exists, so the page cannot rot into claims with dead evidence behind them.",
        ]}
        couldImprove={[
          "The evidence is hand-picked and hand-maintained. It proves the trait on the day it was written and nothing keeps it current as better examples land.",
          "Traits are prose in a component rather than data, so adding one means editing a React file.",
        ]}
        upcoming={[
          "Nothing scheduled. This page has barely changed since it was written, and saying so is more honest than manufacturing a roadmap for it.",
        ]}
      />
    </ThoughtLayout>
  );
}
