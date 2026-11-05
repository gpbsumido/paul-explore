import ThoughtLayout from "@/app/thoughts/ThoughtLayout";
import {
  UpdateTimeline,
  Update,
  WhatsNext,
} from "@/app/thoughts/_shared/ThoughtUpdates";

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

export default function LearnContent() {
  return (
    <ThoughtLayout
      breadcrumb="Learn"
      title="Thirteen Demos, One Player"
      intro={
        <>
          The Learn pages are interactive walkthroughs of the things I keep
          having to explain properly &mdash; binary search, sliding window, two
          pointers, hash maps, recursion and backtracking, dynamic programming,
          trees and graphs, stacks and queues, memoization, debounce and
          throttle, event delegation, async patterns, and the newest one on AI
          agent patterns. The interesting engineering isn&apos;t any single
          demo. It&apos;s that thirteen of them each grew their own copy of the
          same stepper, and what went wrong when I finally pulled that apart.
        </>
      }
    >
      <UpdateTimeline
        entries={[
          {
            id: "update-2026-08-10-write-up",
            date: "Aug 10, 2026",
            title: "Writing this down, and what I would keep",
          },
          {
            id: "update-2026-11-04-interview-prep",
            date: "Nov 4, 2026",
            title: "LeetCode asks which technique, and the demos never did",
          },
        ]}
      />

      <Section title="Thirteen steppers that were the same stepper">
        <p className="text-muted">
          Every demo needs the same thing: a list of steps, a current index,
          play and pause, forward and back, reset, and keyboard control. I built
          that inline the first time because one page doesn&apos;t need an
          abstraction. By the time there were a dozen, the shape had been
          retyped a dozen times, and each copy had drifted &mdash; different key
          handling, different behaviour at the end of the list, different ideas
          about what pause meant when you were already at the last step.
        </p>
        <p className="mt-3 text-muted">
          That is the version of duplication I actually care about. Not the
          typing, which is cheap, but the fact that thirteen copies means
          thirteen slightly different answers to the same question, and no one
          place to fix any of them. It became one{" "}
          <code className={code}>useStepPlayer</code> hook.
        </p>
      </Section>

      <Section title="The bug the tests found on the way">
        <p className="text-muted">
          Before consolidating I wrote tests for the stepper behaviour, which is
          the order I&apos;d insist on for anything that already ships:
          characterise what it does, then change how it does it. Those tests
          immediately caught an overrun &mdash; the player could step one past
          the end of the list.
        </p>
        <p className="mt-3 text-muted">
          The fix is the part worth keeping. The autoplay timer was deciding
          whether to stop inside the state updater, checking the index it was
          about to set. That reads fine and is wrong: an updater has to be a
          pure function of previous state, and using it to decide whether to
          cancel a timer is a side effect hiding in a place React is allowed to
          call twice. The stepper now stops from the callback, where the
          decision belongs, and the updater only computes the next index.
        </p>
      </Section>

      <Section title="What else this page paid for">
        <p className="mb-3 text-muted">
          Learn is thirteen near-identical routes, which makes it the cheapest
          place in the app to prove a cross-cutting change and the most
          expensive place to get one wrong. Several passes landed here first:
        </p>
        <ul className="space-y-2 text-sm text-muted">
          <Bullet>
            The shared <code className={code}>AmbientBackground</code> primitive
            and then <code className={code}>PageShell</code>, which collapsed
            the per-page background boilerplate onto one component.
          </Bullet>
          <Bullet>
            The framer-motion <code className={code}>motion</code> to{" "}
            <code className={code}>m</code> migration, which only pays off when
            every route does it, since one straggler pulls the full bundle back
            in.
          </Bullet>
          <Bullet>
            An LCP fix that moved entrance reveals off the JavaScript bundle
            entirely &mdash; the animation was delaying the thing it was
            animating.
          </Bullet>
          <Bullet>
            Migrating to <code className={code}>buildArticleMetadata</code> so
            the head tags come from one helper rather than being hand-rolled per
            page.
          </Bullet>
        </ul>
      </Section>

      <Update
        id="update-2026-08-10-write-up"
        date="August 10, 2026"
        title="Writing this down, and what I would keep"
      >
        <p>
          This page existed for months with no write-up, which I only noticed
          when I audited which features had one. Two others were in the same
          state, and the work-portfolio write-up turned out to exist while
          nothing linked to it.
        </p>
        <p>
          Writing it up surfaced the thing I would actually tell someone: the
          hook extraction was not the valuable part. Writing the
          characterisation tests first was. They found a real off-by-one that
          had been shipping, and they are the reason I could change thirteen
          pages at once and believe the result.
        </p>
      </Update>

      <Update
        id="update-2026-11-04-interview-prep"
        date="November 4, 2026"
        title="LeetCode asks which technique, and the demos never did"
      >
        <p>
          Thirteen demos showed me how sliding window or backtracking works once
          I already knew to use it. None of them helped with the step a LeetCode
          interview actually tests, which is reading a problem cold and knowing
          what to reach for. So I built 
          <code className={code}>/learn/interview-prep</code>: 23 patterns, the
          wording that gives each one away, a template, the traps, and a ladder
          of LeetCode problems to practise on, all in TypeScript.
        </p>

        <h3 className="mt-5 mb-2 text-[15px] font-semibold text-foreground">
          Recognition is in the wording, so the wording is the data
        </h3>
        <p className="text-muted">
          Every pattern carries its signals as phrases (&quot;longest
          substring&quot;, &quot;k closest&quot;, &quot;minimum number of
          operations&quot;), with the strongest flagged, plus a short list of
          when it&apos;s probably something else. That one field drives the
          pattern page, the drill and a signal finder on the hub: paste a
          problem statement and it ranks patterns by which phrases matched and
          highlights them in the text.
        </p>
        <pre className="mt-3 overflow-x-auto rounded-lg bg-surface p-3 text-[13px] font-mono text-foreground">
          {`rankPatternsForText("Given a string s, find the length of the longest
substring without repeating characters.")

[{ patternId: "sliding-window", score: 5,
   matchedPhrases: ["longest substring", "substring",
                    "without repeating characters"] }]`}
        </pre>

        <h3 className="mt-5 mb-2 text-[15px] font-semibold text-foreground">
          It gets Two Sum II wrong, and that&apos;s worth seeing
        </h3>
        <p className="text-muted">
          Phrase matching counts words, not what they mean together. A sorted
          array plus a target sum is the classic two-pointer problem, but the
          hash-map phrases outnumber the one that says sorted:
        </p>
        <pre className="mt-3 overflow-x-auto rounded-lg bg-surface p-3 text-[13px] font-mono text-foreground">
          {`"Given a sorted array of integers and a target, return the indices
of the two numbers that add up to target."

arrays-hashing  3  ["indices of the two numbers", "add up to target"]
two-pointers    2  ["sorted array"]
binary-search   1  ["sorted"]`}
        </pre>
        <p className="mt-3 text-muted">
          I could weight &quot;sorted&quot; up until this passes, but that tunes
          the finder to the example I happened to try. Showing the matched
          phrases next to each guess is the better fix. Two plausible answers
          and the reason for each is the conversation I want to have with
          myself in an interview anyway, and a confident single answer would
          hide it.
        </p>

        <h3 className="mt-5 mb-2 text-[15px] font-semibold text-foreground">
          The template stays hidden until I&apos;ve tried to write it
        </h3>
        <p className="text-muted">
          The research I leaned on for the study plan is the testing effect
          (Roediger and Karpicke, 2006), spacing (Cepeda and colleagues, 2006)
          and interleaving (Rohrer and Taylor, 2007). Reading a solution feels
          like learning and mostly isn&apos;t. So each template sits behind
          &quot;Show the template&quot;, ratings put problems back on a 1, 3,
          7, 14, 30, 60 day ladder, and the drill mixes every pattern together
          by default, because practising one topic in a block never makes me
          choose.
        </p>

        <h3 className="mt-5 mb-2 text-[15px] font-semibold text-foreground">
          A name I picked broke the roadmap test
        </h3>
        <p className="text-muted">
          The roadmap test looks up each pattern&apos;s link by a regex
          anchored on its name. &quot;Binary Search&quot; and &quot;Binary
          Search Trees&quot; both start the same way:
        </p>
        <pre className="mt-3 overflow-x-auto rounded-lg bg-surface p-3 text-[13px] font-mono text-foreground">
          {`TestingLibraryElementError: Found multiple elements with the role
"link" and name \`/^Binary Search/\``}
        </pre>
        <p className="mt-3 text-muted">
          My first instinct was to loosen the test. But a reader scanning the
          roadmap has the same problem as the regex, so the tree pattern
          became &quot;BSTs&quot; instead.
        </p>

        <h3 className="mt-5 mb-2 text-[15px] font-semibold text-foreground">
          Progress moved to my account, and the first version let a click land
          in the wrong place
        </h3>
        <p className="text-muted">
          Ratings started in localStorage, which is fine until I practise on my
          phone and review on my laptop. They now live in portfolio_api per
          user behind a <code className={code}>/api/practice</code> proxy, and
          the first sign-in moves whatever a browser kept onto the account and
          clears the local copy. The signed-in save test failed on the first
          run:
        </p>
        <pre className="mt-3 overflow-x-auto rounded-lg bg-surface p-3 text-[13px] font-mono text-foreground">
          {`× saves a rating to the account and leaves localStorage alone
AssertionError: expected [] to have a length of 1 but got +0`}
        </pre>
        <p className="mt-3 text-muted">
          The buttons were live before <code className={code}>/api/me</code> 
          had answered, so the click went to localStorage and no request was
          ever made. In practice the next load would have imported it, which is
          why it looked harmless. But &quot;it gets fixed on the next
          visit&quot; isn&apos;t what I want from a store. Rating now waits
          until the session is known and, when signed in, until the account has
          loaded. A failed read or save says so on the page instead of showing
          an empty schedule.
        </p>

        <h3 className="mt-5 mb-2 text-[15px] font-semibold text-foreground">
          Every test passed and the bundle budget still said no
        </h3>
        <p className="text-muted">
          The E2E job ran all 132 tests green, then failed on the size check
          that runs after them:
        </p>
        <pre className="mt-3 overflow-x-auto rounded-lg bg-surface p-3 text-[13px] font-mono text-foreground">
          {`/learn/interview-prep
  budget  360.0KB (catch-all ceiling)
  actual  363.1KB
  over by 3.1KB`}
        </pre>
        <p className="mt-3 text-muted">
          I assumed the pattern data was the weight, since all 23 patterns ship
          to the client. Splitting the route&apos;s chunks said otherwise: one
          of them was nothing but zod, about 62KB gzipped, pulled in to check
          the shape of what&apos;s in localStorage. My first fix was 
          <code className={code}>zod/mini</code>, which is meant to tree-shake
          down to almost nothing. It saved 5KB, and a namespace import saved
          nothing more, because Turbopack doesn&apos;t shake it here. The check
          is four fields, so it became a small type guard, with a test written
          first to pin that unreadable progress still throws. All three routes
          came down by about 57KB, to roughly 300KB.
        </p>

        <h3 className="mt-5 mb-2 text-[15px] font-semibold text-foreground">
          The dead-code check couldn&apos;t see through a folder
        </h3>
        <pre className="mt-3 overflow-x-auto rounded-lg bg-surface p-3 text-[13px] font-mono text-foreground">
          {`Found 2 dead export(s) — nothing imports these:

  src/lib/leetcode/patterns/index.ts:61 - patternById
  src/lib/leetcode/patterns/index.ts:70 - leetCodeUrl`}
        </pre>
        <p className="mt-3 text-muted">
          Both are imported from half a dozen files. ts-prune doesn&apos;t
          follow an import of a directory&apos;s 
          <code className={code}>index.ts</code>, which is why the only other
          one in the repo is on its ignore list. They got an ignore comment
          with that reason rather than a rename to dodge the tool.
        </p>
      </Update>

      <WhatsNext
        nowShipped={[
          "An interview prep playbook at /learn/interview-prep: 23 patterns in study order, each with its signals, a hidden template, traps, JS and TS notes, and a ladder of LeetCode problems with the tell behind a disclosure.",
          "A signal finder that ranks patterns for a pasted problem statement and shows the phrases behind each guess, a complexity budget from the input size, a recognition drill, an eight-week plan and a toolkit of the JS pieces LeetCode assumes.",
          "Spaced review on a 1 to 60 day ladder, stored on my account when signed in, with a one-time import from the browser and errors shown rather than swallowed.",
          "A test that no learn demo implements arrow-key stepping itself, so the thirteen cannot quietly disagree about what the arrow keys do. Verified by adding a rogue handler and watching it go red.",
          "One useStepPlayer hook behind all thirteen demos, so play, pause, step and keyboard control behave identically everywhere and get fixed in one place.",
          "Characterisation tests written before the refactor, not after — they caught a step-past-the-end overrun that had been live.",
          "Autoplay stops from the callback rather than the state updater, so the updater stays a pure function of previous state.",
        ]}
        couldImprove={[
          "The signal finder counts phrases, so a problem whose decisive word is outnumbered (Two Sum II's \"sorted\") ranks the wrong pattern first.",
          "Nothing checks that the LeetCode slugs still resolve. A renamed problem would be a dead link I find by clicking it.",
          "The drill shows real problem prompts, so after a few rounds I could be recognising the problem rather than the pattern. Fresh, reworded prompts would test the skill instead of my memory.",
          "The demos share a player but not a shape: each still hand-rolls its own layout and controls markup, so a visual change is thirteen edits. A shared DemoLayout would be the same argument one level up.",
          "The keyboard guard checks that no demo hand-rolls arrow stepping. It cannot check that a demo which should be stepped actually is one — a page with previous and next buttons and no hook would pass.",
          "Content is hard-coded per route. Steps as data rather than JSX would make a demo a file of steps instead of a component.",
        ]}
        upcoming={[
          "A scheduled check that every LeetCode link in the playbook still returns a problem page.",
          "A mode that asks me to type the template from memory and diffs it against the real one, instead of only revealing it.",
          "Give the remaining learn routes the loading and error states the rest of the app just got, rather than only the hub.",
          "A shared DemoLayout, if the next demo I add makes me copy the markup a fourteenth time — which is the signal I trust more than a rule about counts.",
        ]}
      />
    </ThoughtLayout>
  );
}
