"use client";

import Link from "next/link";
import ThemeToggle from "@/components/ThemeToggle";
import styles from "@/app/thoughts/styling/styling.module.css";
import { Timestamp, Sent, Received } from "@/lib/threads";

export default function CalendarAboutContent() {
  return (
    <div className={styles.phone}>
      {/* ---- Top bar ---- */}
      <div className={styles.topBar}>
        <Link href="/protected" className={styles.backLink}>
          <svg width="10" height="16" viewBox="0 0 10 16" fill="none">
            <path
              d="M9 1L2 8l7 7"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          &nbsp;Back
        </Link>
        <div className={styles.contactInfo}>
          <span className={styles.contactName}>Calendar</span>
          <span className={styles.contactSub}>iMessage</span>
        </div>
        <div className={styles.themeBtn}>
          <ThemeToggle />
        </div>
      </div>

      {/* ---- Chat ---- */}
      <div className={styles.chat}>
        <Timestamp>Today 10:00 AM</Timestamp>

        <Received pos="first">so what did you actually build here</Received>
        <Received pos="last">just a calendar?</Received>

        <Sent pos="first">
          a full-stack personal calendar — four views (day, week, month, year),
          navigable with prev/next and a today jump
        </Sent>
        <Sent pos="middle">
          click any cell or time slot to create an event. click an existing
          event chip to edit or delete it. events persist in Postgres, scoped
          per user via Auth0
        </Sent>
        <Sent pos="last">
          you can also attach Pokémon cards to events — there&apos;s a
          searchable events list at <code>/calendar/events</code> and a detail
          page per event showing everything attached to it
        </Sent>

        <Received>wait, why did you actually build this</Received>

        <Sent pos="first">
          my partner and I play Pokémon Pocket together a lot. we have this
          thing where if I pull something special I want to show her — but then
          I forget what I got or when
        </Sent>
        <Sent pos="middle">
          so the calendar started as a way to log those moments. mark the day
          we played, note what happened, attach the cards I pulled, and have
          something to look back at
        </Sent>
        <Sent pos="last">
          the rest of the features — all four views, the event list, the card
          search — grew out of wanting it to actually be usable rather than
          just a proof-of-concept
        </Sent>

        <Timestamp>10:04 AM</Timestamp>

        <Received>why date-fns instead of moment</Received>

        <Sent pos="first">
          moment is effectively unmaintained and ships the entire locale bundle
          regardless of what you import
        </Sent>
        <Sent pos="last">
          date-fns is tree-shakeable — you only pay for what you use. the API is
          functional (pure functions, no mutation) which makes it easier to
          reason about, especially for grid construction where you&apos;re
          deriving a lot of values from a single source date
        </Sent>

        <Received>
          why build your own calendar instead of using FullCalendar
        </Received>

        <Sent pos="first">
          FullCalendar&apos;s React wrapper requires a paid license for full
          features — drag-and-drop, resource views, recurring events
        </Sent>
        <Sent pos="middle">
          the free tier is limited enough that you end up working around it
          anyway. building custom keeps the bundle lean and gives full control
          over the interaction model — click handlers, event chips, modal
          behavior
        </Sent>
        <Sent pos="last">
          it&apos;s also just a better portfolio piece. &quot;I used
          FullCalendar&quot; isn&apos;t very interesting. &quot;I built the grid
          from scratch with date-fns&quot; is
        </Sent>

        <Timestamp>10:11 AM</Timestamp>

        <Received>walk me through the frontend architecture</Received>

        <Sent pos="first">
          view state lives in a single <code>CalendarView</code> string —{" "}
          <code>day | week | month | year</code>. a switch on that value
          determines which grid component renders. no router params needed for
          view changes — it&apos;s purely local state
        </Sent>
        <Sent pos="last">
          the date window (what events to fetch) is computed from{" "}
          <code>currentDate + view</code>. month view expands to cover the full
          grid including overflow days from adjacent months so events don&apos;t
          disappear at the edges
        </Sent>

        <div className={styles.codeBubble}>
          {`// month grid includes days from adjacent months
const start = startOfWeek(startOfMonth(currentDate));
const end = endOfWeek(endOfMonth(currentDate));
// → always a complete 5-or-6 week grid`}
        </div>

        <Received>how does data fetching work across views</Received>

        <Sent pos="first">
          a <code>useCalendarEvents</code> hook owns the fetch lifecycle. it
          watches <code>currentDate</code> and <code>view</code>, computes the
          window, and re-fetches whenever either changes
        </Sent>
        <Sent pos="middle">
          loading state is derived — not a separate boolean. there&apos;s a
          resolved-ranges set; loading is true if the current window isn&apos;t
          in it yet. avoids setState firing synchronously in the effect body,
          which the ESLint rule flags
        </Sent>
        <Sent pos="last">
          after create/edit/delete the hook re-fetches the current window. no
          optimistic UI — a simple refetch is more reliable for a portfolio app
          and the latency is fine
        </Sent>

        <Timestamp>10:19 AM</Timestamp>

        <Received>tell me about the BFF pattern you used</Received>

        <Sent pos="first">
          the browser never touches Auth0 access tokens. it calls Next.js API
          routes (<code>/api/calendar/events</code>), those routes call{" "}
          <code>auth0.getAccessToken()</code> server-side and attach the JWT
          before forwarding to the Express backend
        </Sent>
        <Sent pos="middle">
          so the token lives entirely in server memory — it&apos;s never in the
          browser&apos;s network tab, never in localStorage, can&apos;t be
          extracted by a script
        </Sent>
        <Sent pos="last">
          Auth0 had to be configured as a custom API and set to RS256 JWTs
          specifically — by default it issues opaque tokens that{" "}
          <code>express-oauth2-jwt-bearer</code> can&apos;t verify. that took a
          while to figure out
        </Sent>

        <div className={styles.codeBubble}>
          {`// Next.js API route — token never leaves the server
export async function GET(request: Request) {
  const { token } = await auth0.getAccessToken();
  const res = await fetch(\`\${API_URL}/calendar/events\`, {
    headers: { Authorization: \`Bearer \${token}\` },
  });
  return Response.json(await res.json());
}`}
        </div>

        <Timestamp>10:26 AM</Timestamp>

        <Received>what about the backend — how is it structured</Received>

        <Sent pos="first">
          Express with a Postgres connection (Railway). events table, plus a
          separate <code>event_cards</code> junction table for TCG card
          attachments
        </Sent>
        <Sent pos="middle">
          junction table instead of a JSON column so you can query events by
          card — &quot;show me all events where I had Charizard&quot; is a
          simple join. JSON column would require scanning every row
        </Sent>
        <Sent pos="last">
          <code>user_id</code> is the Auth0 sub claim stored as text — avoids
          needing a users table entirely. every query scopes by{" "}
          <code>user_id</code> so events are private per user by default
        </Sent>

        <Received>any timezone issues</Received>

        <Sent pos="first">
          yes — <code>datetime-local</code> inputs produce naive strings with no
          offset, like <code>2026-02-24T14:00</code>
        </Sent>
        <Sent pos="middle">
          if you send that directly, Postgres treats it as UTC. if your local
          timezone is UTC-8, an event you set for 2pm shows up at 6am the next
          day in the grid
        </Sent>
        <Sent pos="last">
          fix: wrap with <code>formatISO(parseISO(s))</code> before the value
          leaves the browser. that adds the local offset — Postgres then stores
          the correct UTC moment
        </Sent>

        <div className={styles.codeBubble}>
          {`// naive string from the input
"2026-02-24T14:00"

// after formatISO(parseISO(s))
"2026-02-24T14:00:00-08:00"

// what Postgres actually stores (UTC)
"2026-02-24T22:00:00Z" ✓`}
        </div>

        <Timestamp>10:34 AM</Timestamp>

        <Received>were there any tricky rendering problems</Received>

        <Sent pos="first">
          multi-day events were wrong for a while — an event spanning
          Monday through Thursday would only show a chip on Monday
        </Sent>
        <Sent pos="middle">
          the backend was already doing the right thing with overlap queries.
          the bug was on the frontend: I was using{" "}
          <code>isSameDay(startDate, day)</code> to filter, which only matched
          the start day. switched to{" "}
          <code>differenceInCalendarDays</code> offset checks — if the event
          started on or before this day and ends on or after it, show a chip
        </Sent>
        <Sent pos="last">
          multi-day timed events also now go in the all-day row instead of
          having a partial bar floating in the time grid. a Tuesday 10am event
          that ends Wednesday 2pm shouldn&apos;t try to fit inside a single hour
          slot — Google Calendar routes those to all-day too
        </Sent>

        <Received>what about events at the same time</Received>

        <Sent pos="first">
          the time grid used to stack them on top of each other, titles
          completely illegible
        </Sent>
        <Sent pos="middle">
          fixed with a greedy interval scheduling algorithm. sort events by
          start time, assign each to the first column whose last occupant has
          already ended. then for each event, walk all overlapping events to
          find the widest concurrent group — that&apos;s how many columns to
          divide the width by
        </Sent>
        <Sent pos="last">
          the positioning is percentage-based left/right so five events at 9am
          each get exactly 20% of the column width. same approach Google
          Calendar uses — it scales gracefully, just gets narrower as more
          events pile in
        </Sent>

        <div className={styles.codeBubble}>
          {`// greedy column assignment, O(n²) — fine at calendar scale
const col = colEnds.findIndex(end => end <= startMs);

// walk overlapping events to find total concurrent columns
let maxCol = eventCols[i];
for (let j = 0; j < sorted.length; j++) {
  if (jStart < endMs && jEnd > startMs)
    maxCol = Math.max(maxCol, eventCols[j]);
}
// → totalColumns = maxCol + 1`}
        </div>

        <Timestamp>10:43 AM</Timestamp>

        <Received>how does the card attachment work</Received>

        <Sent pos="first">
          the event modal has a debounced card search that reuses the existing
          TCGdex browse endpoint. pick a card and it appears in an attached list
        </Sent>
        <Sent pos="middle">
          changes are staged locally — additions, quantity edits, removals —
          while the modal is open. nothing hits the backend until you hit save
        </Sent>
        <Sent pos="last">
          on save: event persists first, then cards flush in batch — removes
          first, then adds/updates in parallel. the order matters to avoid FK
          violations on the junction table
        </Sent>

        <Received>did you do a ui pass on the modal at some point</Received>

        <Sent pos="first">
          yeah the first version was one long column — title, description,
          dates, colors, then all the card stuff stacked below. it worked but
          felt like a form from 2012
        </Sent>
        <Sent pos="middle">
          split it into two columns on desktop: event details on the left,
          card search and attached cards on the right. stacks back to single
          column on mobile. section headers with trailing rules keep it from
          feeling like one undifferentiated blob
        </Sent>
        <Sent pos="last">
          other small things: color swatches show a white checkmark instead of
          a ring, quantity stepper replaced the raw number input, explicit Add
          button per search result instead of click-anywhere, and there&apos;s
          an inline warning if end is before start
        </Sent>

        <Received>what about the event chips on the grid</Received>

        <Sent pos="first">
          chips in the time grid are translucent at rest — you can see any
          events behind them through the color wash. solid on hover so you can
          clearly identify the one you&apos;re pointing at without everything
          becoming opaque
        </Sent>
        <Sent pos="last">
          title tooltips use a custom Tooltip primitive instead of the native
          browser <code>title</code> attribute. position:fixed so it escapes the
          overflow:hidden calendar container without a portal, 500ms delay so it
          doesn&apos;t fire on every pass-through
        </Sent>

        <Timestamp>10:52 AM</Timestamp>

        <Received>what would you still improve</Received>

        <Sent pos="first">
          drag-and-drop event resizing is the obvious one. it needs a more
          complex state model — tracking a drag target separately from committed
          event data — and I didn&apos;t want to half-bake it
        </Sent>
        <Sent pos="middle">
          recurring events would require schema work (probably rrule strings
          stored on the event) and a bunch of expansion logic in the query
          layer. doable but scope-heavy
        </Sent>
        <Sent pos="last">
          mobile layout for the week/day grids needs work too. the time column
          plus event chips get tight below 400px. and card metadata sync should
          probably be a background job instead of blocking the save — right now
          the modal has to wait for TCGdex before it can persist
        </Sent>

        <Timestamp>10:58 AM</Timestamp>

        <Received>what does building this show as a frontend dev</Received>

        <Sent pos="first">
          knowing when to reach for a library and when not to. FullCalendar
          would have been faster to get started but slower to customize and
          expensive to unlock. date-fns plus custom grid logic is more work
          upfront but the result is exactly what I wanted
        </Sent>
        <Sent pos="middle">
          date math is always harder than it looks. grid construction, timezone
          offsets, overlap detection — each one has edge cases that bite you.
          date-fns saved a lot of that pain
        </Sent>
        <Sent pos="last">
          and composition: keeping <code>CalendarGrid</code>,{" "}
          <code>DayView</code>, <code>WeekView</code> as focused components
          instead of one big calendar god-component means each one is easy to
          reason about and update independently
        </Sent>

        <Received>nice. anything else worth mentioning</Received>

        <Sent pos="first">
          the events list page (<code>/calendar/events</code>) has two filter
          modes running in parallel — title search is client-side against
          whatever came back from the last fetch, card name and date range
          trigger a backend re-fetch
        </Sent>
        <Sent pos="last">
          the loading state there is derived from a filter key —{" "}
          <code>loadedKey !== filterKey</code>. no booleans to keep in sync, no
          setState in the effect body, consistent with the hooks eslint rule
        </Sent>

        <Received>thanks for walking me through it</Received>

        <Sent>yeah, happy to</Sent>

        {/* Typing indicator */}
        <div className={styles.typingDots}>
          <span />
          <span />
          <span />
        </div>
      </div>
    </div>
  );
}
