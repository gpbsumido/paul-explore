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

      <Section title="Nightly cards, and where WNBA comes from">
        <p>
          Season totals were the wrong unit. A card should be a single night:
          &ldquo;36 points, this date, versus that team.&rdquo; So the default
          view is a slate — the most recent night rostered players actually
          suited up — pulled from ESPN&rsquo;s public scoreboard and box-score
          endpoints. Points sit at a different column per sport (NBA has them
          last, WNBA second), so the code finds the column by name and never
          hardcodes an index. Rarity is judged against that night&rsquo;s slate,
          not the season, which is what makes a 40-point night on a quiet evening
          feel rare.
        </p>
        <p className="mt-3">
          WNBA was the interesting problem. It turns out ESPN does run women&rsquo;s
          fantasy basketball — game code <C>wfba</C> — so there is a real league to
          key off. The catch is mine is private, and I didn&rsquo;t want to babysit
          a login: the clean fix is to ask the commissioner to make the league
          public, after which it reads with no auth at all, exactly like the NBA
          one. Failing that, the app will read it with my own ESPN cookies from
          env vars. And if it can&rsquo;t read the league either way, it falls back
          to the whole night&rsquo;s public box scores, so the view always shows
          something. NBA keeps its roster filter (fantasy player ids are just ESPN
          athlete ids, so the intersection is free). Same engine, same page, one
          sport toggle. NBA&rsquo;s off-season has no slate to show, so between
          June and October the NBA view quietly falls back to season cards rather
          than a bare empty page.
        </p>
        <p className="mt-3">
          Card art is still the player&rsquo;s ESPN headshot — allowlisted in the
          site&rsquo;s CSP, so it renders without loosening anything — with the
          points, date, and opponent as the card&rsquo;s metadata. A photo from
          that exact game is a harder sourcing problem, and its own later piece;
          the card layout already has the slot.
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
          "A pure, relative-rarity card generator, fully tested against synthetic pools rather than a live feed.",
          "Nightly cards from real box scores — points, date, and opponent — for NBA (my fantasy roster) and WNBA (the whole slate).",
          "A sport toggle, a rarity filter, and empty/error/loading states, with an off-season fallback to season cards for NBA.",
        ]}
        couldImprove={[
          "Card art is a generic headshot; the photo from that exact game the concept really wants isn't sourced yet.",
          "There's no economy: no currency, no packs, no ripping, because there's nowhere yet to persist what people own.",
          "A night with lots of games fans out into many box-score fetches; fine with caching, but a single feed would be cheaper.",
        ]}
        upcoming={[
          "Wire per-user persistence so packs can be bought, ripped with the weighted odds already defined, and kept.",
          "Source game-specific art so a card can show the shot, not just the headshot.",
        ]}
      />
    </ThoughtLayout>
  );
}
