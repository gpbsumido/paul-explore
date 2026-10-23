import Link from "next/link";
import ThoughtLayout from "@/app/thoughts/ThoughtLayout";
import { Update, UpdateTimeline, WhatsNext } from "@/app/thoughts/_shared/ThoughtUpdates";

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
      <UpdateTimeline
        entries={[
          {
            id: "update-2026-10-23-simpler",
            date: "Oct 23, 2026",
            title: "Thirteen rows and a disclaimer, all at once",
          },
          {
            id: "update-2026-10-23-tour",
            date: "Oct 23, 2026",
            title: "The page had grown past explaining itself",
          },
          {
            id: "update-2026-10-23-real-cta",
            date: "Oct 23, 2026",
            title: "Fifty-six scans, one aneurysm",
          },
          {
            id: "update-2026-10-23-sheets",
            date: "Oct 23, 2026",
            title: "Three tables, one 22 mm iliac, three different answers",
          },
          {
            id: "update-2026-10-23-centerline",
            date: "Oct 23, 2026",
            title: "The slices said 10 mm. The vessel said 16.",
          },
          {
            id: "update-2026-10-23-hostile-necks",
            date: "Oct 23, 2026",
            title: "Every neck was a clean tube, which is the one thing real necks never are",
          },
          {
            id: "update-2026-10-23-zoom",
            date: "Oct 23, 2026",
            title: "Two pixels is not a fair test",
          },
          {
            id: "update-2026-10-23-admin-results",
            date: "Oct 23, 2026",
            title: "A spreadsheet I don't have to open",
          },
          {
            id: "update-2026-10-23-results",
            date: "Oct 23, 2026",
            title: "The practice has a memory now, and it stays in the browser",
          },
          {
            id: "update-2026-10-23-cases-and-scan",
            date: "Oct 23, 2026",
            title: "Six more cases, and a scan that finally has an IVC",
          },
          {
            id: "update-2026-10-23-light-mode",
            date: "Oct 23, 2026",
            title: "A reading room is dark, but this page isn't one",
          },
          {
            id: "update-2026-10-23-stage",
            date: "Oct 23, 2026",
            title: "Stars for the skill, points for everything else",
          },
          {
            id: "update-2026-10-22-study-export",
            date: "Oct 22, 2026",
            title: "One line per attempt, because that's what a spreadsheet wants",
          },
          {
            id: "update-2026-10-22-references",
            date: "Oct 22, 2026",
            title: "Correcting an answer without a deploy",
          },
          {
            id: "update-2026-10-22-study",
            date: "Oct 22, 2026",
            title: "Every attempt recorded once, for anyone who opts in",
          },
          {
            id: "update-2026-10-22-devices",
            date: "Oct 22, 2026",
            title: "Picking the graft, and why a 13 mm iliac gets a 16 mm limb",
          },
          {
            id: "update-2026-10-22-levels",
            date: "Oct 22, 2026",
            title: "Easy, Medium, and a Hard that gives you five minutes",
          },
        ]}
      />

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

      <Update
        id="update-2026-10-22-levels"
        date="October 22, 2026"
        title="Easy, Medium, and a Hard that gives you five minutes"
      >
        <p>
          One page with one standard is a test, not practice. I split it into
          three levels, and each one changes something real: which anatomy you
          get, whether you&apos;re told where to look, how close counts, and
          whether there&apos;s a clock.
        </p>
        <pre className={pre}>
          {`Easy    long neck              hints   ±3 mm / ±8 mm   no clock
Medium  long + short neck      none    ±2 mm / ±5 mm   no clock
Hard    short + hostile neck   none    ±2 mm / ±5 mm   5:00, hands in at 0:00`}
        </pre>

        <h3 className="mt-5 mb-2 text-[15px] font-semibold text-foreground">
          The neck doesn&apos;t end where I told the phantom it ends.
        </h3>
        <p className="text-muted">
          Hard needed a case worse than the short neck: 30 mm wide, about a
          centimetre long, with a right iliac wide enough to need the biggest
          limb. I first put the renal at slice 32 and the end of the straight
          neck at 36, which reads as 8 mm, and the reference came out at 14.
          The phantom flares the sac
          in on a smoothstep, and the scoring says the sac starts at the first
          slice more than 10% wider than the neck, not where the flare begins.
          The curve is so flat at the start that it takes three more slices to
          get there.
        </p>
        <pre className={pre}>
          {`neckEndSlice 36, sacPeak 52, neck 15 mm, sac 35 mm
z=37  t=0.063  r=15.22   (need > 16.5)
z=38  t=0.125  r=15.86
z=39  t=0.188  r=16.85   <- sac starts here
renal 34 -> neck length (39 - 34) x 2 mm = 10 mm`}
        </pre>
        <p className="mt-3 text-muted">
          So the hostile case&apos;s renal sits at slice 34 and its flare
          begins at 36, and the test pins the neck length the scoring will
          actually use rather than the number I typed into the case.
        </p>

        <h3 className="mt-5 mb-2 text-[15px] font-semibold text-foreground">
          A hint centred on the answer is just the answer.
        </h3>
        <p className="text-muted">
          Easy tells you which slices to look at: the lowest renal, where the
          aneurysm starts, the widest part of the sac, a stretch of iliac clear
          of the bifurcation. A range of plus or minus three slices would have
          handed over the answer as its midpoint, so each range sits a little
          off-centre, and a test checks the midpoint isn&apos;t the answer.
        </p>

        <h3 className="mt-5 mb-2 text-[15px] font-semibold text-foreground">
          The clock is visible every second and speaks three times.
        </h3>
        <p className="text-muted">
          The countdown has <code className={code}>role=&quot;timer&quot;</code>,
          which isn&apos;t a live region by default, and that&apos;s right: a
          screen reader reading every second aloud would make the exercise
          impossible. Next to it, a polite live region stays empty until a
          minute is left, then thirty seconds, then time&apos;s up. At zero your
          answers are handed in as they stand, and the results line says how
          many landed and how long it took.
        </p>
        <p className="mt-3 text-muted">
          Handing in at zero happens inside the interval callback, not in an
          effect that watches the remaining time. The lint rules here
          don&apos;t allow setting state inside an effect body or reading the
          clock while rendering, and keeping the tick as the only thing that
          reads <code className={code}>Date.now()</code> is cleaner anyway.
          Start over resets the clock, which on a practice page is fine. It
          matters more once attempts are recorded, where the first try is the
          one that counts.
        </p>
      </Update>

      <Update
        id="update-2026-10-22-devices"
        date="October 22, 2026"
        title="Picking the graft, and why a 13 mm iliac gets a 16 mm limb"
      >
        <p>
          The measurements only matter because of what they decide. So after
          measuring, you now pick the stent graft: which iliac the main body
          goes up, then an Endurant II/IIs main body, a contralateral limb, and
          anything extra on the main body&apos;s own leg, from the
          manufacturer&apos;s public sizing sheet.
        </p>

        <h3 className="mt-5 mb-2 text-[15px] font-semibold text-foreground">
          The sheet is two lookup tables and a catalogue.
        </h3>
        <p className="text-muted">
          A neck diameter maps to a main-body diameter, an iliac diameter maps
          to a limb diameter, and the catalogue says which combinations of
          diameter, leg and length exist. I transcribed it as data, rounded
          measurements to the whole millimetre the bands are written in, and
          treat anything off either end as &quot;no standard device&quot;. I
          left out the one limb length the sheet marks as not available
          everywhere.
        </p>
        <pre className={pre}>
          {`neck   19-20  21-22  23-25  26-28  29-32
body     23     25     28     32     36

iliac   8-9  10-11  12-14  15-18  19-22  23-25
limb     10     13     16     20     24     28`}
        </pre>

        <h3 className="mt-5 mb-2 text-[15px] font-semibold text-foreground">
          I wrote the test expecting a 13 mm limb in a 13 mm iliac. The table disagreed.
        </h3>
        <p className="text-muted">
          My first grading test picked a 13 mm limb for the long-neck
          case&apos;s 13 mm left iliac and expected a match. It failed, and the
          code was right: 13 falls in the 12 to 14 band, and that band gets a
          16. A limb has to be oversized to seal, which is the whole point of
          the table, and I&apos;d skipped straight past it. It also meant both
          of that case&apos;s iliacs land on 16, so it couldn&apos;t tell me
          whether a limb went to the right side. The side tests use the
          short-neck case instead, where the iliacs need 24 and 20.
        </p>
        <pre className={pre}>
          {`AssertionError: expected [ 'match', 'mismatch', 'match' ]
  to deeply equal [ 'match', 'match', 'match' ]`}
        </pre>

        <h3 className="mt-5 mb-2 text-[15px] font-semibold text-foreground">
          The verdict is about the anatomy, and a second column says why you missed.
        </h3>
        <p className="text-muted">
          Each pick is graded against what the table gives for the real
          anatomy. Next to it is what the table gives for your own
          measurements. When those two differ, the pick went wrong because a
          measurement did, and that&apos;s a different lesson from reading the
          table wrong. Only diameters are graded. Lengths come from a
          centerline, and an axial phantom doesn&apos;t have one, so lengths
          are listed for choosing but not scored.
        </p>
        <p className="mt-3 text-muted">
          The page says plainly that this is the public sheet, for practice,
          not affiliated with Medtronic and not for clinical use. A sizing
          table on a practice site that looks authoritative is a liability,
          and the instructions for use are the real source.
        </p>
      </Update>

      <Update
        id="update-2026-10-22-study"
        date="October 22, 2026"
        title="Every attempt recorded once, for anyone who opts in"
      >
        <p>
          The point of scoring people is to find out whether they get better.
          So signed-in users can now join a study: agree to a consent text,
          say where they are in training, and every attempt they check is
          saved to a record that can be compared over a career. Practice works
          exactly the same without joining, or without signing in at all.
        </p>

        <h3 className="mt-5 mb-2 text-[15px] font-semibold text-foreground">
          Consent is versioned, and the text says it&apos;s a draft.
        </h3>
        <p className="text-muted">
          A study needs ethics approval before its data can go in a paper, and
          this one doesn&apos;t have it yet. The consent version is{" "}
          <code className={code}>2026-10-draft</code>, the form says so in its
          first line, and changing the text means changing the version, which
          re-stamps when each person agreed. Rows are keyed by a random
          participant id, and the export carries that id and nothing that
          names anyone.
        </p>

        <h3 className="mt-5 mb-2 text-[15px] font-semibold text-foreground">
          A network blip shouldn&apos;t turn one attempt into two data points.
        </h3>
        <p className="text-muted">
          The browser makes an id when an attempt starts and sends it with the
          answers. Checking twice, retrying after a timeout, or a request that
          landed but whose response didn&apos;t all send the same id, and the
          insert ignores the repeat. A duplicated attempt in a learning-curve
          study isn&apos;t noise, it&apos;s a fake extra practice session.
        </p>
        <pre className={pre}>
          {`INSERT INTO evar_attempts (participant_id, client_attempt_id, ...)
VALUES ($1, $2, ...)
ON CONFLICT (client_attempt_id) DO NOTHING
RETURNING *`}
        </pre>

        <h3 className="mt-5 mb-2 text-[15px] font-semibold text-foreground">
          I capped measurements at 300 mm. A caliper across the whole slice is 460.
        </h3>
        <p className="text-muted">
          The API validates every number, and my first bound was 300 mm on the
          grounds that no aorta is that wide. That&apos;s true, and beside the
          point: the study records what people actually measured, including
          the caliper someone drags corner to corner by mistake. With the 300
          cap that whole attempt would have been rejected, and the most
          interesting wrong answers would never reach the data. The bound is
          now 1000 mm, which only stops garbage.
        </p>

        <h3 className="mt-5 mb-2 text-[15px] font-semibold text-foreground">
          Withdrawing deletes, it doesn&apos;t hide.
        </h3>
        <p className="text-muted">
          I considered a withdrawn flag and decided against it. If someone
          leaves a study, the honest version is that their data is gone, not
          filtered out of a query someone might forget to filter. Withdraw
          asks once, then deletes the participant, and the attempts go with
          it.
        </p>
      </Update>

      <Update
        id="update-2026-10-22-references"
        date="October 22, 2026"
        title="Correcting an answer without a deploy"
      >
        <p>
          The phantom computes every reference exactly, but exact only means
          exactly what I defined. If a vascular surgeon looks at a case and
          says the neck is 26, not 24, I want to change that number on a
          page, not in a geometry file. So there&apos;s now an admin page at{" "}
          <code className={code}>/evar/admin</code> that sets a case&apos;s
          five answers by hand.
        </p>

        <h3 className="mt-5 mb-2 text-[15px] font-semibold text-foreground">
          An override replaces five numbers and nothing else.
        </h3>
        <p className="text-muted">
          Hints, the slice the sac starts on and the Hard-level clock all
          still come from the geometry. Only the scored values change, and if
          the API is unreachable the page quietly scores against the phantom,
          because practice shouldn&apos;t break when an admin feature does.
        </p>
        <pre className={pre}>
          {`const row = overrides.find((o) => o.caseId === c.id);
if (!row) return phantom;
return { ...phantom, neckDiameter: row.neckDiameter, neckLength: row.neckLength,
  maxSac: row.maxSac, rightCia: row.rightCia, leftCia: row.leftCia };`}
        </pre>

        <h3 className="mt-5 mb-2 text-[15px] font-semibold text-foreground">
          Changing the answer key mid-study is only safe because attempts keep theirs.
        </h3>
        <p className="text-muted">
          A correction changes scores for everyone from the next load. For
          practice that&apos;s the point. For the study it would be a quiet
          disaster if old attempts were re-scored against the new key, but
          each recorded score already carries the reference it was judged
          against, so an analysis can see exactly which key was live.
        </p>
        <pre className={pre}>
          {`scores: [{ id: "neckDiameter", yours: 24.2, reference: 26, verdict: "outside" }, ...]`}
        </pre>

        <h3 className="mt-5 mb-2 text-[15px] font-semibold text-foreground">
          I keyed each form on its save time. That ate the Saved message.
        </h3>
        <p className="text-muted">
          My first idea for Reset to phantom was to key each case&apos;s form
          on when it was last saved, so a reset would remount it with the
          phantom&apos;s numbers. It would have, and it would also have
          remounted after every save, wiping the confirmation the moment the
          refetch landed. Reset now puts the phantom values back itself, and
          the form stays mounted.
        </p>
      </Update>

      <Update
        id="update-2026-10-22-study-export"
        date="October 22, 2026"
        title="One line per attempt, because that's what a spreadsheet wants"
      >
        <p>
          The API has served the study export to admins since the research
          tracking landed, but only as JSON from a curl. The admin page now has
          a study data card that says how much has been recorded and downloads
          it as a CSV or as the raw JSON.
        </p>

        <h3 className="mt-5 mb-2 text-[15px] font-semibold text-foreground">
          The export is two lists. Analysis wants one table.
        </h3>
        <p className="text-muted">
          Participants and attempts come back separately, so a training level
          isn&apos;t repeated on every attempt. Anyone opening this in a
          spreadsheet or R wants the opposite: one row per attempt with the
          profile next to it, and every measurement and device grade as its own
          column. So the CSV joins them, and an attempt whose participant
          isn&apos;t in the export keeps an empty profile rather than
          disappearing.
        </p>
        <pre className={pre}>
          {`participant_id,training_level,training_year,specialty,consent_version,attempt_id,case_id,level,
app_version,started_at,submitted_at,duration_ms,time_limit_ms,timed_out,
neckDiameter_yours,neckDiameter_reference,neckDiameter_verdict, ... leftCia_verdict,
ipsilateral_side,mainBody_code,mainBody_picked,mainBody_expected,mainBody_verdict, ... ipsilateral_verdict`}
        </pre>

        <h3 className="mt-5 mb-2 text-[15px] font-semibold text-foreground">
          I wrote my own CSV quoting, then found the site already had a better one.
        </h3>
        <p className="text-muted">
          Specialty is free text, so it needs quoting for commas, quotes and
          line breaks. I had that half written before I found the shared CSV
          helper, which also defuses a cell starting with{" "}
          <code className={code}>=</code>, so a participant can&apos;t type a
          formula that runs when I open the file. Mine didn&apos;t do that.
        </p>
        <pre className={pre}>
          {`specialty: =HYPERLINK(1)   ->   '=HYPERLINK(1)`}
        </pre>

        <h3 className="mt-5 mb-2 text-[15px] font-semibold text-foreground">
          Missing is blank, not zero.
        </h3>
        <p className="text-muted">
          A measurement nobody made, or a limb nobody picked, is an empty cell,
          so a spreadsheet treats it as missing rather than averaging in a zero.
          The JSON download is there for anything the flattening loses.
        </p>
      </Update>

      <Update
        id="update-2026-10-23-stage"
        date="October 23, 2026"
        title="Stars for the skill, points for everything else"
      >
        <p>
          The practice worked, but it read like a form. The scan was a 576px
          square in a page of stacked sections, and finishing a case dropped a
          table under the buttons. So I gave the scan the screen and made
          finishing a case feel like finishing something.
        </p>

        <h3 className="mt-5 mb-2 text-[15px] font-semibold text-foreground">
          The scan is the thing to look at, so everything else floats.
        </h3>
        <p className="text-muted">
          The page is now a dark stage the height of the screen, dark in
          either site theme the way a reading room is. A top bar holds the
          level, case, clock and best. The measurements and the device picker
          sit either side of a viewer sized to whatever height is left, and the
          window, slice and caliper controls live in a dock that stays on
          screen while scrolling. The dark comes from nesting the theme rather
          than hard-coding colours, so every token underneath still works:
        </p>
        <pre className={pre}>
          {`<div data-theme="dark" className="bg-background text-foreground">
  ...
  <SliceViewer className="max-w-[min(100%,calc(100dvh_-_17rem))]" />`}
        </pre>

        <h3 className="mt-5 mb-2 text-[15px] font-semibold text-foreground">
          Points reward everything. Stars only count measuring.
        </h3>
        <p className="text-muted">
          A pass is worth 50 just for landing inside tolerance, and up to 100
          for landing on the answer, so a measurement right on the edge still
          beats one just outside it. Device sizes that match the table add 50
          each, Hard adds a bonus for time left, and the level scales the lot.
          Stars ignore all of that and count measurements within tolerance,
          because measuring is the skill this exists to practise. A perfect
          device pick on wrong numbers shouldn&apos;t look like a good run.
        </p>
        <pre className={pre}>
          {`measurement  50 + 50 × (1 − |off by| / tolerance), 0 outside
device       50 per size that matches the table
time bonus   Hard only, 100 × time left / 5:00
level        ×1 Easy, ×1.5 Medium, ×2 Hard
stars        5 within → 3, 4 → 2, 3 → 1`}
        </pre>

        <h3 className="mt-5 mb-2 text-[15px] font-semibold text-foreground">
          A best compared against itself is always a tie.
        </h3>
        <p className="text-muted">
          Bests live in localStorage per level and case, because practice is
          anonymous and there&apos;s no account to hang them on. The catch is
          that the best gets written the moment a case finishes, so by the time
          the popup asks whether this run beat it, the stored best already is
          this run. The popup compares against the best from when the attempt
          started instead, read once on Try again, Next case or a level change.
        </p>
        <pre className={pre}>
          {`const [bestAtStart, setBestAtStart] = useState(() => bestFor(medium, 0));
// ...
useEffect(() => {
  if (total !== null) recordBest(level.id, evarCase.id, total);
}, [total, level.id, evarCase.id]);`}
        </pre>

        <h3 className="mt-5 mb-2 text-[15px] font-semibold text-foreground">
          The popup hides the page, which broke the test that checks twice.
        </h3>
        <p className="text-muted">
          The study records an attempt once however many times its answers are
          checked, and a test pressed Check answers twice to prove it. With the
          results in a modal, the stage behind it is hidden from assistive tech
          and Check answers becomes Show results once a case is done, so the
          second press had nothing to find:
        </p>
        <pre className={pre}>
          {`TestingLibraryElementError: Unable to find an accessible element with
the role "button" and name \`/check answers/i\``}
        </pre>
        <p className="mt-3 text-muted">
          The guarantee still mattered, just through a different door. The test
          now closes the popup to review the scan and opens it again, and still
          expects exactly one recorded attempt.
        </p>
      </Update>

      <Update
        id="update-2026-10-23-light-mode"
        date="October 23, 2026"
        title="A reading room is dark, but this page isn't one"
      >
        <p>
          A few hours after the stage shipped, I looked at it in light mode.
          The header was light, and everything under it was near-black.
        </p>

        <h3 className="mt-5 mb-2 text-[15px] font-semibold text-foreground">
          I forced the theme on purpose, and that was the bug.
        </h3>
        <p className="text-muted">
          The stage set its own theme on a wrapper, on the reasoning that CT is
          read in a dark room. It worked exactly as written, which is why
          nothing caught it: every token resolved, contrast held, the tests
          passed. But someone who picked light mode had picked light mode, and
          a dark slab under a light header reads as broken, not as a reading
          room. Only the scan needs to be black, and the canvas already is.
        </p>
        <pre className={pre}>
          {`- <div data-theme="dark" className="bg-background text-foreground">
+ <div className="text-foreground">`}
        </pre>

        <h3 className="mt-5 mb-2 text-[15px] font-semibold text-foreground">
          Glass is fine for panels that sit still, not for one that floats over them.
        </h3>
        <p className="text-muted">
          The same screenshot showed the dock letting the task rows read
          through the slider while scrolling. The panels are glass because
          there&apos;s only the background behind them. The dock moves over
          text, so it gets a near-opaque surface instead.
        </p>
        <pre className={pre}>
          {`const dock = "rounded-2xl border border-border bg-surface/95 p-4 shadow-lg backdrop-blur";`}
        </pre>
      </Update>

      <Update
        id="update-2026-10-23-cases-and-scan"
        date="October 23, 2026"
        title="Six more cases, and a scan that finally has an IVC"
      >
        <p>
          Easy had one case, so once you&apos;d done it there was nothing left
          to practise on. And the slices looked like a diagram: a bright circle
          on a grey oval, with a round bone underneath.
        </p>

        <h3 className="mt-5 mb-2 text-[15px] font-semibold text-foreground">
          Real scans were the plan again, and still weren&apos;t on the table.
        </h3>
        <p className="text-muted">
          I couldn&apos;t pull an open aortic CTA set down from where I was
          working, and the sets I know of are mostly normal aortas anyway.
          Each case would also need its five answers measured by hand before
          it could be scored. So the phantom got more convincing instead, and
          real cases stay on the list below.
        </p>

        <h3 className="mt-5 mb-2 text-[15px] font-semibold text-foreground">
          Two more cases per level, and Easy stopped being one case.
        </h3>
        <p className="text-muted">
          Each case is still just a dozen numbers, so adding six was cheap.
          The new ones are picked so each level teaches its own thing: Easy
          gets anatomy any standard device fits, Medium gets narrow iliacs and
          the wide iliac on the other side, and Hard gets a neck a millimetre
          under the usual landing length and an 8 cm sac with both iliacs on
          the widest limb.
        </p>
        <pre className={pre}>
          {`easy:   ["long-neck", "small-sac", "wide-sac"]
medium: ["long-neck", "short-neck", "narrow-iliacs", "ectatic-left"]
hard:   ["short-neck", "hostile-neck", "short-wide", "giant-sac"]`}
        </pre>
        <p className="text-muted">
          The titles lost their numbers on the way. Easy would otherwise have
          read Case 1, Case 4, Case 5.
        </p>

        <h3 className="mt-5 mb-2 text-[15px] font-semibold text-foreground">
          The aorta was the only thing on the slice that looked like anatomy.
        </h3>
        <p className="text-muted">
          Everything around it is now drawn too: the IVC on the patient&apos;s
          right, pushed further over by a big sac; the liver and spleen at the
          top of the stack; kidneys in the arterial phase, with a bright cortex,
          a darker medulla and fat in the sinus; psoas thickening toward the
          pelvis; a vertebra with laminae and a spinous process; bowel loops
          with gas floating above a fluid level; and the scanner table under
          the patient. None of it moves the aorta or the iliacs, so every
          reference answer is exactly what it was.
        </p>

        <h3 className="mt-5 mb-2 text-[15px] font-semibold text-foreground">
          Per-pixel noise looks like a badly tuned TV, not a scanner.
        </h3>
        <p className="text-muted">
          The old noise was independent at every pixel. Real CT noise is
          grainy, because neighbouring pixels share their reconstruction, and
          edges are slightly soft from partial volume. Now the tissue gets a
          small blur, then noise built on a coarse grid and interpolated, with
          a little fine speckle on top. A test checks neighbouring pixels in
          the lumen actually move together.
        </p>
        <pre className={pre}>
          {`const coarse = Float32Array.from({ length: cells * cells }, () => (random() + random() + random() - 1.5) * 36);
...
out[y * SIZE + x] = top * (1 - fy) + bottom * fy + (random() - 0.5) * 16;`}
        </pre>

        <h3 className="mt-5 mb-2 text-[15px] font-semibold text-foreground">
          My first bowel-gas test passed before I&apos;d drawn any bowel.
        </h3>
        <p className="text-muted">
          It counted air inside a box in the middle of the slice, and the box
          reached past the edge of the old body outline, so it was counting the
          room. I only noticed because a red test came up green. The box is
          tighter now, and it failed first, the way it should have.
        </p>

        <h3 className="mt-5 mb-2 text-[15px] font-semibold text-foreground">
          It got 2.3 times slower, and the hot spot wasn&apos;t the new anatomy.
        </h3>
        <p className="text-muted">
          I set a budget of twice the old cost per slice. The first version
          was over it. Building ellipses inside the pixel loop was some of it,
          but most of the remainder was <code>Math.hypot</code> in the bowel
          and canal checks, called on every pixel in the abdomen. Squared
          distances do the same job.
        </p>
        <pre className={pre}>
          {`before            11.5 ms per slice
first pass        26.7 ms
ellipses hoisted  23.7 ms
no Math.hypot     20.7 ms   (1.8x, inside budget)`}
        </pre>
      </Update>

      <Update
        id="update-2026-10-23-results"
        date="October 23, 2026"
        title="The practice has a memory now, and it stays in the browser"
      >
        <p>
          A personal best tells you that you got better once. It doesn&apos;t
          tell you whether you&apos;re getting better, which is the whole point
          of practising.
        </p>

        <h3 className="mt-5 mb-2 text-[15px] font-semibold text-foreground">
          Every finished case is kept, not just the best one.
        </h3>
        <p className="text-muted">
          <code>/evar/results</code> shows a card per level with attempts,
          the average number of measurements within tolerance and the best
          points, a line of measurements within tolerance attempt by attempt,
          and a table of every attempt, newest first. The table is the text
          version of the chart, so the chart itself is hidden from screen
          readers rather than described twice.
        </p>
        <pre className={pre}>
          {`{ id, levelId, caseId, finishedAt, within, stars, total, timedOut,
  deltas: { neckDiameter: 0.4, maxSac: -1.2 } }`}
        </pre>

        <h3 className="mt-5 mb-2 text-[15px] font-semibold text-foreground">
          I kept it on the device, not on the API.
        </h3>
        <p className="text-muted">
          Practice is anonymous for anyone outside the study, and the study
          already keeps its own record for people who consented. Putting
          everyone&apos;s practice on the API would mean an account or a
          tracking id for people who only came to measure a neck. So the
          history sits in localStorage next to the personal bests, capped at
          500 attempts and checked against a schema on the way in, so garbage
          reads as an empty history rather than a crash.
        </p>

        <h3 className="mt-5 mb-2 text-[15px] font-semibold text-foreground">
          My first version recorded the attempt on every render.
        </h3>
        <p className="text-muted">
          I built the entry in render and recorded it in an effect that
          depended on it. The entry was a new object every render, so the
          effect ran every render too, and only the id-based de-duplication
          stopped the history filling up. The lint caught it before a test
          did:
        </p>
        <pre className={pre}>
          {`The 'historyEntry' conditional could make the dependencies of useEffect
Hook change on every render.`}
        </pre>
        <p className="text-muted">
          It now works the way the study panel already did: a set of attempt
          ids already kept, checked inside the effect, so each attempt is
          written once with the result it finished with.
        </p>
      </Update>

      <Update
        id="update-2026-10-23-admin-results"
        date="October 23, 2026"
        title="A spreadsheet I don't have to open"
      >
        <p>
          The study download was the right shape for analysis and the wrong
          shape for a quick look. To answer &quot;are the students timing out
          on Hard?&quot; I had to download a CSV, open it and build a filter
          by hand, every time.
        </p>

        <h3 className="mt-5 mb-2 text-[15px] font-semibold text-foreground">
          The filters run on what the admin page already fetched.
        </h3>
        <p className="text-muted">
          <code>/evar/admin/results</code> reads the same export the download
          card uses, through one shared query, and narrows it in the browser
          by level, case, training level, timed out and a date range. There
          is no new endpoint and no query language on the API. The study is a
          few hundred attempts at most, so filtering them in memory is
          cheaper than another round trip, and the rows the page shows are
          exactly the rows the CSV would have.
        </p>
        <pre className={pre}>
          {`filterStudyRows(rows, { level: "hard", caseId: null,
  trainingLevel: "medical-student", timedOut: true,
  from: "2026-10-01", to: null })`}
        </pre>

        <h3 className="mt-5 mb-2 text-[15px] font-semibold text-foreground">
          An unmeasured answer isn&apos;t a wrong one.
        </h3>
        <p className="text-muted">
          The summary table gives, for each of the five measurements, how
          often it landed within tolerance out of how often it was taken. A
          timed-out attempt that never got to the iliacs counts as not
          measured rather than missed, so the share answers &quot;when people
          measure this, do they get it right&quot; instead of blending that
          with &quot;did they run out of time&quot;. The timed-out filter is
          there for the second question.
        </p>

        <h3 className="mt-5 mb-2 text-[15px] font-semibold text-foreground">
          The download follows the filters.
        </h3>
        <p className="text-muted">
          &quot;Download these as CSV&quot; writes the filtered rows with the
          same columns as the full export, so a cut I find on the page goes
          straight into R without redoing it. The filters live in the page,
          not the URL, which keeps it simple and means a filtered view
          can&apos;t be shared as a link yet.
        </p>
      </Update>

      <Update
        id="update-2026-10-23-zoom"
        date="October 23, 2026"
        title="Two pixels is not a fair test"
      >
        <p>
          A slice is 384 pixels across at 0.85 mm a pixel, so the 2 mm
          diameter tolerance is a little over two pixels. On a laptop
          that&apos;s tight. On a phone, where the whole slice is narrower
          than a thumb is long, it was mostly luck. The viewer zooms now,
          from 1× to 8×, and pans.
        </p>

        <h3 className="mt-5 mb-2 text-[15px] font-semibold text-foreground">
          Zoom is a view, so the calipers never find out.
        </h3>
        <p className="text-muted">
          Caliper points were already stored in image pixels, and that&apos;s
          what made this small. Zoom is a scale plus the image point sitting
          in the middle of the viewport. Drawing goes through it, and so does
          turning a click back into an image point, but the points themselves
          don&apos;t change. <code className={code}>distanceMm</code>, the
          scoring and the live readout are untouched, and the test I cared
          most about says ten pixels is the same number of millimetres at 4×
          as at 1×.
        </p>
        <pre className={pre}>
          {`// zooming keeps the anchor under the pointer
const ratio = view.scale / scale;
x: anchor.x - (anchor.x - view.x) * ratio,
y: anchor.y - (anchor.y - view.y) * ratio,`}
        </pre>

        <h3 className="mt-5 mb-2 text-[15px] font-semibold text-foreground">
          A click had to move to the end of the press.
        </h3>
        <p className="text-muted">
          Before, a point went down the instant the mouse did. With panning,
          the same press might be the start of a drag, and there&apos;s no
          way to tell until it moves. So a point is placed when the press
          ends, and only if it wandered less than 4 screen pixels. Anything
          further is a pan. Two fingers make a pinch, which never places
          anything, even when one of them lifts first.
        </p>

        <h3 className="mt-5 mb-2 text-[15px] font-semibold text-foreground">
          The keyboard gets all of it.
        </h3>
        <p className="text-muted">
          + and − zoom around the crosshair, 0 resets, and the arrows pan the
          view along when the crosshair walks off the edge, so a keyboard
          user never steers a cursor they can&apos;t see. The zoom level sits
          in a live region beside the buttons. The scroll wheel needed a
          listener attached by hand, because React adds wheel listeners as
          passive, and a passive listener can&apos;t stop the page scrolling
          underneath the image.
        </p>
        <p className="mt-3 text-muted">
          Zoom carries across slices, because scrolling down a neck at 4× is
          the point, and resets when the case changes. The canvas is drawn at
          twice the slice&apos;s size so the caliper lines stay sharp when
          the anatomy under them is enlarged eight times.
        </p>
      </Update>

      <Update
        id="update-2026-10-23-hostile-necks"
        date="October 23, 2026"
        title="Every neck was a clean tube, which is the one thing real necks never are"
      >
        <p>
          The organs around the aorta made the slices look right, but the
          neck, the part that decides the device, was still a parallel round
          tube with nothing in its wall. Every case now has at least one thing
          a real neck has: a taper or a flare, a lean that makes it oval on an
          axial slice, a crescent of thrombus, or calcified plaque.
        </p>

        <h3 className="mt-5 mb-2 text-[15px] font-semibold text-foreground">
          An angled neck is an oval, and only the short side is true.
        </h3>
        <p className="text-muted">
          Cut a tube that leans at θ with a horizontal plane and you get an
          ellipse whose short axis is the real diameter and whose long axis is
          that divided by cos θ. So the phantom draws each vessel in its own
          frame: squash the long direction back by the stretch, then decide
          wall, thrombus, lumen or plaque as if it were round. At 50° the
          hostile neck&apos;s 30 mm reads nearly 47 along its long axis. On
          three of the cases, measuring the long axis moves you up a main body
          size, and on the hostile neck and the giant sac it takes you off the
          sheet. The measuring
          note now says to take the short axis.
        </p>
        <pre className={pre}>
          {`const along = (dx * toward.x + dy * toward.y) / stretch;
const across = -dx * toward.y + dy * toward.x;
// ...then everything is decided on a round section`}
        </pre>

        <h3 className="mt-5 mb-2 text-[15px] font-semibold text-foreground">
          A flaring neck ends earlier than it looks.
        </h3>
        <p className="text-muted">
          The neck runs to where the aorta first passes 110% of its diameter
          at the renals. On a neck that widens on the way down, that happens
          before the sac visibly starts. The wide left iliac case now flares
          from 24 mm, and its neck length dropped from 22 mm to 8 without the
          sac moving at all. That&apos;s the lesson, so the debrief says it.
        </p>
        <p className="mt-3 text-muted">
          I&apos;d first put the flare on the wide sac case, which is on Easy.
          It made that neck 10 mm long, under every device&apos;s minimum, and
          a case that hostile doesn&apos;t belong on the level that promises
          straightforward anatomy. The flare moved to a Medium case, and the
          wide sac got a calcified arc instead.
        </p>

        <h3 className="mt-5 mb-2 text-[15px] font-semibold text-foreground">
          My calcium test was measuring in the wrong frame.
        </h3>
        <p className="text-muted">
          The test walks round the wall a degree at a time and counts how much
          of the plaque arc is bright. On the hostile neck it found half of
          what it expected:
        </p>
        <pre className={pre}>
          {`AssertionError: expected 30 to be greater than 36`}
        </pre>
        <p className="text-muted">
          The drawing was right. The arc is defined in the vessel&apos;s own
          frame, and on an oval that squashes it into fewer degrees on the
          image, so a 60° arc covers about 42° of screen. The test now checks
          plaque on a round neck, where the two frames agree, and the oval is
          covered by its own test.
        </p>

        <h3 className="mt-5 mb-2 text-[15px] font-semibold text-foreground">
          Thrombus moves the lumen, never the wall.
        </h3>
        <p className="text-muted">
          A crescent of thrombus shrinks the lumen and pushes it away from that
          side, and the outer wall stays exactly where the reference says it
          is. The contrast edge is the easy edge to measure to and the wrong
          one, and now three necks punish it. Calcified plaque does the same
          thing from the other direction: it&apos;s the brightest thing on the
          angio window, it sits in the wall, and the outer edge is past it.
        </p>

        <h3 className="mt-5 mb-2 text-[15px] font-semibold text-foreground">
          Old answers were for different anatomy, so they&apos;re gone.
        </h3>
        <p className="text-muted">
          Only one reference moved, but every image did. A best set on a round
          neck isn&apos;t one to beat on an oval one, so device history and
          personal bests moved to new storage keys and the old ones are
          deleted.
        </p>
      </Update>

      <Update
        id="update-2026-10-23-centerline"
        date="October 23, 2026"
        title="The slices said 10 mm. The vessel said 16."
      >
        <p>
          Device lengths were listed but never graded, because a length is
          measured along the vessel and an axial stack only knows how far
          apart two slices are. Once the necks could lean, that gap stopped
          being a footnote: the hostile neck is five slices long, 10 mm on the
          scanner&apos;s z axis, and 16 mm along the aorta.
        </p>

        <h3 className="mt-5 mb-2 text-[15px] font-semibold text-foreground">
          The phantom already had a centerline. It just never added it up.
        </h3>
        <p className="text-muted">
          <code className={code}>centreAt</code> and{" "}
          <code className={code}>iliacCentresAt</code> already say where the
          vessel is on every slice. The centerline is those points joined in
          3D: each step is the slice spacing, plus however far the centre
          moved sideways. Down a straight neck that&apos;s 2 mm a slice. Through
          a neck leaning 50° it&apos;s about 3, and down an iliac heading out
          toward the hip it&apos;s a little over 2.
        </p>
        <pre className={pre}>
          {`total += Math.hypot((q.x - p.x) * c.pixelMm, (q.y - p.y) * c.pixelMm, c.sliceMm);`}
        </pre>
        <p className="mt-3 text-muted">
          Neck length now runs along it, for the answer and for your marks
          alike: you still pick the renal and the sac start on the slices, and
          the distance between them is measured down the vessel. Two debriefs
          changed because of it. The short, wide neck is 14 mm on the slices
          and 15.5 along the vessel, which moves it from just under the usual
          minimum to just over.
        </p>

        <h3 className="mt-5 mb-2 text-[15px] font-semibold text-foreground">
          A limb has to stop somewhere, so the iliacs needed a place to stop.
        </h3>
        <p className="text-muted">
          The IFU&apos;s rule for overall length is lowest renal to just above
          the internal iliac. The phantom&apos;s common iliacs ran off the
          bottom of the stack without branching, so each one now gives off an
          internal iliac, back and out toward the pelvis. My first version sent
          it straight back, and the test that probes for contrast behind the
          common iliac found bone instead: the iliacs run over the vertebral
          body, so straight back is into it.
        </p>
        <pre className={pre}>
          {`AssertionError: right: expected 612 to be less than 150`}
        </pre>
        <p className="mt-3 text-muted">
          Three new slices to mark sit under the neck: the aortic bifurcation
          and each internal iliac origin. They aren&apos;t scored tasks, which
          would have meant new API columns. They give your own lengths, and
          those feed the device grading.
        </p>

        <h3 className="mt-5 mb-2 text-[15px] font-semibold text-foreground">
          The sizing sheet&apos;s footnotes are the length tables.
        </h3>
        <p className="text-muted">
          Endurant&apos;s sheet gives each limb&apos;s total contralateral
          covered length with a bifurcated body: the limb plus 50 mm, assuming
          the minimum 30 mm of overlap, and 10 mm less on the 124 mm body. More
          overlap is allowed, up to five stents, so a limb really reaches a
          range, not a number. The same footnote puts the end of the
          contralateral gate 80 mm down, and the IFU wants that above the
          bifurcation.
        </p>
        <pre className={pre}>
          {`gate               ends 80 mm down (70 on the 124 mm body), above the bifurcation
contralateral      limb + 30 to 50 mm
ipsilateral        body, or body + extension - 30 to 50 mm overlap
Endurant IIs ipsi  limb + 50 to 70 mm
a side lands       15 mm into its common iliac .. the internal iliac origin`}
        </pre>
        <h3 className="mt-5 mb-2 text-[15px] font-semibold text-foreground">
          I guessed the hostile gate wouldn&apos;t fit. The centerline said it does, easily.
        </h3>
        <p className="text-muted">
          On the hostile case the slices put the bifurcation 76 mm below the
          renal, and I wrote that only the 124 mm body&apos;s gate would clear it.
          Then I printed the centerline: 101 mm. The sac pushes the vessel
          forward off the spine and back again, and the centerline bows with
          it, so every case has 100 to 118 mm from renal to bifurcation and
          every gate fits. That&apos;s the same lesson as the neck, from the
          other end: the axial distance is the one that&apos;s easy to read
          and the one that&apos;s wrong.
        </p>

        <p className="mt-3 text-muted">
          The results get a Lengths table under Devices, with where each side
          has to end for the real anatomy and where your marks say it does.
          The study payload still records the three diameter grades, because
          the API caps that list at five and length verdicts can be worked out
          again from the device codes it already stores.
        </p>
      </Update>

      <Update
        id="update-2026-10-23-sheets"
        date="October 23, 2026"
        title="Three tables, one 22 mm iliac, three different answers"
      >
        <p>
          With only Endurant on the page, &quot;which limb does this iliac
          take?&quot; had one answer, and that made the table look like
          anatomy. It isn&apos;t. Each manufacturer oversizes differently, so
          you can now pick Gore Excluder Conformable or Cook Zenith Alpha
          instead, and the same measurements get graded against that
          device&apos;s own table.
        </p>
        <pre className={pre}>
          {`22 mm common iliac
  Endurant II/IIs     24 mm limb
  Excluder Conformable 27 mm leg
  Zenith Alpha        no standard leg (the table stops at 20)`}
        </pre>

        <h3 className="mt-5 mb-2 text-[15px] font-semibold text-foreground">
          Every sheet answers the same five questions.
        </h3>
        <p className="text-muted">
          What goes on the neck, what goes in an iliac, what&apos;s in the
          catalogue, how far each side reaches, and how much seal it needs. That
          became a <code className={code}>Sheet</code> type, and the grading
          from the last two updates moved out of the Endurant file to read
          whichever sheet a pick came from. Gore&apos;s comes from the IFU the
          FDA hosts for the Conformable, and Cook&apos;s from its own Zenith
          Alpha IFU.
        </p>

        <h3 className="mt-5 mb-2 text-[15px] font-semibold text-foreground">
          Gore&apos;s bands share their edges, so one iliac can take two legs.
        </h3>
        <p className="text-muted">
          Endurant and Cook write their bands in whole millimetres with no
          overlap. Gore writes the iliac bands to the half millimetre, and
          12 to 13.5 is followed by 13.5 to 14.5, so a 13.5 mm iliac is
          allowed a 14.5 or a 16. The grading had assumed one right answer per
          row, so the expected size became a list, and the results read
          &quot;14.5 or 16 mm&quot;. The study API stores one number there,
          so it gets the first, next to a verdict that already says whether
          the pick was one of them.
        </p>

        <h3 className="mt-5 mb-2 text-[15px] font-semibold text-foreground">
          Gore couldn&apos;t land on half the cases, and the anatomy was the problem.
        </h3>
        <p className="text-muted">
          I wrote a test that every case has some stack that lands on both
          sides with every sheet. Endurant and Cook passed. Gore failed on the
          first case it tried:
        </p>
        <pre className={pre}>
          {`AssertionError: excluder long-neck left: expected false to be true`}
        </pre>
        <p className="text-muted">
          Gore counts 5.5 cm of trunk plus the leg&apos;s label, and its
          shortest leg is 9.5 cm, so its contralateral side always reaches at
          least 150 mm. The phantom&apos;s internal iliacs came off 140 to
          153 mm from the renals, because a 100-slice stack left room for
          only about 40 mm of common iliac. Real ones run nearer 50 to 60. So
          the stack grew to 120 slices and the internal iliacs moved down to
          about 60 mm along each iliac. The device was fine. The phantom had
          been built short to fit the scroll bar.
        </p>

        <h3 className="mt-5 mb-2 text-[15px] font-semibold text-foreground">
          Some codes are real and some I had to build.
        </h3>
        <p className="text-muted">
          Endurant&apos;s codes are Medtronic&apos;s, and the Excluder trunk
          codes are in the FDA summary. Neither document lists Gore&apos;s leg
          numbers or Cook&apos;s part numbers, so those are built from the
          table&apos;s sizes, and the picker says which is which. A practice
          tool that invents official-looking part numbers is teaching
          something false.
        </p>
      </Update>

      <Update
        id="update-2026-10-23-real-cta"
        date="October 23, 2026"
        title="Fifty-six scans, one aneurysm"
      >
        <p>
          The first section of this page says I wanted real scans and shipped
          a phantom because a segmentation doesn&apos;t come with an answer key.
          That&apos;s still true, but the admin page fixed the answer key: a
          case can have its five answers set by hand. So Medium now ends with
          a real, deidentified CTA of an infrarenal aneurysm.
        </p>

        <h3 className="mt-5 mb-2 text-[15px] font-semibold text-foreground">
          The open aortic datasets are mostly healthy aortas, or cropped to the sac.
        </h3>
        <p className="text-muted">
          I measured every segmentation in the AVT collection rather than trust
          the description. Fifty-six scans, and the infrarenal aorta is 16 to
          26 mm wide in all but one. The two openly licensed 4D-CTA aneurysm
          sets on Zenodo are real aneurysms, but cropped to about 70 mm round
          the sac, with no renals and no iliacs, which is everything a sizing
          exercise needs. The one AVT case that is an aneurysm turned out to
          live in a folder that said so all along.
        </p>
        <pre className={pre}>
          {`'Rider/R6 (AAA)/R6.nrrd' 296.2 MB
'Rider/R6 (AAA)/R6.seg.nrrd' 0.4 MB`}
        </pre>

        <h3 className="mt-5 mb-2 text-[15px] font-semibold text-foreground">
          296 MB became 7 by keeping only what the windows can show.
        </h3>
        <p className="text-muted">
          A script crops it to 256 pixels square round the aorta and iliacs at
          its own 0.72 mm spacing, averages it into 2 mm slices, and keeps from
          about 4 cm above the renals to the internal iliacs. The first try
          gzipped to 9 MB and barely shrank, because CT noise doesn&apos;t
          compress. What did work was noticing that the two windows only ever
          show −160 to 450 HU, each spread over 256 greys, so one byte a voxel
          at 2.4 HU a step loses nothing anyone can see.
        </p>
        <pre className={pre}>
          {`{ "size": 256, "slices": 127, "pixelMm": 0.7246, "sliceMm": 2,
  "huMin": -160, "huStep": 2.4, "bytes": 7051231 }`}
        </pre>
        <p className="mt-3 text-muted">
          The values in this file are stored with a +1024 offset, so my first
          picture of it was solid white until I subtracted it. It&apos;s fetched
          when the case is opened, never with the page, and gunzipped in the
          browser.
        </p>

        <h3 className="mt-5 mb-2 text-[15px] font-semibold text-foreground">
          It isn&apos;t scored until I measure it.
        </h3>
        <p className="text-muted">
          There&apos;s no geometry behind a real scan, so the honest default is
          no answer. Until its five numbers are saved on the admin page, the
          case says it isn&apos;t scored, the end shows your measurements
          without a verdict, and nothing goes to the study, the results page or
          a personal best. Once they&apos;re saved it scores like any other
          case. Lengths on it run straight down the slices, because it has no
          centerline yet, and the page says that too.
        </p>
        <p className="mt-3 text-muted">
          The scan is CC BY 4.0, from AVT on figshare, which builds on
          TCIA&apos;s RIDER collection. The attribution sits under the case
          whenever it&apos;s open, and the folder it&apos;s served from has a
          note of what I changed.
        </p>
      </Update>

      <Update
        id="update-2026-10-23-tour"
        date="October 23, 2026"
        title="The page had grown past explaining itself"
      >
        <p>
          Three levels, ten cases, five measurements, five slices to mark,
          three manufacturers, zoom, and a dock of controls. Someone landing on
          it for the first time had no way in except to start clicking. It now
          has the guided tour ZeroProof got first.
        </p>

        <h3 className="mt-5 mb-2 text-[15px] font-semibold text-foreground">
          It&apos;s ZeroProof&apos;s tour, pointed at different ids.
        </h3>
        <p className="text-muted">
          The engine is shared: <code className={code}>FeatureTour</code>{" "}
          renders the button and the overlay, and its hook remembers per page
          whether you&apos;ve seen it. All this page adds is eight steps and an
          id on each part they describe. The first step asks before anything
          gets spotlighted, and it opens by itself only once.
        </p>
        <pre className={pre}>
          {`evar-intro  evar-levels  evar-cases  evar-scan
evar-measurements  evar-devices  evar-dock`}
        </pre>

        <h3 className="mt-5 mb-2 text-[15px] font-semibold text-foreground">
          A tour that opens itself opens in every test too.
        </h3>
        <p className="text-muted">
          Every page test starts with empty storage, which to the tour looks
          like a first visit, so each one would have run under an overlay. The
          shared render helper marks the tour seen, and the tour has its own
          four tests, the same ones ZeroProof&apos;s has: it asks on a first
          visit, stays shut once seen, reopens from the button, and walks to
          the end.
        </p>
      </Update>

      <Update
        id="update-2026-10-23-simpler"
        date="October 23, 2026"
        title="Thirteen rows and a disclaimer, all at once"
      >
        <p>
          Every update above added something worth having, and every one of
          them added it to the screen. By the end, the left panel had thirteen
          rows, the right had a full device picker and a five-line
          disclaimer, and the scan had a paragraph of controls under it, all
          visible from the first second. Meanwhile the one thing that should
          come first, whether you want to be in the study, was at the very
          bottom of the page.
        </p>

        <h3 className="mt-5 mb-2 text-[15px] font-semibold text-foreground">
          The study question comes before anything else now.
        </h3>
        <p className="text-muted">
          A first-time visitor who hasn&apos;t joined gets a dialog about the
          study before the tour or the scan. Signed in, it&apos;s the consent
          form itself. Signed out, it&apos;s sign in or practise without
          joining. The answer is remembered, and the tour waits for it: the
          shared tour hook grew an <code className={code}>autoOpen</code>{" "}
          flag so a page can hold its first-visit open back until something
          else is done. The panel at the bottom stays, for your record and the
          way to withdraw.
        </p>
        <p className="mt-3 text-muted">
          Putting the consent form in a dialog put it on the page twice, and
          the test for consenting in the dialog couldn&apos;t find the
          training level:
        </p>
        <pre className={pre}>
          {`TestingLibraryElementError: Unable to find an accessible element
  with the role "combobox" and name \`/training level/i\``}
        </pre>
        <p className="text-muted">
          Both copies used the same hard-coded ids, so the dialog&apos;s label
          pointed at the panel&apos;s select. The form takes generated ids now.
        </p>

        <h3 className="mt-5 mb-2 text-[15px] font-semibold text-foreground">
          Measuring and sizing are two jobs, so they&apos;re two tabs.
        </h3>
        <p className="text-muted">
          The left panel is Measure and Size the graft, with Measure counting
          how many of the five you&apos;ve recorded. The device column went
          with it, so the scan has the width it was sharing. The tour opens
          each tab as it reaches it, the way ZeroProof&apos;s switches tabs.
        </p>

        <h3 className="mt-5 mb-2 text-[15px] font-semibold text-foreground">
          Useful once, in the way every time after: those fold.
        </h3>
        <p className="text-muted">
          Diameters and the neck length stay open, because they&apos;re the
          task. The landmarks only graft lengths need, the measuring rules,
          the viewer controls, the sizing tables&apos; source and the real
          scan&apos;s full citation each fold behind a labelled disclosure. On
          the real scan, the one-line credit and its licence stay visible.
          Nothing was removed, and the viewer&apos;s controls are still its
          description for screen readers while they&apos;re folded.
        </p>
      </Update>

      <WhatsNext
        nowShipped={[
          "Easy, Medium and Hard levels: Easy has hints and wider tolerances, Hard has the worst anatomy and a five-minute clock that hands your answers in at zero.",
          "Nine phantom cases, three on Easy and four each on Medium and Hard, from a long straight neck to an 8 cm sac with both iliacs on the widest limb.",
          "Slices with the abdomen drawn around the aorta: IVC, liver, spleen, arterial-phase kidneys, psoas, a full vertebra, bowel gas and the scanner table, with grainy, slightly soft noise.",
          "Axial slices drawn on demand in Hounsfield units, with angio and soft-tissue windows and patient-right-on-image-left orientation.",
          "A two-point caliper that works with a mouse or entirely from the keyboard, with the length in a live region.",
          "Necks with something real to get wrong: conical and flaring necks, angled necks that cut as ovals, thrombus crescents and calcified plaque, across all nine cases.",
          "A real, deidentified CTA of an infrarenal aneurysm on Medium, under CC BY 4.0 with attribution, unscored until its answers are set by hand.",
          "One job at a time: the study is asked about first, measuring and sizing are separate tabs, and anything needed once folds away until asked for.",
          "A guided tour for first-time visitors, on the same engine as ZeroProof's, that walks the page from levels to checking answers.",
          "Zoom from 1× to 8× and pan, with the scroll wheel, a pinch, a drag or the keyboard, without changing what a caliper measures.",
          "Five scored measurements against exact references, with written tolerances, a score and time taken, and a debrief on what the anatomy means for the repair.",
          "Device selection from three sizing sheets, Endurant II/IIs, Gore Excluder Conformable and Cook Zenith Alpha, with each diameter graded against that sheet's table for the real anatomy and for your own numbers.",
          "Lengths along a centerline: neck length measured down the vessel, marks for the bifurcation and internal iliacs, and each side's device reach graded against where it has to land.",
          "An opt-in study for signed-in users: versioned draft consent, each attempt recorded once with its measurements, scores, devices and time, a personal history, and withdrawal that deletes everything.",
          "An admin page that sets a case's five reference answers by hand, with the phantom as the fallback.",
          "A study download on that admin page: a CSV with one line per attempt and the training profile alongside, or the raw JSON.",
          "A full-height stage with floating controls that follows the site theme, and a results popup with stars, points and a personal best per level and case.",
          "A results page with every case finished on the device: averages and bests by level, measurements within tolerance over time, and every attempt.",
          "An admin results page that filters everyone's attempts by level, case, training level, timed out and date, with within-tolerance rates per measurement and a CSV of just those rows.",
        ]}
        couldImprove={[
          "Three sheets, but each is one device family. There are no aorto-uni-iliac or iliac branch devices, so a case that needs one can only be called off the sheet.",
          "Everything you see is axial. Lengths are measured along the phantom's centerline, but there's no curved planar reformat to look down it, which is the step real planning software takes.",
          "The organs are still ellipses, and each angled neck leans in one straight line rather than curving, so there's no tortuous aorta yet.",
          "Each case's debrief is written prose about the phantom's anatomy, so a hand-set answer can disagree with it until I edit the text.",
          "The study has no ethics approval yet, so the consent text is a draft and nothing recorded can go in a paper until it does.",
          "Personal bests and the results history live on one device. Signed-in study participants already have a record on the API, so theirs could follow them.",
        ]}
        upcoming={[
          "Healthy real aortas from the same collection as normal-anatomy cases, one at a time, since each is about 7 MB.",
          "My own reference measurements for the real case, so it scores.",
        ]}
      />
    </ThoughtLayout>
  );
}
