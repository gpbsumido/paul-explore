import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import PageHeader from "@/components/PageHeader";
import { ENDURANT } from "@/lib/evar/endurant";
import { LEVELS } from "@/lib/evar/levels";
import { EVAR_CASES, referenceFor } from "@/lib/evar/phantom";
import { HOW_TO_SCENES, howToSeconds } from "@/lib/evar/howToScenes";

const button =
  "paul-touch-min inline-flex items-center rounded-lg border border-border bg-surface px-4 py-2 text-[15px] text-foreground transition-colors hover:bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/40";
const prose = "mt-3 max-w-prose text-[15px] leading-relaxed text-foreground";
const link = "underline underline-offset-2";

// The worked example is the first Easy case, sized by the sheet the practice grades against.
const example = EVAR_CASES[0];
const answer = referenceFor(example);
const mainBody = ENDURANT.mainBodyDiametersFor(answer.neckDiameter)[0];
const rightLimb = ENDURANT.limbDiametersFor(answer.rightCia)[0];
const leftLimb = ENDURANT.limbDiametersFor(answer.leftCia)[0];

/** Pictures from the how-to recording: the scan crops are square, the panels taller than wide. */
const SCAN = { width: 920, height: 920 };
const PANEL = { width: 720, height: 920 };
const DIALOG = { width: 1280, height: 920 };

const SOURCES = [
  {
    label: "ESVS 2024 guidelines on abdominal aorto-iliac aneurysms (EJVES)",
    href: "https://www.ejves.com/article/S1078-5884(23)00889-4/fulltext",
  },
  {
    label: "Medtronic Endurant II/IIs instructions for use (FDA)",
    href: "https://www.accessdata.fda.gov/cdrh_docs/pdf10/P100021S063D.pdf",
  },
  { label: "Gore Excluder Conformable specifications", href: "https://www.goremedical.com/products/excluder-conformable/specifications" },
  {
    label: "Sizing considerations for Gore Excluder in angulated necks, Annals of Vascular Surgery",
    href: "https://www.sciencedirect.com/science/article/abs/pii/S0890509618301511",
  },
  {
    label: "Knöps et al., EVAR sizing with open source software, Annals of Vascular Surgery 2021",
    href: "https://doi.org/10.1016/j.avsg.2020.08.126",
  },
];

/** One step of the guide: a numbered heading, what to do, and a picture of doing it. */
function Step({
  id,
  number,
  title,
  image,
  alt,
  size,
  children,
}: {
  id: string;
  number: number;
  title: string;
  image: string;
  alt: string;
  size: { width: number; height: number };
  children: ReactNode;
}) {
  return (
    <section id={id} aria-labelledby={`${id}-heading`} className="mt-14 scroll-mt-20">
      <h2 id={`${id}-heading`} className="text-xl font-bold text-foreground">
        <span className="mr-2 font-mono text-[15px] text-muted">{number}</span>
        {title}
      </h2>
      <div className="mt-4 grid grid-cols-1 items-start gap-6 md:grid-cols-[minmax(0,1fr)_minmax(0,22rem)]">
        <div className="min-w-0">{children}</div>
        <Image
          src={`/evar/guide/${image}.webp`}
          alt={alt}
          width={size.width}
          height={size.height}
          unoptimized
          className="h-auto w-full rounded-xl border border-border bg-black"
        />
      </div>
    </section>
  );
}

/**
 * The full explanation behind the practice: each measurement in the order
 * it's taken, a worked graft from the sheet the practice grades against,
 * what each level lets through, and what hospital planning adds on top.
 */
