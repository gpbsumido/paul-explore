"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";

/** Only this signed-in account sees the gated tail of the write-up. */
const OWNER_EMAIL = "psumido@gmail.com";

type Me = { email: string | null };

function HazeSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3">
      <h2 className="text-lg font-bold">{title}</h2>
      {children}
    </section>
  );
}

/**
 * The blurred wall of text behind the lock panel. Deliberately NOT the gated
 * write-up -- none of that prose ships to a visitor. This is the pitch: why the
 * rest is worth asking for, and what you get if you do. Anyone who unblurs it in
 * devtools finds a straight answer rather than a leak, which is the point, so
 * it's written to be read.
 */
const HAZE = (
  <div className="space-y-8">
    <HazeSection title="Why I plan before I type">
      <p>
        If you can read this, you went looking, and I like that. The blur is not
        hiding a trade secret. It is hiding about ten more sections on how I
        plan, what the process costs me, and where I think it breaks down. I am
        happy to hand all of it over. I would just rather do it in a conversation
        than in a wall of text you skim once and forget.
      </p>
      <p>
        The short version: I write the plan before the code, as a real file with
        wireframes, a data model, and the list of failing tests I am about to
        write. Then I write the recap from the actual diff and call out every
        place reality drifted. The gap between those two documents is the whole
        point.
      </p>
    </HazeSection>

    <HazeSection title="Why bother interviewing me">
      <p>
        Because the interesting part of this is not that I wrote a process down.
        It is the reasoning underneath it, and that comes across far better when
        you can push back on it in real time. Ask me why the recap earns its keep
        on a messy branch. Ask me where the process is overhead I have not
        managed to justify yet. I have answers for both, including the
        uncomfortable one.
      </p>
      <p>
        I would also rather you judge me on the work than on a page that markets
        itself. This whole site is the artifact: the code, the tests, the
        history, the things I got wrong and then fixed in public. Read any of it.
        Then come ask me about the parts that look strange.
      </p>
    </HazeSection>

    <HazeSection title="What I am actually good at">
      <p>
        Shipping small, reversible changes without breaking the thing that
        already works. I write the test first because it is the cheapest way to
        find out I misunderstood the problem, and I keep the increments small
        enough that a bad call costs an afternoon instead of a sprint. That habit
        is most of what I bring.
      </p>
      <p>
        The rest is taste about boundaries: knowing when to reuse the mechanism
        that exists instead of inventing a parallel one, when a type should be
        strict, and when a clever abstraction is going to cost the next person
        more than it saves me today. I care a lot about the next person, who is
        usually me in four months.
      </p>
    </HazeSection>

    <HazeSection title="How I work with other people">
      <p>
        I say what I actually did, including the parts that did not work. If I
        drifted from the plan I write down that I drifted and why, because the
        undisclosed version is the only kind that hurts anyone. I would rather
        deliver an honest no than a confident maybe.
      </p>
      <p>
        I ask questions early, when they are cheap, and I would rather be told I
        am wrong on a wireframe than on a branch that took a week. If you want
        someone who will disagree with you in the planning meeting and then fully
        commit once it is decided, that is the way I like to work.
      </p>
    </HazeSection>

    <HazeSection title="So, get in touch">
      <p>
        The button below opens an email to me. There is no form, no funnel, and
        nothing gets collected. It is one message to one person, and I answer all
        of them.
      </p>
      <p>
        Tell me what you are building and I will tell you honestly whether I am
        the right fit for it. If I am not, I will say so. If I am, I will walk you
        through the rest of this write-up and anything else you want to open up.
      </p>
    </HazeSection>
  </div>
);

/**
 * Reveals its children only to the signed-in owner. Everyone else -- signed out,
 * signed in as someone else, or while the session is still loading -- gets the
 * blurred pitch with the "interview me first" panel riding on top of it. Reuses
 * the same GET /api/me session read the header and the flags console use, so
 * there's no second auth path to keep in sync.
 *
 * This is a reading gate, not a security boundary: the content is my own notes,
 * and the point is to make a visitor talk to me before they get the full thing.
 * It fails closed on purpose, so the gated prose never flashes for a visitor
 * while the session request is in flight, and it never reaches the browser at
 * all. The only thing under the blur is HAZE, which is written to be found.
 */
export default function Paywall({ children }: { children: React.ReactNode }) {
  const me = useQuery({
    queryKey: queryKeys.me(),
    queryFn: (): Promise<Me> =>
      fetch("/api/me").then((r) => {
        if (!r.ok) throw new Error("Failed to load user");
        return r.json();
      }),
    staleTime: 5 * 60_000,
  });

  if (me.data?.email === OWNER_EMAIL) return <>{children}</>;

  return (
    <div className="relative">
      <div
        data-testid="paywall-teaser"
        aria-hidden="true"
        className="pointer-events-none select-none px-4 blur-[3px] [mask-image:linear-gradient(to_bottom,black,black_70%,transparent)]"
      >
        {HAZE}
      </div>
      {/* Overlay spans the haze, so the panel's natural spot is the top of it.
          It stays off-screen until the blurred section reaches mid-viewport,
          then pins there and rides along to the end of the haze. */}
      <div className="pointer-events-none absolute inset-0">
        <aside
          aria-label="Members-only section"
          className="pointer-events-auto sticky top-[50vh] mx-auto w-fit max-w-xs -translate-y-1/2 rounded-xl border border-border bg-surface/85 px-5 py-4 text-center shadow-lg shadow-black/5 backdrop-blur-md"
        >
          <h2 className="text-sm font-bold text-foreground">
            <span aria-hidden="true">🔒</span> Interview me first
          </h2>
          <p className="mt-1 text-[13px] leading-snug text-muted">
            The rest is for people I&rsquo;ve talked to.
          </p>
          {/* Deliberately not a mailto. It routes through the résumé so anyone
              asking has seen the work first, and the notice there points them at
              the email. */}
          <Link
            href="/resume?from=interview"
            className="mt-3 inline-flex items-center justify-center rounded-lg bg-foreground px-3 py-1.5 text-xs font-semibold text-background transition-opacity hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            Get in touch to read on
          </Link>
        </aside>
      </div>
    </div>
  );
}
