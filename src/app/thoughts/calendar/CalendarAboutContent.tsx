import ThoughtLayout from "@/app/thoughts/ThoughtLayout";
import {
  UpdateTimeline,
  Update,
  WhatsNext,
} from "@/app/thoughts/_shared/ThoughtUpdates";
import { CalendarChat } from "./sections/CalendarChat";
import { CalendarSummary } from "./sections/CalendarSummary";

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
      <WhatsNext
        nowShipped={[
          "Four views over one period-window abstraction, so infinite scrolling, fetching and navigation are written once rather than per view.",
          "Scroll position anchored on the period in view, so event data arriving no longer shoves the page — one mechanism instead of a special case per mutation.",
          "The BFF pattern for auth: the browser talks to this app, this app holds the token, and no access token reaches the client.",
          "Accessibility fixed in the markup rather than papered over with attributes, which a grid of interactive cells forces you to do properly.",
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
