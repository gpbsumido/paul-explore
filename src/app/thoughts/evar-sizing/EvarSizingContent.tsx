import Link from "next/link";
import ThoughtLayout from "@/app/thoughts/ThoughtLayout";
import { WhatsNext } from "@/app/thoughts/_shared/ThoughtUpdates";

const code =
  "rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground";

const pre =
  "mt-3 overflow-x-auto rounded-lg bg-surface p-3 text-[13px] font-mono text-foreground";

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

export default function EvarSizingContent() {
  return (
    <ThoughtLayout
      breadcrumb="EVAR Sizing"
      title="Practising EVAR Sizing on a CT Phantom"
      intro={
        <>
          Before an endovascular aneurysm repair, someone sits with the CT and
          measures: how wide the aorta is just below the renal arteries, how
          long that healthy neck runs before the aneurysm starts, how big the
          sac gets, how wide each common iliac is. Those numbers decide whether
          a stent graft fits and which one. It&apos;s a skill you get better at
          by doing it and being told how far off you were, and the second half
          is the part that&apos;s hard to come by. So I built{" "}
          <Link href="/evar" className="underline underline-offset-2">
            EVAR Sizing
          </Link>
          : scroll the axial slices, put calipers down, record five
          measurements, and get each one checked against an exact answer.
        </>
      }
    >
      <Section title="I wanted real scans, and shipped a phantom">
        <p className="text-muted">
          The obvious version uses deidentified patient CTA. There are openly
          licensed aortic datasets with segmentations, and that is still where
          I want this to go. What stopped me for the first cut wasn&apos;t
          licensing or file size, though both matter. It was the answer key.
          A segmentation tells you which voxels are aorta. It doesn&apos;t tell
          you where the neck ends, and a practice tool that can&apos;t say
          what the right answer is can only show you a picture.
        </p>
        <p className="mt-3 text-muted">
          A phantom flips that. Each case is a dozen numbers: neck radius, sac
          radius, which slice the lowest renal comes off, where the sac peaks,
          where the bifurcation is, the two iliac radii. The image is drawn
          from those numbers and so is the reference, so they can&apos;t
          disagree. The page says plainly that these aren&apos;t patient
          images, because a practice tool that is vague about its own data
          teaches the wrong habit.
        </p>
      </Section>

      <Section title="A slice is a function, not a file">
        <p className="text-muted">
          Nothing is stored. <code className={code}>sliceHU(case, z)</code>{" "}
          draws one 384 by 384 slice in Hounsfield units on demand: air, a
          body outline, a vertebra, kidneys that come and go with the slice,
          renal arteries running out sideways, and the aorta drawn last. Noise
          comes from a seeded generator, so slice 40 looks the same every time
          you come back to it. One slice is about 150,000 pixels, which is a
          few milliseconds, so there is no volume sitting in memory and nothing
          to download beyond the page.
        </p>
        <p className="mt-3 text-muted">
          That function is also the seam for real data. The viewer and the
          scoring only ever ask for a slice by index, so a loader that reads a
          stack of real images answers the same question without either of
          them changing.
        </p>
        <pre className={pre}>
          {`export function sliceHU(c: EvarCase, z: number): Int16Array`}
        </pre>
      </Section>

      <Section title="Outer wall, thrombus included">
        <p className="text-muted">
          The lumen in the sac is eccentric, pushed toward the front, with
          thrombus lining the back the way it usually does. On the angio
          window the bright contrast column is the eye-catching thing, and it
          is the wrong edge: EVAR diameters go outer wall to outer wall. The
          soft-tissue window is there so the wall is easy to find once you know
          to look for it.
        </p>
        <p className="mt-3 text-muted">
          Scoring needed definitions written down, because a tolerance on an
          undefined measurement isn&apos;t a tolerance. The neck ends at the
          first slice more than 10% wider than the neck. Diameters pass within
          2 mm, roughly where experienced readers disagree with each other.
          Lengths pass within 5 mm, about two slices either way. Unmeasured
          tasks say so instead of failing, because skipping one isn&apos;t the
          same as getting it wrong.
        </p>
      </Section>

      <Section title="Calipers without a mouse">
        <p className="text-muted">
          A caliper is two clicks, which leaves out anyone who isn&apos;t
          using a pointer. The image takes focus, the arrow keys steer a
          crosshair (Shift moves five pixels), Enter drops each end, Escape
          clears, and Page Up and Page Down change slice. The measured length
          goes to a live region, so you hear the number as soon as the second
          point lands.
        </p>
        <p className="mt-3 text-muted">
          The buttons all say &quot;Record caliper&quot; on screen, with the
          task name in visually hidden text for screen readers. My first pass
          put the space inside the hidden span, and the test couldn&apos;t
          find the button. The text content read correctly, but the computed
          accessible name trims each child and the two halves ran together. A
          screen reader would have read it out as one word.
        </p>
        <pre className={pre}>
          {`TestingLibraryElementError: Unable to find an accessible element with
the role "button" and name \`/record caliper as proximal neck diameter/i\``}
        </pre>
      </Section>

      <WhatsNext
        nowShipped={[
          "Two phantom cases with different anatomy: a long straight neck, and a short neck with a wide right iliac that changes the plan.",
          "Axial slices drawn on demand in Hounsfield units, with angio and soft-tissue windows and patient-right-on-image-left orientation.",
          "A two-point caliper that works with a mouse or entirely from the keyboard, with the length in a live region.",
          "Five scored measurements against exact references, with written tolerances and a debrief on what the anatomy means for the repair.",
        ]}
        couldImprove={[
          "Everything is axial. Neck angulation and lengths along a curved centerline need a 3D reconstruction or curved planar reformat, which is the step real planning software takes.",
          "The phantom is tidy. Real necks are conical, calcified and angled, and the cases don't yet include the ugly ones that make sizing hard.",
          "There is no zoom, so a 2 mm tolerance is about two pixels at full size. That makes it harder than it should be on a small screen.",
        ]}
        upcoming={[
          "Real deidentified CTA cases from an openly licensed aortic dataset, each with a reference set measured by hand, loaded through the same per-slice function.",
          "Zoom and pan on the viewer, and a hostile-neck case.",
        ]}
      />
    </ThoughtLayout>
  );
}
