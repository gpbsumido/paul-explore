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

export default function FantasyTcgContent() {
  return (
    <ThoughtLayout
      breadcrumb="Fantasy TCG"
      title="Fantasy TCG"
      intro={
        <>
          I already had a Pokémon TCG browser and a whole Fantasy NBA section
          wired to an ESPN league. This is the write-up on stitching the two
          together: take a week of real roster performances and mint each one as
          a trading card, where the rarity is decided by how a player did
          relative to everyone else in the pool. The{" "}
          <Link
            href="/fantasy/nba/cards"
            className="underline underline-offset-2"
          >
            Card Lab
          </Link>{" "}
          is the first slice of a bigger idea, and this is where I drew the line.
        </>
      }
    >
      <Section title="The idea, and the part I actually built">
        <p>
          The full pitch is a small economy: check your ESPN roster and your
          weekly matchup, earn currency off however many points your opponent
          puts up, spend it on packs, and rip weighted pulls of cards generated
          from every rostered player&rsquo;s real performance that week. A quiet
          game mints a plain card; a monster line mints something rare.
        </p>
        <p className="mt-3">
          That is a lot of moving parts, and most of them need somewhere to
          store state that this repo doesn&rsquo;t have. So I built the one piece
          that is genuinely new and that everything else leans on: the generator
          that turns performances into rarity-tiered cards. The economy comes
          later, once there&rsquo;s a place to keep what people own.
        </p>
      </Section>

      <Section title="Rarity is relative, not a points threshold">
        <p>
          The obvious version assigns rarity by absolute points: 50 is an SIR, 10
          is a common. I didn&rsquo;t do that, because a fantasy week isn&rsquo;t
          graded on an absolute scale. A 30-point night is a monster in a slow
          week and unremarkable in a shootout. So the engine scores each player
          by <span className="font-medium">percentile within that week&rsquo;s
          pool</span>: top of the pack earns an SIR, the next slice a rare, the
          middle an uncommon, and the rest a common.
        </p>
        <ul className="mt-3 space-y-2">
          <Bullet>
            A zero or negative outing can never beat common, so a bad week always
            mints a plain card no matter how badly everyone else also did.
          </Bullet>
          <Bullet>
            A shallow pool caps at rare. With only two or three players there
            aren&rsquo;t enough peers to say anyone was rare-relative-to-others,
            so an SIR would be noise, not signal.
          </Bullet>
          <Bullet>
            Ties resolve to the same rarity, and each card&rsquo;s id is derived
            from <C>sport-player-period</C>, so regenerating the same week is
            idempotent — it produces the exact same cards.
          </Bullet>
        </ul>
        <p className="mt-3">
          Keeping the thresholds as named constants means tuning &ldquo;how rare
          is an SIR&rdquo; is one edit and a test change, not a hunt through
          branching logic.
        </p>
      </Section>

      <Section title="A pure engine with a thin ESPN adapter">
        <p>
          The generator (<C>generateCards</C>) knows nothing about ESPN. It takes
          a list of <C>PlayerPerformance</C> objects and returns cards, which
          makes it trivial to test against synthetic pools and keeps the sport a
          pluggable dimension — NBA now, WNBA and NFL later, same engine. The
          ESPN-specific part is a separate adapter that validates the league
          payload with a Zod schema and flattens every rostered player into a
          performance. Anything that doesn&rsquo;t match the shape gets dropped
          rather than throwing, so a malformed or half-empty response degrades to
          fewer cards instead of a broken page.
        </p>
      </Section>

      <Section title="Card art, and an honest limit">
        <p>
          The dream card is game-specific: &ldquo;Wemby, 50 points, this exact
          date,&rdquo; with a photo from that night. Sourcing a photo of a
          specific game programmatically is its own project, so for now every
          card uses the player&rsquo;s ESPN headshot — which is already
          allowlisted in the site&rsquo;s content-security policy, so it renders
          without loosening anything. The performance and period ride as the
          card&rsquo;s metadata. Game-specific art is a later piece, and the card
          layout already has a slot for it.
        </p>
        <p className="mt-3">
          One thing I checked rather than assumed: recent seasons of the league
          read fine over the public endpoint, but an older or private season
          answers with <C>AUTH_LEAGUE_NOT_VISIBLE</C>. So the page has to treat a
          missing season as normal — it degrades to an empty or error state
          rather than breaking — and I deliberately made the engine&rsquo;s
          correctness independent of live data, unit-testing it against pools I
          construct instead of a network call that might not answer.
        </p>
      </Section>

      <Section title="Why the economy isn&rsquo;t here yet">
        <p>
          Currency, pack inventory, owned cards, and pull history are all
          per-user state that has to persist. In this app that lives in a
          separate service, not in the front end, so doing it properly is its own
          change with its own schema. I&rsquo;d rather ship the generator, prove
          the pipeline from a real roster to a real card, and build the economy
          on top of something that already works. The one piece of the economy I
          did bake in early is the pull-weighting contract — each rarity carries
          a weight that strictly decreases as it gets rarer — so when the rip
          arrives, the odds are already defined and tested.
        </p>
      </Section>

      <WhatsNext
        nowShipped={[
          "A pure, relative-rarity card generator, fully tested against synthetic pools rather than a live league.",
          "A Zod-validated ESPN adapter that drops malformed roster entries instead of throwing.",
          "A Card Lab page that filters cards by rarity, with proper empty, error, and loading states.",
        ]}
        couldImprove={[
          "Rarity uses each player's season total right now, not a specific week's game log — the honest signal I could get without live weekly data.",
          "Card art is a generic headshot; the game-specific photo the concept really wants isn't sourced yet.",
          "There's no economy: no currency, no packs, no ripping, because there's nowhere yet to persist what people own.",
        ]}
        upcoming={[
          "Wire per-user persistence so packs can be bought, ripped with the weighted odds already defined, and kept.",
          "Pull real weekly game logs so a card can say '50 points, this date' instead of a season total.",
        ]}
      />
    </ThoughtLayout>
  );
}
