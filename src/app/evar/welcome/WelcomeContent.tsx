import Link from "next/link";
import PageHeader from "@/components/PageHeader";
import { INTRO_SCENES, introSeconds } from "@/lib/evar/introScenes";
import { HOW_TO_SCENES, howToSeconds } from "@/lib/evar/howToScenes";
import StudyInvite from "./StudyInvite";
import WelcomeSeen from "./WelcomeSeen";

const button =
  "paul-touch-min inline-flex items-center rounded-lg border border-border bg-surface px-4 py-2 text-[15px] text-foreground transition-colors hover:bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/40";
const primary = `${button} border-foreground font-semibold`;

/**
 * The front door to EVAR Sizing, and its homepage once it has a domain of
 * its own: what it is, a short video of a case and another on how to measure,
 * the study question, and what the project is for. Seeing it is remembered,
 * so the practice only sends a first-time visitor here once.
 */
export default function WelcomeContent() {
  return (
    <div className="min-h-dvh bg-background">
      <PageHeader
        breadcrumbs={[{ label: "Dashboard", href: "/" }, { label: "EVAR Sizing", href: "/evar" }, { label: "Welcome" }]}
        maxWidth="max-w-6xl"
      />
      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
          <div className="min-w-0">
            <h1 className="text-3xl font-bold text-foreground text-balance sm:text-4xl">
              Practise sizing an aneurysm repair
            </h1>
            <p className="mt-4 max-w-[46ch] text-[17px] leading-relaxed text-muted">
              Measure real and synthetic CT scans, choose a stent graft, and see how close you were.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/evar" className={primary}>
                Start practising
              </Link>
              <Link href="/evar/guide" className={button}>
                How to measure
              </Link>
            </div>
          </div>

          <figure className="min-w-0">
            {/* eslint-disable-next-line jsx-a11y/media-has-caption -- the video has no sound to caption: its captions are in the frames, and the transcript is right under it */}
            <video
              controls
              preload="metadata"
              playsInline
              poster="/evar/welcome/intro-poster.png"
              className="aspect-video w-full rounded-2xl border border-border bg-surface"
            >
              <source src="/evar/welcome/intro.mp4" type="video/mp4" />
              <a href="/evar/welcome/intro.mp4">Download the intro video</a>
            </video>
            <figcaption className="mt-2 text-[13px] text-muted">
              How a case works, in {introSeconds()} seconds, with no sound.
            </figcaption>
            <details aria-labelledby="evar-welcome-transcript" className="mt-3 text-[14px]">
              <summary id="evar-welcome-transcript" className="cursor-pointer text-foreground">
                What the intro shows
              </summary>
              <ol className="mt-2 grid list-decimal grid-cols-1 gap-1.5 pl-5 text-muted">
                {INTRO_SCENES.map((scene) => (
                  <li key={scene.id}>{scene.caption}</li>
                ))}
              </ol>
            </details>
          </figure>
        </div>

        <section aria-labelledby="evar-welcome-howto" className="mt-12 grid grid-cols-1 items-start gap-8 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
          <figure className="min-w-0">
            {/* eslint-disable-next-line jsx-a11y/media-has-caption -- the video has no sound to caption: its captions are in the frames, and the transcript is right under it */}
            <video
              controls
              preload="metadata"
              playsInline
              poster="/evar/welcome/how-to-measure-poster.png"
              className="aspect-video w-full rounded-2xl border border-border bg-surface"
            >
              <source src="/evar/welcome/how-to-measure.mp4" type="video/mp4" />
              <a href="/evar/welcome/how-to-measure.mp4">Download the how-to video</a>
            </video>
            <figcaption className="mt-2 text-[13px] text-muted">
              Every measurement, in {howToSeconds()} seconds, with no sound.
            </figcaption>
            <details aria-labelledby="evar-welcome-howto-transcript" className="mt-3 text-[14px]">
              <summary id="evar-welcome-howto-transcript" className="cursor-pointer text-foreground">
                What the how-to shows
              </summary>
              <ol className="mt-2 grid list-decimal grid-cols-1 gap-1.5 pl-5 text-muted">
                {HOW_TO_SCENES.map((scene) => (
                  <li key={scene.id}>{scene.caption}</li>
                ))}
              </ol>
            </details>
          </figure>
          <div className="min-w-0">
            <h2 id="evar-welcome-howto" className="text-xl font-bold text-foreground">
              Learn to measure
            </h2>
            <p className="mt-3 max-w-prose text-[15px] leading-relaxed text-foreground">
              Where the neck starts, where the calipers go, and how the graft is picked from what you measure. The
              guide goes through each step with pictures, and says what hospital planning adds.
            </p>
            <Link href="/evar/guide" className={`${button} mt-5`}>
              Read the full guide
            </Link>
          </div>
        </section>

        <div className="mt-12">
          <StudyInvite />
        </div>

        <section aria-labelledby="evar-welcome-doing" className="mt-12">
          <h2 id="evar-welcome-doing" className="text-xl font-bold text-foreground">
            What we&apos;re doing
          </h2>
          <ul className="mt-4 grid max-w-prose grid-cols-1 gap-3 text-[15px] leading-relaxed text-foreground">
            <li>
              <strong>A free place to practise.</strong> Synthetic and real CT scans, every number checked against an
              answer, and three makers&apos; sizing tables to choose a graft from.
            </li>
            <li>
              <strong>A study of how the skill grows.</strong> With your consent, each attempt is kept under a random
              id, so we can see how sizing changes from medical school to staff surgeon. It needs ethics approval
              before anything is published.
            </li>
            <li>
              <strong>More real scans, checked by residents.</strong> Each new scan comes from an openly licensed
              collection and is measured by a resident, so it has answers to check against.
            </li>
          </ul>
          <p className="mt-4 text-[15px]">
            <Link href="/evar/plan" className="underline underline-offset-2">
              The plan, and what it costs to run
            </Link>
          </p>
        </section>

        <p className="mt-12 text-[13px] text-muted">For practice only. Not for planning a real patient&apos;s repair.</p>
        <WelcomeSeen />
      </main>
    </div>
  );
}
