import Link from "next/link";
import ThoughtLayout from "@/app/thoughts/ThoughtLayout";
import {
  Update,
  UpdateTimeline,
  WhatsNext,
  type UpdateEntry,
} from "@/app/thoughts/_shared/ThoughtUpdates";

/** Dated continuations, newest first — the feature grew a lot after the first cut. */
const UPDATES: UpdateEntry[] = [
  { id: "update-boosts", date: "Aug 22, 2026", title: "Rarity boosts for the moments that mattered" },
  { id: "update-sports", date: "Aug 22, 2026", title: "Nightly cards, three leagues, and history" },
];

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
          together: take a night of real box scores and mint each performance as
          a trading card, where the rarity is decided by how a player did
          relative to everyone else who played that night. The{" "}
          <Link
            href="/fantasy/nba/cards"
            className="underline underline-offset-2"
          >
            Card Lab
          </Link>{" "}
          does it for NBA (my fantasy roster) and WNBA (the whole slate), and
          this is where I drew the line.
        </>
      }
    >
      <UpdateTimeline entries={UPDATES} />

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

      <Section title="A pure engine, two thin adapters">
        <p>
          The generator (<C>generateCards</C>) knows nothing about ESPN. It takes
          a list of <C>PlayerPerformance</C> objects and returns cards, which
          makes it trivial to test against synthetic pools and keeps the sport a
          pluggable dimension. Everything ESPN-specific lives in adapters that
          each validate the raw payload with a Zod schema and drop anything
          malformed rather than throwing, so a half-empty response degrades to
          fewer cards instead of a broken page.
        </p>
        <p className="mt-3">
          There are two: one flattens the fantasy league roster into season
          totals, and one parses a night&rsquo;s box scores into per-game lines.
          The box-score parser is the important one — it&rsquo;s what makes the
          cards <em>nightly</em>.
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

      <Update
        id="update-sports"
        date="Aug 22, 2026"
        title="Nightly cards, three leagues, and history"
      >
        <p>
          Season totals were the wrong unit. A card should be a single night:
          &ldquo;36 points, this date, versus that team.&rdquo; So the default is
          a slate — the most recent night rostered players played — from
          ESPN&rsquo;s public scoreboard and box scores. Points sit at a
          different column per sport (NBA last, WNBA second), so the code finds
          the column by name and never hardcodes it. Discovery scans date-range
          windows back from today, so the off-season isn&rsquo;t a dead end: in
          August the NBA view lands on last June&rsquo;s Finals.
        </p>
        <p>
          WNBA turned out to have a real ESPN fantasy game (<C>wfba</C>), so it
          scopes to my roster when the league is public (or my cookies are set),
          and otherwise falls back to the whole night&rsquo;s slate. NFL is
          weekly and its metric is fantasy points, which the public box score
          doesn&rsquo;t carry — so NFL reads the league itself per week, with a
          picker across all 18. One engine, one page, a sport toggle.
        </p>
      </Update>

      <Update
        id="update-boosts"
        date="Aug 22, 2026"
        title="Rarity boosts for the moments that mattered"
      >
        <p>
          Relative rarity is the base, but not every 20-point night is equal. A
          card now bumps up a tier when the player&rsquo;s real team{" "}
          <em>won</em>, another when it was a <em>playoff</em> game, and hardest
          of all for a fantasy <em>playoff or finals</em> run — so a quiet Finals
          night that ended in a win can still mint an SIR. Each shows as a badge,
          alongside the fantasy team that rosters the player. Boosts never lift a
          zero or negative outing, and they stack, capped at SIR.
        </p>
        <p>
          The win and playoff signals come straight from the box score I already
          fetch; the fantasy playoff/finals signal is wired through the engine
          and tested, with sourcing it from the league&rsquo;s matchup view the
          next step. Card art is still the ESPN headshot; the photo from that
          exact game is a harder problem for later.
        </p>
      </Update>

      <WhatsNext
        nowShipped={[
          "A pure, relative-rarity engine with a boost layer (win, playoff, fantasy playoff/finals), fully tested against synthetic pools.",
          "Real cards across three leagues: NBA and WNBA nightly from box scores, NFL weekly from fantasy scoring, with previous-season history.",
          "A sport toggle, an NFL week picker, a rarity filter, roster-team and boost badges, and empty/error/loading states.",
        ]}
        couldImprove={[
          "The fantasy win/playoff/finals boost is wired but not yet fed from the league's matchup view, so it's dormant until that lands.",
          "There's no economy: no currency, no packs, no ripping, because there's nowhere yet to persist what people own.",
          "Card art is a generic headshot; the photo from that exact game the concept really wants isn't sourced yet.",
        ]}
        upcoming={[
          "Feed the fantasy-matchup boost from the league so a finals-week performance is automatically rarer.",
          "Wire per-user persistence so packs can be bought, ripped with the weighted odds already defined, and kept.",
        ]}
      />
    </ThoughtLayout>
  );
}
