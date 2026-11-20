import Link from "next/link";
import ThoughtLayout from "@/app/thoughts/ThoughtLayout";
import {
  UpdateTimeline,
  Update,
  WhatsNext,
} from "@/app/thoughts/_shared/ThoughtUpdates";
import { CalendarChat } from "./sections/CalendarChat";
import { CalendarSummary } from "./sections/CalendarSummary";

const pre =
  "mt-3 overflow-x-auto rounded-lg bg-surface p-3 text-[13px] font-mono text-foreground";

const beat = "mt-5 mb-2 text-[15px] font-semibold text-foreground";

export default function CalendarAboutContent() {
  return (
    <ThoughtLayout
      breadcrumb="Calendar"
      title="Calendar"
      intro={
        <>
          A full-stack personal calendar with four views, Google Calendar sync,
          event sharing, and Pokémon card attachments — built on Postgres and
          date-fns.
        </>
      }
      chat={<CalendarChat />}
    >
      <UpdateTimeline
        entries={[
          {
            id: "update-2026-11-18-silent-failures",
            date: "Nov 18, 2026",
            title: "Three failures that all looked fine",
          },
          {
            id: "update-2026-08-10-scroll",
            date: "Aug 10, 2026",
            title:
              "The scroll fix, and an accessibility pass that changed the markup",
          },
        ]}
      />

      <CalendarSummary />
      <Update
        id="update-2026-08-10-scroll"
        date="August 10, 2026"
        title="The scroll fix, and an accessibility pass that changed the markup"
      >
        <p>
          <strong>The months jumped while you scrolled.</strong> The infinite
          scroller compensated for exactly one thing &mdash; prepending a period
          at the top, capturing <code>scrollHeight</code> before the insert and
          correcting after. Right idea, too narrow. The period renderer also
          depends on the events and countdowns, so cells change height whenever
          data arrives, and content growing above the viewport shoves what you
          are reading down the screen with nothing to correct it.
        </p>
        <p>
          Rather than add a second special case I replaced it with one
          mechanism: anchor on the period the reader is looking at, and put it
          back after any render. That covers prepends, data arrival, and
          whatever gets added next. I had ruled out the more obvious suspect
          first &mdash; the period callbacks are properly memoised, so the
          observers were not tearing down on every scroll.
        </p>
        <p>
          What I would take from it: compensating for a <em>known mutation</em>{" "}
          is a trap, because the next mutation will not be known. Anchoring on
          what the reader is looking at makes the mechanism independent of what
          changed. The same mistake, in a different shape, is what made the
          Explore Toronto rail move around before it was laid out as a grid.
        </p>
        <p>
          <strong>The accessibility pass was not cosmetic.</strong> Enforcing
          axe best-practice rules rather than just violations flagged real
          structural problems here &mdash; a calendar is a grid of interactive
          cells, which is exactly where landmark and heading structure quietly
          goes wrong. Fixing those meant changing markup, not adding attributes,
          which is the right outcome and the more invasive one.
        </p>
      </Update>
      <Update
        id="update-2026-11-18-silent-failures"
        date="November 18, 2026"
        title="Three failures that all looked fine"
      >
        <p>
          A{" "}
          <Link
            href="/thoughts/codebase-audit"
            className="text-primary-600 hover:underline dark:text-primary-400"
          >
            codebase audit
          </Link>{" "}
          found three calendar bugs, more than in any other feature. Each one was
          a failure that reported success, so none of them had ever shown up as
          an error.
        </p>

        <h3 className={beat}>
          Card saves could fail, and the modal closed anyway
        </h3>
        <p className="text-muted">
          Saving an event writes its attached cards one request at a time, and
          every one of those requests ended the same way:
        </p>
        <pre className={pre}>
          {`removeCardFromEvent(eventId, id).catch(() => null)
addCardToEvent(eventId, { ... }).catch(() => null)
updateEventCard(eventId, c.id, { ... }).catch(() => null)

onClose();`}
        </pre>
        <p className="text-muted">
          A failed card write turned into <code>null</code>, and the modal
          closed as if everything had saved. I expected the fix to be removing
          the catches. Writing the test showed something worse. For a new
          event, the modal made up an id and wrote the cards to it, while the
          page threw that id away and let the server assign the real one. So on
          a new event every card had always failed, and the catch had always
          hidden it.
        </p>
        <p className="text-muted">
          Now <code>onSave</code> creates or updates and returns the saved
          event, and cards go to that event&rsquo;s real id. If any card change
          fails, the modal stays open, says how many didn&rsquo;t save, and
          keeps only those for the retry. The retry updates the same event
          instead of creating a second one. Only cards whose quantity or notes
          changed are sent, where before every save PUT every card.
        </p>

        <h3 className={beat}>
          The e2e test was writing to my real calendar
        </h3>
        <p className="text-muted">
          The authenticated calendar test meant to put its event in a throwaway
          calendar:
        </p>
        <pre className={pre}>
          {`const calendarBtn = page.locator(
  \`button[data-calendar-id="\${calendarId}"]\`,
);
if (await calendarBtn.isVisible({ timeout: 2_000 }).catch(() => false)) {
  await calendarBtn.click();
}`}
        </pre>
        <p className="text-muted">
          Nothing renders <code>data-calendar-id</code>, so the guard was always
          false, the click never happened, and every run used the default
          calendar. The file&rsquo;s header also promised an{" "}
          <code>afterEach</code> cleanup that didn&rsquo;t exist. A guard that
          skips instead of failing is a test asserting nothing. The test now
          picks the calendar from the modal&rsquo;s picker, checks the created
          event landed there, and deletes everything it made afterwards. The
          picker needed a real <code>&lt;label&gt;</code> for that, which it
          should have had for screen readers anyway.
        </p>

        <h3 className={beat}>
          A failed status check said I wasn&rsquo;t connected
        </h3>
        <pre className={pre}>
          {`const res = await fetch("/api/google/auth/status");
if (!res.ok) return { connected: false };`}
        </pre>
        <p className="text-muted">
          A 500 from that route turned into &ldquo;not connected&rdquo;, so
          two-way sync greyed out with &ldquo;Connect Google Calendar in
          Settings first&rdquo; for someone who already had. Settings would
          show them as connected, and nothing would explain the difference. Now
          only a 401 means not connected. Anything else, including a body that
          doesn&rsquo;t parse, says the check couldn&rsquo;t be done, and the
          option says that instead of pointing at Settings.
        </p>
      </Update>
      <WhatsNext
        nowShipped={[
          "Four views over one period-window abstraction, so infinite scrolling, fetching and navigation are written once rather than per view.",
          "Scroll position anchored on the period in view, so event data arriving no longer shoves the page — one mechanism instead of a special case per mutation.",
          "The BFF pattern for auth: the browser talks to this app, this app holds the token, and no access token reaches the client.",
          "Accessibility fixed in the markup rather than papered over with attributes, which a grid of interactive cells forces you to do properly.",
          "Card saves that fail keep the modal open with only the failed changes, instead of closing as if they'd saved, and a new event's cards go to its real id.",
          "An e2e test that writes only to its own calendar and cleans up after itself.",
          "A failed Google status check reads as 'couldn't check', not as 'not connected'.",
        ]}
        couldImprove={[
          "There is no optimistic update on create or edit, so every change waits for the round trip on a UI where dragging and dropping should feel immediate.",
          "Recurring events are not modelled at all, which is the largest missing idea in a calendar and the one that most changes the data model.",
          "The overlap layout engine is tested but not benchmarked; a day with a very large number of events has never been measured.",
        ]}
        upcoming={[
          "Confirm the scroll fix by feel rather than by test — it is unit tested and green, but the route needs a login so I could not check the actual scrolling in a browser.",
          "Optimistic create and edit, which the pure layout core already makes safe to do.",
        ]}
      />
    </ThoughtLayout>
  );
}
