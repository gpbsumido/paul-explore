import styles from "@/app/thoughts/_shared/chat.module.css";
import { Timestamp, Sent, Received } from "@/lib/threads";

/** Calendar write-up chat, part of the thread. */
export function CalendarChatPart2() {
  return (
    <>
      <Timestamp>10:51 AM</Timestamp>

      <Received>
        what about the event detail page at /calendar/events/:id
      </Received>

      <Sent pos="first">
        that one was fully client-side for a long time — it used{" "}
        <code>useState</code> + <code>useEffect</code> to fetch the event and
        its cards after hydration. blank page, then skeleton, then content. two
        round trips before anything showed up
      </Sent>
      <Sent pos="middle">
        converted it to the same SSR pattern. there&apos;s now an{" "}
        <code>EventDetailWithData</code> async server component that fetches
        both the event and its cards in parallel from the backend at request
        time. wrapped in a <code>Suspense</code> boundary with{" "}
        <code>EventDetailSkeleton</code> as the fallback, plus a{" "}
        <code>loading.tsx</code> for the route segment so navigating to an event
        shows the skeleton immediately
      </Sent>
      <Sent pos="last">
        same direct-to-backend approach — skip the <code>/api/</code> proxy to
        avoid the loopback call, fall back gracefully if the token or backend is
        unavailable. real content on the first paint instead of waiting for
        client JS to run
      </Sent>

      <Timestamp>10:55 AM</Timestamp>

      <Timestamp>10:54 AM</Timestamp>

      <Received>you ever look at the real CLS scores for the calendar</Received>

      <Sent pos="first">
        yeah, it was bad for a while. month view CLS was sitting around 0.41,
        which is well into the poor zone
      </Sent>
      <Sent pos="last">
        the culprit was <code>min-h</code> on the month cells. each cell grew to
        fit its event count, so a cell with 3 chips was about 40px taller than
        an empty one. every time events loaded in or you navigated months, the
        whole grid shifted
      </Sent>

      <Received>how did you fix it</Received>

      <Sent pos="first">
        switched to a fixed height, <code>h-[128px] sm:h-[132px]</code>, with{" "}
        <code>overflow-hidden</code>. worked out the math first to make sure it
        was enough: 3 chips at 20px each, 2px gaps between them, the &quot;+N
        more&quot; overflow line, and the padding on all sides
      </Sent>
      <Sent pos="middle">
        came out to 122px on mobile and 126px on desktop. the fixed heights give
        a little buffer above that so nothing gets clipped in normal use, and
        the same change went into <code>MonthSkeleton</code> so the skeleton
        matches the real grid exactly
      </Sent>
      <Sent pos="last">
        the skeletons for day, week, and year all needed fixing too. week view
        was missing the always-present all-day row entirely (28px shift on every
        switch), the year view cards were 52px too tall because the skeleton
        used two separate grids where the real view uses one. had to audit every
        pixel to get them all consistent
      </Sent>

      <Received>what would you still improve</Received>

      <Sent pos="first">
        drag-and-drop event resizing is the obvious one. it needs a more complex
        state model — tracking a drag target separately from committed event
        data — and I didn&apos;t want to half-bake it
      </Sent>
      <Sent pos="middle">
        recurring events would require schema work (probably rrule strings
        stored on the event) and a bunch of expansion logic in the query layer.
        doable but scope-heavy
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
        knowing when to reach for a library and when not to. FullCalendar would
        have been faster to get started but slower to customize and expensive to
        unlock. date-fns plus custom grid logic is more work upfront but the
        result is exactly what I wanted
      </Sent>
      <Sent pos="middle">
        date math is always harder than it looks. grid construction, timezone
        offsets, overlap detection — each one has edge cases that bite you.
        date-fns saved a lot of that pain
      </Sent>
      <Sent pos="last">
        and composition: keeping <code>CalendarGrid</code>, <code>DayView</code>
        , <code>WeekView</code> as focused components instead of one big
        calendar god-component means each one is easy to reason about and update
        independently
      </Sent>

      <Timestamp>11:05 AM</Timestamp>

      <Received>
        did you end up moving the calendar mutations to TanStack Query too
      </Received>

      <Sent pos="first">
        yeah, all three -- create, update, and delete are now{" "}
        <code>useMutation</code> with the full optimistic update pattern
      </Sent>
      <Sent pos="middle">
        <code>onMutate</code> cancels any in-flight fetches, snapshots the
        current cache, and applies the change immediately so the grid reacts
        before the server responds. <code>onError</code> restores the snapshot
        if the write fails. <code>onSettled</code> invalidates all calendar
        event queries
      </Sent>
      <Sent pos="last">
        the invalidation uses a prefix match on{" "}
        <code>[&quot;calendar&quot;, &quot;events&quot;]</code> rather than the
        exact range key. that way a create or delete broadcasts to every cached
        month, not just the one on screen -- which matters for multi-day events
        near month boundaries
      </Sent>

      <Received>
        what did you get from that over the setQueryData approach
      </Received>

      <Sent pos="first">
        a few things. <code>isPending</code> on each mutation drives the save
        and delete button states in the modal. the modal used to manage local{" "}
        <code>saving</code> and <code>deleting</code> booleans and reset them in
        catch blocks -- now it just reads the mutation state from props
      </Sent>
      <Sent pos="middle">
        automatic rollback on error was the other one. the old{" "}
        <code>setQueryData</code> approach had no rollback -- if the API call
        failed, the optimistic change would stick around until the next fetch.
        the mutation pattern cleans that up cleanly via <code>onError</code>{" "}
        restoring the snapshot
      </Sent>
      <Sent pos="last">
        and the mental model is cleaner. the mutation owns its whole lifecycle
        -- optimistic apply, error rollback, server sync -- instead of those
        three concerns being scattered across separate callbacks and state
        variables
      </Sent>

      <Received>nice. anything else worth mentioning</Received>

      <Sent pos="first">
        the events list page (<code>/calendar/events</code>) has two filter
        modes running in parallel — title search is client-side against whatever
        came back from the last fetch, card name and date range trigger a
        backend re-fetch
      </Sent>
      <Sent pos="last">
        the loading state there is derived from a filter key —{" "}
        <code>loadedKey !== filterKey</code>. no booleans to keep in sync, no
        setState in the effect body, consistent with the hooks eslint rule
      </Sent>

      <Received>thanks for walking me through it</Received>

      <Sent>yeah, happy to</Sent>

      <Timestamp>11:14 AM</Timestamp>

      <Received>what did you add after all that</Received>

      <Sent pos="first">
        countdowns. a separate page at <code>/calendar/countdown</code> where
        you can add a named event with a target date and a color. it shows you
        how many days away it is, and the countdown shows up inline on its date
        across all four calendar views
      </Sent>
      <Sent pos="last">
        it fits naturally in the calendar because a countdown is still just a
        date you care about. but it&apos;s not an event -- no start time, no end
        time, no duration. forcing it into the <code>CalendarEvent</code> type
        would mean adding nullable fields everywhere and writing discriminant
        checks to avoid treating them the same
      </Sent>

      <Received>so you kept them as separate types</Received>

      <Sent pos="first">
        right. <code>Countdown</code> is its own type: <code>title</code>,{" "}
        <code>description</code> (optional), <code>targetDate</code> as a{" "}
        <code>DATE</code> string, <code>color</code>, and the standard{" "}
        <code>id</code> and <code>createdAt</code>
      </Sent>
      <Sent pos="middle">
        <code>targetDate</code> is stored as Postgres <code>DATE</code>, not{" "}
        <code>TIMESTAMP WITH TIME ZONE</code>. there&apos;s no time component
        and no timezone to reason about -- a countdown lands on a calendar day,
        full stop. pg returns <code>DATE</code> as a plain{" "}
        <code>&quot;YYYY-MM-DD&quot;</code> string (no Date object, no UTC
        conversion), so there&apos;s no timezone drift to undo on the frontend
      </Sent>
      <Sent pos="last">
        the calendar views get countdowns as a separate prop:{" "}
        <code>countdowns?: Countdown[]</code> alongside{" "}
        <code>events: CalendarEvent[]</code>. the type boundary stays clean --
        no discriminant field on a union, no casting, no{" "}
        <code>if (&apos;targetDate&apos; in item)</code> checks scattered
        through the rendering code
      </Sent>

      <Received>how does the fetch strategy differ from events</Received>

      <Sent pos="first">
        events use a date-windowed query key:{" "}
        <code>[&quot;calendar&quot;, &quot;events&quot;, start, end]</code>.
        every time you navigate months the window changes, a new key is
        computed, and TanStack Query fetches the matching range from the backend
      </Sent>
      <Sent pos="middle">
        countdowns don&apos;t need that. there are maybe 10 of them total, they
        rarely change, and they need to show up across all views regardless of
        which month is visible. so there&apos;s a single key:{" "}
        <code>queryKeys.calendar.countdowns()</code> --{" "}
        <code>[&quot;calendar&quot;, &quot;countdowns&quot;]</code>, no date
        parameters. one fetch, one cache entry, filtered client-side per day
        using <code>isSameDay(parseISO(c.targetDate), day)</code>
      </Sent>
      <Sent pos="last">
        the hook is <code>useCountdowns()</code> -- same optimistic mutation
        pattern as <code>useCalendarEvents</code>, but the invalidation is
        simpler because there&apos;s only ever one cache entry to broadcast to.
        no prefix-scoped invalidation needed, just the exact key
      </Sent>

      <div className={styles.codeBubble}>
        {`// events — scoped by date window, one key per visible range
["calendar", "events", "2026-03-01T00:00:00Z", "2026-03-31T23:59:59Z"]

// countdowns — single key, no date params, filtered client-side
["calendar", "countdowns"]`}
      </div>

      <Received>where do they show up in the views</Received>

      <Sent pos="first">
        month grid: countdown chips share the <code>VISIBLE_CHIPS = 3</code>{" "}
        budget with events (events claim slots first). they use the same{" "}
        <code>CountdownChip</code> component as day and week -- same{" "}
        <code>border-l-[3px]</code> stripe and <code>{`${"${color}"}18`}</code>{" "}
        translucent fill as <code>EventChip</code>, with a small red dot on the
        far right as the only visual differentiator. if everything overflows,
        there&apos;s a single &quot;+N more&quot; line covering both
      </Sent>
      <Sent pos="middle">
        day and week views: countdowns go in the all-day section. in day view
        the all-day banner now shows whenever there are countdowns OR all-day
        events -- previously it was hidden if only timed events existed. in week
        view they land in the all-day CSS grid row, one per column, and
        auto-stack into new rows if an event bar is already occupying that
        column
      </Sent>
      <Sent pos="last">
        year view: countdown dots share the 3-dot-per-day budget in each{" "}
        <code>MiniMonth</code> cell alongside event dots. year view is read-only
        anyway so there&apos;s no click handler -- a tap navigates to the month,
        where you&apos;d click the chip to open the modal
      </Sent>

      <Received>what&apos;s the live preview in the modal</Received>

      <Sent pos="first">
        the modal shows a small badge below the date picker as you type:
        &quot;42 days away&quot;, &quot;3 days ago&quot;, or &quot;Today!&quot;
        when the date is today. it uses{" "}
        <code>
          differenceInCalendarDays(new Date(`${"${targetDate}"}
          T00:00:00`), new Date())
        </code>{" "}
        so it updates live as the date field changes
      </Sent>
      <Sent pos="last">
        small thing but it makes picking a date feel more meaningful -- you see
        immediately whether you&apos;re setting something a month out or a year
        away. similar to how a flight search shows you &quot;in 47 days&quot;
        next to the calendar picker
      </Sent>

      <Received>
        wait, doesn&apos;t parseISO treat &quot;YYYY-MM-DD&quot; as UTC midnight
      </Received>

      <Sent pos="first">
        yeah, caught that one. <code>parseISO(&quot;2026-03-28&quot;)</code>{" "}
        returns midnight UTC — in UTC-8 that&apos;s 4pm on March 27 local time,
        so <code>differenceInCalendarDays</code> was comparing against the wrong
        local date
      </Sent>
      <Sent pos="last">
        fix is one character:{" "}
        <code>new Date(`${"${targetDate}"}T00:00:00`)</code> instead of{" "}
        <code>parseISO(targetDate)</code>. no timezone suffix means the JS
        engine parses it as local midnight, which is exactly what you want for a
        date-only field
      </Sent>

      <div className={styles.codeBubble}>
        {`// before — parsed as UTC midnight, off by one in non-UTC timezones
differenceInCalendarDays(parseISO("2026-03-28"), new Date())

// after — parsed as local midnight, always correct
differenceInCalendarDays(new Date("2026-03-28T00:00:00"), new Date())`}
      </div>

      <Received>what about the dedicated countdown page</Received>

      <Sent pos="first">
        <code>/calendar/countdown</code> is the same SSR seed pattern as the
        main calendar. a <code>CountdownsWithData</code> async server component
        fetches the first page directly from the backend at request time and
        passes an <code>initialPage: CountdownPage</code> into the client
        component. wrapped in Suspense with an inline pulse skeleton so the
        shell streams immediately
      </Sent>
      <Sent pos="middle">
        <code>useCountdowns</code> uses <code>useInfiniteQuery</code> with
        cursor-based pagination -- composite{" "}
        <code>&quot;YYYY-MM-DD__&#123;uuid&#125;&quot;</code> cursor so page
        boundaries are stable across inserts and deletes.{" "}
        <code>staleTime: 0</code> makes the SSR-seeded data immediately stale so
        TanStack queues a background refetch on mount without blocking the UI.
        when there are more pages, a &quot;Load more&quot; button appears below
        the list
      </Sent>
      <Sent pos="last">
        the list sorts by target date client-side via a <code>useMemo</code>{" "}
        rather than relying on insertion order, because optimistic creates
        append to the end of the cache array. sorting post-create keeps the
        order correct without waiting for the next re-fetch. you can also create
        a countdown directly from any calendar view via the <code>+</code>{" "}
        button next to &quot;Countdowns&quot; in the header -- and both{" "}
        <code>EventModal</code> and <code>CountdownModal</code> have an{" "}
        <code>[Event] [Countdown]</code> toggle in create mode so you can switch
        without closing
      </Sent>

      <Received>nice, that&apos;s a clean addition</Received>

      <Sent>
        it fits well. the calendar was already the most personal part of the app
        -- countdowns make it feel a bit more like an actual planning tool and
        less like a demo
      </Sent>
    </>
  );
}
