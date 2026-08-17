"use client";

import ThoughtLayout from "@/app/thoughts/ThoughtLayout";
import { WhatsNext } from "@/app/thoughts/_shared/ThoughtUpdates";
import { ChatThread, Timestamp, Sent, Received } from "@/lib/threads";

const code =
  "rounded bg-surface px-1 py-0.5 font-mono text-[13px] text-foreground";

export default function GreenChecksContent() {
  return (
    <ThoughtLayout
      breadcrumb="Green Checks"
      title="Green Checks"
      intro={
        <>
          A week in the design system repo that turned up four green checks, none
          of which was measuring the thing it claimed to measure. A CI suite
          nothing ran, a visual gate with no quota left, a contrast figure taken
          under a layer that was hiding it, and a test count that changed
          depending on whether I had run a build.
        </>
      }
      chat={
        <ChatThread>
          <Timestamp>Monday 9:40 AM</Timestamp>

          <Received pos="first">
            you said the design system has been publishing to npm off main this
            whole time
          </Received>
          <Received pos="last">what runs before it publishes</Received>

          <Sent pos="first">
            that was the question I went looking for the answer to. the workflows
            directory had three files. chromatic, publish, tag-release. no test
            job at all
          </Sent>
          <Sent pos="middle">
            864 tests sitting in the repo across four workspaces. the palette
            contrast gate, the component contrast pairs, all of it. none of it
            wired to anything
          </Sent>
          <Sent pos="last">
            they were passing. they were just passing on my laptop, when I
            remembered to ask
          </Sent>

          <Timestamp>9:52 AM</Timestamp>

          <Received>so you added the workflow and it went green</Received>

          <Sent pos="first">
            a green new workflow proves it can run, not that it can fail. so
            before merging I broke something the suite is supposed to catch
          </Sent>
          <Sent pos="last">
            flipped chart palette slot 2 back to the violet it used to be.
            expected 11.35 to be greater than or equal to 15, exit 1. then put it
            back
          </Sent>

          <Timestamp>10:15 AM</Timestamp>

          <Received>and chromatic? that one was already wired up</Received>

          <Sent pos="first">
            wired up and reporting pass, yes. I only opened it because I was
            deciding whether to move it to node 24
          </Sent>
          <Sent pos="middle">
            the UI Tests check says update your plan to resume testing. the
            snapshot quota ran out about a month ago. the job still exits 0
            because exitZeroOnChanges is set
          </Sent>
          <Sent pos="last">
            worse bit is autoAcceptChanges is set to main. so any drift that did
            happen in that month gets accepted as the baseline the next time a
            release merges. it wasn&apos;t just failing to catch drift, it was
            lined up to bless it
          </Sent>

          <Timestamp>10:20 AM</Timestamp>

          <Received>did you move it to node 24 anyway</Received>

          <Sent>
            no. touching a visual gate while it has no way to show you what
            changed is exactly the wrong week to do it. left it alone, wrote down
            why
          </Sent>

          <Timestamp>Wednesday 2:30 PM</Timestamp>

          <Received pos="first">
            the gel button. you had it filed at 3.45:1 as a known AA failure
          </Received>
          <Received pos="last">what changed</Received>

          <Sent pos="first">
            nothing changed, the number was just wrong. and it reproduces
            perfectly, which is why it lasted
          </Sent>
          <Sent pos="middle">
            it measures white against the bare primary-500 gradient stop. but
            that stop has a 55% white gloss sitting on top of it. so the figure
            describes a surface that is never on screen
          </Sent>
          <Sent pos="last">
            composite the gloss in and the real floor is 1.69:1 at rest, 1.52:1
            hovered. it was understated by more than half, in the direction that
            lets it keep shipping
          </Sent>

          <Timestamp>2:44 PM</Timestamp>

          <Received>so darken the ramp until it passes</Received>

          <Sent pos="first">
            that was my first move and the arithmetic killed it. a 55% white
            gloss caps whatever is under it at 3.35:1 even if the fill is pure
            black. AA is 4.5. the ramp cannot get there alone
          </Sent>
          <Sent pos="last">
            so the gloss had to come down too. 700 to 900 under a 14% gloss.
            5.12:1 at rest, 4.73:1 hovered, measured at the worst stop
          </Sent>

          <Timestamp>3:02 PM</Timestamp>

          <Received>how did the suite miss it in the first place</Received>

          <Sent pos="first">
            the sampler read the discrete ramp steps a background names. that
            can&apos;t see an interpolated midpoint of a gradient and it
            can&apos;t see a translucent layer on top
          </Sent>
          <Sent pos="middle">
            and both of those blind spots err the same way. toward passing
          </Sent>
          <Sent pos="last">
            new one composites every half percent along the fill. and it carries
            a check on itself: the composited number has to come out below the
            bare-stop number. if the compositing ever drops out silently the
            ratios go up, which is the direction that looks like good news
          </Sent>

          <Timestamp>Friday 11:10 AM</Timestamp>

          <Received>last one. the tokens test count</Received>

          <Sent pos="first">
            42 locally. 84 after a build. tsconfig had include src and no
            exclude, so tsc compiled the tests into build/ and vitest picked
            those up too
          </Sent>
          <Sent pos="middle">
            vitest excludes dist by default. not build. so the compiled copies
            ran as real tests and could pass while the source they came from was
            failing
          </Sent>
          <Sent pos="last">
            the part that actually mattered is that files was set to build/. so
            every tokens tarball on npm shipped ten test files. 31 entries down
            to 21 once I fixed it
          </Sent>

          <Timestamp>11:18 AM</Timestamp>

          <Received>is there a common thread or are these just four bugs</Received>

          <Sent pos="first">
            all four are the same shape. the check was green and the check was
            measuring something adjacent to what it claimed
          </Sent>
          <Sent pos="last">
            and not one of them failed. I found all four by opening a file for an
            unrelated reason
          </Sent>
        </ChatThread>
      }
    >
      <section>
        <h2 className="mb-3 text-lg font-bold">The suite that never ran</h2>
        <p className="text-muted">
          The design system publishes{" "}
          <code className={code}>@paul-portfolio/tokens</code>,{" "}
          <code className={code}>css</code> and{" "}
          <code className={code}>react</code> to npm the moment something reaches{" "}
          <code className={code}>main</code>. There are 864 tests across four
          workspaces standing behind that, including the palette contrast gate
          and the component contrast pairs that the accessibility notes lean on.
          Until this week, nothing in CI ever ran them.
        </p>
        <p className="mt-3 text-muted">
          The workflows directory had three files in it &mdash;{" "}
          <code className={code}>chromatic.yml</code>,{" "}
          <code className={code}>publish.yml</code> and{" "}
          <code className={code}>tag-release.yml</code> &mdash; and not one of
          them invoked a test. The suite was green the entire time, which is
          true and misleading in the same breath: it was green because I
          remembered to run it before pushing. That is a habit, not a gate, and
          the difference only shows up on the day the habit lapses.
        </p>
        <p className="mt-3 text-muted">
          The fix is unremarkable, one <code className={code}>ci.yml</code>{" "}
          running lint, typecheck, build and the suite on pull requests and on{" "}
          <code className={code}>main</code>. What I want to record is the step
          before merging it.{" "}
          <strong>
            A workflow that has never failed has not been shown to work
          </strong>{" "}
          &mdash; it has been shown to run, which is a much weaker claim and
          looks identical in the checks list. So I gave it something real to
          catch: flipping chart palette slot 2 back to the violet it used to be
          reproduced a genuine deuteranopia collision, and the job came back
          with <code className={code}>expected 11.35 to be greater than or equal to 15</code>{" "}
          and exit 1. Then I put the palette back and merged the red-proven
          workflow.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-bold">
          A visual check with nothing to compare against
        </h2>
        <p className="text-muted">
          Chromatic was the one gate that had been wired up correctly for
          months, and it is the one I trusted most, because a visual diff
          catches the class of regression no assertion is ever going to describe
          in advance. I opened it for a completely unrelated reason: I was
          working out whether to move that workflow to Node 24 along with
          everything else.
        </p>
        <p className="mt-3 text-muted">
          The <code className={code}>UI Tests</code> check reads{" "}
          <em>Update your plan to resume testing</em>. The snapshot quota has
          been exhausted for about a month. The{" "}
          <code className={code}>chromatic</code> job next to it reports pass,
          because <code className={code}>exitZeroOnChanges: true</code> is set
          and a build that could not take a snapshot has, technically, no
          changes to report. It was{" "}
          <strong>green on a flag, not on a comparison</strong>, and nothing
          about the checks list distinguishes those two things.
        </p>
        <p className="mt-3 text-muted">
          The sharper half is the setting underneath it.{" "}
          <code className={code}>autoAcceptChanges: main</code> means a build on
          the release branch takes whatever it sees and makes it the reference
          for everything after. So if any drift did land during that month
          &mdash; and the recolour work means it plausibly did &mdash; the gate
          would{" "}
          <strong>
            adopt it as the new baseline on the next release merge
          </strong>
          . A check that misses a regression is a gap. A check positioned to
          ratify one and then vouch for it afterwards is worse than not having
          it, because it launders the change.
        </p>
        <p className="mt-3 text-muted">
          So the Node 24 question answered itself, in the other direction from
          the one I expected. Everything else moved; Chromatic stays exactly
          where it is until there is quota to prove the move changed nothing. An
          unverifiable visual change riding along inside a CI-configuration pull
          request is the trade I would least like to explain later.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-bold">
          The number measured under the gloss
        </h2>
        <p className="text-muted">
          Version <code className={code}>0.2.36</code> recorded{" "}
          <code className={code}>.btn--gel</code> as a known AA failure at
          3.45:1 and deferred it, which is a reasonable thing to do with a
          decorative variant when the number is close. The number reproduces
          exactly, every time. It is also the wrong measurement, and the two
          facts together are what let it sit there: a figure that reproduces
          feels settled.
        </p>
        <p className="mt-3 text-muted">
          It reads white against the bare{" "}
          <code className={code}>primary-500</code> gradient stop. That stop is
          real, but it is not what anyone sees, because a 55% white gloss sits
          on top of it. The figure was{" "}
          <strong>measured under the gloss rather than through it</strong>.
          Composited properly, the floor was{" "}
          <strong>1.69:1 at rest</strong> and 1.52:1 on hover &mdash;
          understated by more than half, and understated in the direction that
          lets something keep shipping. I would rather have found this as a
          failure than as a correction, but a defect recorded at half its size
          is a defect nobody prioritises.
        </p>
        <p className="mt-3 text-muted">
          Reframing it also decided the fix, which the original framing could
          not have. My instinct was to darken the ramp until the ratio cleared,
          and that was arithmetically impossible from the start: a 55% white
          gloss{" "}
          <strong>caps whatever is underneath it at 3.35:1</strong> even over
          pure black, and AA wants 4.5. No amount of darkening reaches it while
          the gloss stands. The gloss had to come down with the ramp. Shipped{" "}
          <code className={code}>primary-700</code> to{" "}
          <code className={code}>primary-900</code> under a 14% gloss, which
          measures 5.12:1 at rest and 4.73:1 on hover at the worst stop along
          the fill.
        </p>
        <p className="mt-3 text-muted">
          The root cause was the sampler, and it is the reason this belongs with
          the other three. It read the discrete ramp steps that a background{" "}
          <em>names</em>. A gradient&rsquo;s interpolated midpoint has no name,
          and a translucent layer above the fill has no name either, so neither
          was visible to it &mdash; and both blind spots err toward{" "}
          <em>passes</em>, which is the only direction that matters. The
          replacement composites every half percent along the fill and measures
          there.
        </p>
        <p className="mt-3 text-muted">
          It also carries a guard on itself, which is the part I would keep if I
          kept one thing. The{" "}
          <strong>
            composited floor has to stay strictly below the bare-stop reading
          </strong>
          , because compositing a white gloss over a fill can only ever reduce
          contrast against white text. If the compositing silently stopped
          happening &mdash; a refactor, a bad default, a layer dropped from the
          model &mdash; then{" "}
          <strong>ratios would improve while the button got worse</strong>, and
          the suite would report the improvement. That is the failure this whole
          page is about, so the new check is built to notice it happening to
          itself.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-bold">
          The count that depended on whether you&apos;d built
        </h2>
        <p className="text-muted">
          <code className={code}>packages/tokens/tsconfig.json</code> had{" "}
          <code className={code}>include: [&quot;src&quot;]</code> and no{" "}
          <code className={code}>exclude</code>, so{" "}
          <code className={code}>tsc</code> compiled the tests along with
          everything else into <code className={code}>build/</code>. Vitest
          ships a default exclude that covers{" "}
          <code className={code}>**/dist/**</code> and does not cover{" "}
          <code className={code}>**/build/**</code>. So 42 became 84 the moment
          a build had happened, and the extra 42 were compiled copies
          quite capable of passing while the sources they came from failed.
        </p>
        <p className="mt-3 text-muted">
          A test count that moves depending on whether you happened to build
          first is a small thing on its own. The consequence was not small:{" "}
          <code className={code}>files: [&quot;build/&quot;]</code> meant every
          published tokens tarball carried ten test files out to every consumer.
          Fixing the config took the package from thirty-one entries to
          twenty-one, which is a third of a published artifact that existed
          because a compiler was told to look in one place and nobody told it
          what to skip.
        </p>
        <p className="mt-3 text-muted">
          The tell was sitting one directory over the whole time.{" "}
          <code className={code}>packages/react</code> was covered twice against
          this &mdash; it sets an <code className={code}>exclude</code>{" "}
          <em>and</em> it emits to <code className={code}>dist/</code>, which
          vitest already ignores &mdash; where tokens was covered by neither.
          Two packages in one repo, one belt-and-braces and one bare, and the
          asymmetry is only visible if you read the two configs side by side,
          which nothing ever asks you to do.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-bold">
          What the four have in common
        </h2>
        <p className="text-muted">
          Four checks, four different subsystems, one shape. Every one of them
          was green, and every one was{" "}
          <strong>measuring something other than the thing it named</strong>.
          The CI badge measured whether a workflow file parsed. The visual gate
          measured whether the Chromatic client exited cleanly. The contrast
          number measured a surface that was never rendered. The test count
          measured whatever files happened to be on disk. In each case there is
          a real signal available and a cheaper adjacent one, and the adjacent
          one is what got wired up &mdash; not through carelessness, but because
          it is the one that is easy to reach and it looks the same once it is
          green.
        </p>
        <p className="mt-3 text-muted">
          <strong>Not one of these was caught by a test failing.</strong> The CI
          gap turned up while adding an unrelated workflow. Chromatic turned up
          while pricing a Node upgrade. The gel button turned up while writing
          the contrast pairs for something else. The tokens count turned up
          because a number looked different than I remembered. Four for four,
          the trigger was opening a file that nothing was pointing me at.
        </p>
        <p className="mt-3 text-muted">
          I do not think that generalises into a practice, and I am wary of the
          version of this that becomes a rule about reading more files. What it
          does change is how I read a green check on something I did not wire up
          myself: the question is no longer whether it passes, it is what it
          would have to see in order to fail, and whether it has ever done it
          once. The workflow in the first section is the only one of the four
          that has answered that question out loud.
        </p>
        <p className="mt-3 text-muted">
          The same pull request collapsed the CI Node matrix to 24 alone &mdash;
          publishing already ships from 24, and Node 20 went end-of-life in
          April &mdash; which took three jobs down to two. That one is just
          housekeeping, and it is in here only because it is the change that had
          me looking at the workflows at all.
        </p>
      </section>

      <WhatsNext
        nowShipped={[
          "A CI workflow that runs the suite before anything publishes, proven against a real regression before it was merged rather than trusted because it was green.",
          "A contrast sampler that composites translucent layers and gradient midpoints instead of reading the named ramp steps, with an invariant on itself so it cannot silently stop compositing.",
          "Tokens compiling only its sources, so the test count no longer depends on build state and the published tarball no longer carries its own tests.",
        ]}
        couldImprove={[
          "Chromatic is still reporting pass on an exhausted quota. Until there is quota the honest state is that this repo has no visual regression testing, and the check saying otherwise is the problem, not the gap.",
          "exitZeroOnChanges and autoAcceptChanges are both reasonable settings that combine into a gate that ratifies drift. Nothing in either tool's output tells you they are combined that way.",
          "The contrast guard covers the components I thought to pair. There is still no check that a new component gets paired at all, which is the same shape of gap the whole page is about.",
        ]}
        upcoming={[
          "Restore the visual diff, then re-run the Node 24 move behind it, so the upgrade is the first thing the gate proves rather than the change that rides in unverified.",
        ]}
      />
    </ThoughtLayout>
  );
}