export default function GuideContent() {
  return (
    <div className="min-h-dvh bg-background">
      <PageHeader
        breadcrumbs={[{ label: "Dashboard", href: "/" }, { label: "EVAR Sizing", href: "/evar" }, { label: "Guide" }]}
        maxWidth="max-w-4xl"
      />
      <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
        <h1 className="text-3xl font-bold text-foreground text-balance">How to measure for an EVAR</h1>
        <p className={prose}>
          Before an endovascular aneurysm repair, the CT is measured to choose a stent graft that will seal: above the
          aneurysm in the healthy neck of the aorta, and below it in each common iliac artery. Five measurements decide
          it. This guide goes through them in the order they&apos;re taken, the way the practice grades them.
        </p>

        <figure className="mt-8">
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
            Every step, in {howToSeconds()} seconds, with no sound.
          </figcaption>
          <details aria-labelledby="evar-guide-transcript" className="mt-3 text-[14px]">
            <summary id="evar-guide-transcript" className="cursor-pointer text-foreground">
              What the video shows
            </summary>
            <ol className="mt-2 grid list-decimal grid-cols-1 gap-1.5 pl-5 text-muted">
              {HOW_TO_SCENES.map((scene) => (
                <li key={scene.id}>{scene.caption}</li>
              ))}
            </ol>
          </details>
        </figure>

        <Step
          id="neck-start"
          number={1}
          title="Find the top of the neck"
          image="neck-start"
          alt="An axial CT slice at the lowest renal artery, labelled where the artery leaves the aorta"
          size={SCAN}
        >
          <p className={prose}>
            Scroll down from above the kidneys. The renal arteries leave the aorta to either side, and the neck starts
            just below the lowest of them, which can be on either side. In the practice, mark that slice as the lowest
            renal artery.
          </p>
          <p className={prose}>
            On every axial CT the patient&apos;s right is on the left of the image, so the right renal artery heads
            left.
          </p>
        </Step>

        <Step
          id="neck-diameter"
          number={2}
          title="Measure the neck"
          image="neck-diameter"
          alt="The neck just below the lowest renal artery, with calipers from outer wall to outer wall"
          size={SCAN}
        >
          <p className={prose}>
            Just below the lowest renal, put the calipers across the neck from outer wall to outer wall, thrombus
            included. Calcium and thrombus sit inside the wall, so even when the bright lumen is narrower, the outer
            edge is the one to measure to.
          </p>
          <p className={prose}>
            If the neck cuts as an oval, it&apos;s angled, and the slice is cutting through it on a slant. Measure
            across the short axis: that&apos;s the vessel&apos;s real diameter, and the long axis only shows how steep
            the slant is.
          </p>
        </Step>

        <Step
          id="neck-length"
          number={3}
          title="Mark the neck length"
          image="neck-length"
          alt="The neck length panel with the lowest renal artery and the start of the aneurysm both marked"
          size={PANEL}
        >
          <p className={prose}>
            Mark the lowest renal, then the first slice where the aorta widens by more than 10%. That&apos;s where the
            aneurysm starts, and the neck runs between the two. Most devices need at least 10 to 15 mm of it to seal.
          </p>
          <p className={prose}>
            The practice measures that length along the vessel&apos;s centreline rather than straight down the slices,
            so a leaning neck comes out a little longer than its slice count.
          </p>
        </Step>

        <Step
          id="sac"
          number={4}
          title="Measure the widest part of the sac"
          image="sac"
          alt="The aneurysm at its widest slice, with calipers from outer wall to outer wall"
          size={SCAN}
        >
          <p className={prose}>
            Scroll through the aneurysm to its widest slice and measure it outer wall to outer wall, across the short
            axis if it&apos;s oval. Include the thrombus: it&apos;s part of the aneurysm, even though the bright lumen
            inside it is narrower.
          </p>
        </Step>

        <Step
          id="iliacs"
          number={5}
          title="Measure both common iliacs"
          image="iliacs"
          alt="Both common iliac arteries below the bifurcation, each labelled, with calipers across the left"
          size={SCAN}
        >
          <p className={prose}>
            Below the aortic bifurcation, measure each common iliac outer wall to outer wall where its limb will seal:
            clear of the bifurcation, and above where the internal iliac comes off. Each side gets its own number,
            since they&apos;re rarely the same.
          </p>
        </Step>

        <Step
          id="graft"
          number={6}
          title="Size the graft"
          image="graft"
          alt="The Size the graft tab, with an Endurant main body, contralateral limb and extension picked"
          size={PANEL}
        >
          <p className={prose}>
            Each maker publishes a table that turns a measurement into a device size, and the sizes are deliberately a
            little bigger than the vessel, usually 10 to 20% for the neck, so the graft presses outward and seals. Pick
            the main body from the neck&apos;s diameter and each limb from its iliac.
          </p>
          <p className={prose}>
            On the {example.title.toLowerCase()} case, the {answer.neckDiameter} mm neck takes a {mainBody} mm main
            body on Medtronic&apos;s Endurant sheet, and the {answer.rightCia} mm right iliac and {answer.leftCia} mm
            left iliac {rightLimb === leftLimb ? `each take a ${rightLimb} mm limb` : `take a ${rightLimb} mm limb and a ${leftLimb} mm limb`}.
          </p>
          <p className={prose}>
            Mark the aortic bifurcation and each internal iliac origin too, and the practice grades the lengths: each
            side has to reach at least {ENDURANT.distalSealMm} mm into its common iliac without covering the internal
            iliac.
          </p>
        </Step>

        <Step
          id="check"
          number={7}
          title="Check your answers"
          image="check"
          alt="The results after checking the answers: stars, points, and each measurement against the reference"
          size={DIALOG}
        >
          <p className={prose}>Each number is compared with the reference, within a tolerance set by the level.</p>
          <ul className="mt-3 grid max-w-prose list-disc grid-cols-1 gap-1.5 pl-5 text-[15px] leading-relaxed text-foreground">
            {LEVELS.map((level) => (
              <li key={level.id}>
                On {level.label}, diameters count within {level.tolerance.neckDiameter} mm and lengths within{" "}
                {level.tolerance.neckLength} mm
                {level.hints ? ", with hints on which slices to look at" : ""}
                {level.timeLimitMs ? `, with ${level.timeLimitMs / 60_000} minutes on the clock` : ""}.
              </li>
            ))}
          </ul>
          <p className={prose}>
            Two millimetres is about where experienced readers disagree with each other on a diameter. Stars count the
            measurements alone; points add the graft and your time. A measurement that doesn&apos;t count links back to
            its step here.
          </p>
        </Step>

        <section id="mistakes" aria-labelledby="mistakes-heading" className="mt-14 scroll-mt-20">
          <h2 id="mistakes-heading" className="text-xl font-bold text-foreground">
            Common mistakes
          </h2>
          <ul className="mt-3 grid max-w-prose list-disc grid-cols-1 gap-2 pl-5 text-[15px] leading-relaxed text-foreground">
            <li>Measuring the bright lumen instead of the outer wall, when thrombus or calcium lines the vessel.</li>
            <li>Measuring across the long axis of an oval, which is the slant of the cut, not the vessel.</li>
            <li>Starting the neck at the higher renal artery instead of the lowest.</li>
            <li>Taking the neck diameter too low, where the aorta has already started to widen.</li>
            <li>Measuring the iliacs at the bifurcation itself, rather than where the limbs will seal.</li>
          </ul>
        </section>

        <section id="real-planning" aria-labelledby="real-planning-heading" className="mt-14 scroll-mt-20">
          <h2 id="real-planning-heading" className="text-xl font-bold text-foreground">
            What real planning adds
          </h2>
          <p className={prose}>
            The practice teaches the core measurements on axial slices. Planning a real repair goes further, usually in
            dedicated software such as 3mensio, TeraRecon Aquarius, Siemens syngo.via or OsiriX, and every device has
            limits in its instructions for use that the case has to fit.
          </p>
          <ul className="mt-3 grid max-w-prose list-disc grid-cols-1 gap-2 pl-5 text-[15px] leading-relaxed text-foreground">
            <li>
              <strong>A centreline.</strong> The CT, taken at about 1 mm slices, is rebuilt in three dimensions, a line
              is drawn down the middle of the vessel, and diameters are measured at right angles to it. An axial slice
              only approximates that, which is why the practice asks for the short axis.
            </li>
            <li>
              <strong>Neck angles.</strong> The angle above the renals and the angle below them. Devices allow roughly
              45 to 60 degrees above and 45 to 90 degrees below, depending on the device.
            </li>
            <li>
              <strong>Neck shape.</strong> Diameters at the lowest renal and 5, 10 and 15 mm below it, to catch a neck
              that widens on the way down.
            </li>
            <li>
              <strong>Calcium and thrombus.</strong> How much of the neck&apos;s circumference they line. Devices allow
              up to about half.
            </li>
            <li>
              <strong>The aortic bifurcation and the access arteries.</strong> The aorta has to be wide enough where the
              limbs sit, 12 to 21 mm depending on the device, and the smallest external iliac wide enough for the
              delivery sheath, 5 to 8.5 mm on the main body&apos;s side.
            </li>
            <li>
              <strong>The branches.</strong> Accessory renal arteries, the inferior mesenteric artery and the lumbar
              arteries, which can keep filling the sac after a repair.
            </li>
          </ul>
          <p className={prose}>
            By the ESVS definition, a neck is hostile when it&apos;s shorter than 10 mm, wider than 28 mm, angled more
            than 60 degrees, conical, or heavily lined with thrombus or calcium.
          </p>
        </section>

        <section aria-labelledby="sources-heading" className="mt-14">
          <h2 id="sources-heading" className="text-xl font-bold text-foreground">
            Sources
          </h2>
          <ul aria-labelledby="sources-heading" className="mt-3 grid grid-cols-1 gap-1.5 text-[14px] text-muted">
            {SOURCES.map((source) => (
              <li key={source.href}>
                <a href={source.href} className={link} target="_blank" rel="noopener noreferrer">
                  {source.label}
                </a>
              </li>
            ))}
          </ul>
        </section>

        <div className="mt-12 flex flex-wrap items-center gap-3">
          <Link href="/evar" className={`${button} border-foreground font-semibold`}>
            Start practising
          </Link>
          <Link href="/evar/welcome" className={button}>
            Back to the welcome page
          </Link>
        </div>
        <p className="mt-8 text-[13px] text-muted">
          For practice only. Not for planning a real patient&apos;s repair: each device&apos;s instructions for use are
          the source of truth.
        </p>
      </main>
    </div>
  );
}
