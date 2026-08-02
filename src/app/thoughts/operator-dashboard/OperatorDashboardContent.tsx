"use client";

import ThoughtLayout from "@/app/thoughts/ThoughtLayout";
import styles from "@/app/thoughts/styling/styling.module.css";
import { Timestamp, Sent, Received } from "@/lib/threads";

export default function OperatorDashboardContent() {
  return (
    <ThoughtLayout
      breadcrumb="Operator Dashboard"
      title="Operator Dashboard"
      intro={
        <>
          A fleet management dashboard for smart micro-retail stores.
              Monitor store status, inventory health, alerts, and sensor data
              across an entire network in real time — built with tiered polling,
              optimistic updates, and a data freshness system.
        </>
      }
      chat={
        <div className="flex justify-center">
          <div
            className={styles.phone}
            style={{ minHeight: "calc(100dvh - 56px)" }}
          >
            <div className={styles.chat}>
              <Timestamp>Today 2:00 PM</Timestamp>

              <Received pos="first">what is the operator dashboard</Received>
              <Received pos="last">like what&apos;s the concept</Received>

              <Sent pos="first">
                fleet management for smart micro-retail. think lobby fridges,
                vending machines, little kiosks in office buildings. an operator
                runs 20-50 of them and needs a dashboard to see which ones need
                attention
              </Sent>
              <Sent pos="last">
                it&apos;s a demo with in-memory mock data but the real-time
                patterns are the interesting part — polling, optimistic updates,
                data freshness indicators
              </Sent>

              <Received>
                why different polling intervals for different data
              </Received>

              <Sent pos="first">
                not everything changes at the same rate. a critical sensor alert
                is urgent — 15 second polling. store status changes less often —
                30 seconds. inventory levels shift when someone buys something —
                60 seconds is plenty
              </Sent>
              <Sent pos="last">
                polling faster than you need wastes network. polling slower than
                you need means operators miss things. the tiers match the
                urgency of each data type
              </Sent>

              <Timestamp>2:06 PM</Timestamp>

              <Received>how do the optimistic updates work</Received>

              <Sent pos="first">
                same pattern as the calendar. onMutate snapshots the cache and
                applies the change immediately. onError rolls back. onSettled
                invalidates related queries
              </Sent>
              <Sent pos="middle">
                so when you dismiss an alert it vanishes instantly. if the
                server rejects it, it pops back. the operator never sees a
                spinner for routine actions
              </Sent>
              <Sent pos="last">
                bulk actions like &quot;dismiss all alerts&quot; show a
                confirmation modal first. you don&apos;t want a misclick wiping
                twenty alerts
              </Sent>

              <Timestamp>2:11 PM</Timestamp>

              <Received>why sort stores by severity instead of name</Received>

              <Sent pos="first">
                because the operator opens the dashboard to find problems. if
                the worst store is alphabetically in the middle of the page they
                have to scan to find it
              </Sent>
              <Sent pos="last">
                severity-first puts the fires at the top. offline first, then
                degraded with alerts, then degraded without, then healthy.
                within each tier they sort by name so the ordering is stable
              </Sent>

              <Received>tell me about the freshness system</Received>

              <Sent pos="first">
                sensor data goes stale in the real world. a fridge loses WiFi, a
                probe dies. the operator needs to know &quot;how old is this
                reading&quot; not just &quot;what is the reading&quot;
              </Sent>
              <Sent pos="middle">
                three tiers. under 2 minutes is fresh — green with a pulsing
                dot. 2-10 minutes is stale — amber. over 10 minutes is offline —
                red. connection quality shows signal bars that match
              </Sent>
              <Sent pos="last">
                when sensors haven&apos;t reported in 30+ minutes, a callout
                banner appears on the inventory tab. all thresholds use
                deterministic inputs so they&apos;re testable without mocking
                Date.now
              </Sent>

              <Timestamp>2:18 PM</Timestamp>

              <Received>what are the store detail tabs</Received>

              <Sent pos="first">
                four tabs: Inventory (stock bars, sparklines, per-item restock),
                Alerts (severity sorted, category icons, per-alert dismiss),
                Activity (chronological feed of events), and Planogram (grid
                layout of shelf slots with sensor match status)
              </Sent>
              <Sent pos="last">
                active tab is synced to a ?tab= URL param so it survives refresh
                and browser back/forward. defaults to Inventory
              </Sent>

              <Timestamp>2:22 PM</Timestamp>

              <Received>how does the toast system work</Received>

              <Sent pos="first">
                framework-agnostic store. createToastStore returns add, remove,
                subscribe. React reads it via useSyncExternalStore. toasts
                auto-dismiss after 3 seconds
              </Sent>
              <Sent pos="last">
                keeping it outside React means you can test the full lifecycle
                with timers and subscriber assertions, no component rendering
                needed
              </Sent>

              <Timestamp>2:26 PM</Timestamp>

              <Received pos="first">
                what would you change if this were production
              </Received>
              <Received pos="last">like what&apos;s actually missing</Received>

              <Sent pos="first">
                WebSockets instead of polling. a 15-second ceiling on alert
                delivery is too slow when a fridge temperature is climbing fast.
                push notifications too — operators aren&apos;t watching the
                dashboard all day
              </Sent>
              <Sent pos="middle">
                historical data and anomaly detection. the sparklines show 7
                days of fake history but real baselines could flag a fridge
                selling 3x normal or sensors drifting out of calibration
              </Sent>
              <Sent pos="middle">
                role-based auth and multi-tenant isolation. right now there are
                no operator accounts. production needs fleet managers vs field
                techs vs read-only viewers, each seeing only their own stores
              </Sent>
              <Sent pos="middle">
                a true mobile-first view for field techs. the person restocking
                a fridge is on their phone. scan barcode, confirm restock,
                acknowledge alert, next store. different UX from the fleet
                overview
              </Sent>
              <Sent pos="last">
                map view. stores have physical locations and a cluster of red
                pins in one building probably means a shared infrastructure
                issue, not individual sensor failures
              </Sent>

              <Timestamp>2:33 PM</Timestamp>

              <Received>what tradeoffs did you accept</Received>

              <Sent pos="first">
                in-memory data resets on restart. fine for a demo, bad for
                testing long-running scenarios. wiring up Postgres would have
                added deployment complexity without adding much to the frontend
                story
              </Sent>
              <Sent pos="middle">
                the per-store fan-out queries work at 10-20 stores. at 200
                they&apos;d be expensive. a real backend would aggregate fleet
                stats server-side instead of the frontend doing N parallel
                queries
              </Sent>
              <Sent pos="last">
                chart transforms recompute on every render. invisible at this
                scale but would need useMemo at fleet size
              </Sent>

              <Timestamp>2:40 PM</Timestamp>

              <Received>
                did you go back and review it after building it
              </Received>

              <Sent pos="first">
                yeah. went through it the way i&apos;d review someone
                else&apos;s PR. not &quot;does it work&quot; — the tests answer
                that. more like &quot;what will bite us in six months&quot;
              </Sent>
              <Sent pos="last">
                audited in severity order: correctness bugs, performance, UX
                gaps, code quality, test coverage
              </Sent>

              <Received>what did you find</Received>

              <Sent pos="first">
                correctness first. the data layer was mutating objects directly
                instead of returning new ones. react&apos;s diffing relies on
                reference identity so that&apos;s a subtle re-render bug waiting
                to happen
              </Sent>
              <Sent pos="middle">
                the dismiss button shared loading state across all rows. dismiss
                one alert, every dismiss button in the list disables. fixed it
                with a Set of in-flight IDs so each row tracks its own state
              </Sent>
              <Sent pos="last">
                two time functions called Date.now() internally instead of
                taking an injectable now param. every other freshness function
                already did it right — these two were the inconsistent ones
              </Sent>

              <Timestamp>2:46 PM</Timestamp>

              <Received>what about performance</Received>

              <Sent pos="first">
                the big one. fleet overview was making 2N+1 requests per poll
                cycle — alert query + inventory query per store plus the store
                list. at 6 stores that&apos;s 13 requests. at 30 stores
                it&apos;s 61
              </Sent>
              <Sent pos="middle">
                replaced the whole fan-out with a single fleet-summary endpoint.
                one request returns everything the dashboard needs. went from N
                parallel queries to 1
              </Sent>
              <Sent pos="last">
                chart transforms were recomputing every render too. wrapped them
                in useMemo with stable deps
              </Sent>

              <Received>and UX</Received>

              <Sent pos="first">
                error states were dead ends. no retry button on fetch failure.
                individual store query failures were completely silent — card
                just showed zero alerts. empty search results didn&apos;t
                suggest clearing filters
              </Sent>
              <Sent pos="last">
                the restock button had no per-item feedback. all rows showed
                &quot;Restocking...&quot; at once. now each row tracks its own
                state and shows a checkmark on success
              </Sent>

              <Timestamp>2:52 PM</Timestamp>

              <Received>
                wait all the stores are showing offline on the detail page
              </Received>

              <Sent pos="first">
                oh yeah. the factory generates lastPing timestamps 0-2 hours in
                the past at module load time. but the connection quality
                thresholds mark anything over 10 minutes as offline. so they
                drift past the threshold as the server runs
              </Sent>
              <Sent pos="last">
                fixed it by recomputing lastPing relative to Date.now() on every
                read from the store accessors. online stores get a 0-60 second
                old ping, degraded store gets 7 minutes. demo data never goes
                stale now no matter how long the server&apos;s been up
              </Sent>

              <Received>
                dismissing alerts is broken too. it vanishes then pops right
                back
              </Received>

              <Sent pos="first">
                different bug, same root cause. Next.js bundles each route
                handler separately so the dismiss PATCH route and the alerts GET
                route had their own copies of the in-memory data store.
                dismissing an alert updated one copy, but the 15-second poll
                read from the other copy where nothing changed
              </Sent>
              <Sent pos="last">
                moved the data store onto globalThis behind a singleton
                accessor. same pattern the Next.js docs recommend for Prisma
                clients. every route handler shares the same maps now regardless
                of bundling
              </Sent>

              <Timestamp>2:55 PM</Timestamp>

              <Received>testing gaps?</Received>

              <Sent pos="first">
                the restock rollback test was the interesting one. it only
                checked the final state — stock is 3 after the error. but a
                mutant that removes the optimistic update entirely still passes
                because the stock never changed from 3 in the first place
              </Sent>
              <Sent pos="last">
                now it verifies the optimistic update fires first (stock jumps
                to capacity), then verifies the rollback reverts it. that&apos;s
                the difference between &quot;final state is correct&quot; and
                &quot;the mechanism actually works&quot;
              </Sent>

              <div className={styles.typingDots}>
                <span />
                <span />
                <span />
              </div>
            </div>
          </div>
        </div>
      }
    >
      <nav
              aria-label="Update timeline"
              className="rounded-xl border border-border bg-surface p-5"
            >
              <h2 className="text-sm font-semibold text-foreground">Timeline</h2>
              <p className="mt-1 text-xs text-muted">
                Newest first &mdash; this write-up has updates, jump to one.
              </p>
              <ol className="mt-3 space-y-2 text-sm">
                <li className="flex items-baseline gap-3">
                  <span className="w-24 shrink-0 tabular-nums text-xs text-muted">
                    Aug 2, 2026
                  </span>
                  <a
                    href="#update-2026-08-02-hardening"
                    className="text-primary-600 hover:underline dark:text-primary-400"
                  >
                    The bit before merging, where I found out I was wrong
                  </a>
                </li>
                <li className="flex items-baseline gap-3">
                  <span className="w-24 shrink-0 tabular-nums text-xs text-muted">
                    Aug 2, 2026
                  </span>
                  <a
                    href="#update-2026-08-02-promotions"
                    className="text-primary-600 hover:underline dark:text-primary-400"
                  >
                    Promotions: my calculator could predict but never be wrong
                  </a>
                </li>
                <li className="flex items-baseline gap-3">
                  <span className="w-24 shrink-0 tabular-nums text-xs text-muted">
                    Aug 2, 2026
                  </span>
                  <a
                    href="#update-2026-08-02-restocking"
                    className="text-primary-600 hover:underline dark:text-primary-400"
                  >
                    Restocking: my one button was a fiction
                  </a>
                </li>
                <li className="flex items-baseline gap-3">
                  <span className="w-24 shrink-0 tabular-nums text-xs text-muted">
                    Aug 2, 2026
                  </span>
                  <a
                    href="#update-2026-08-02-timezones"
                    className="text-primary-600 hover:underline dark:text-primary-400"
                  >
                    Timezones: I went looking for a missing feature and found a
                    bug
                  </a>
                </li>
                <li className="flex items-baseline gap-3">
                  <span className="w-24 shrink-0 tabular-nums text-xs text-muted">
                    Aug 2, 2026
                  </span>
                  <a
                    href="#update-2026-08-02-pricing"
                    className="text-primary-600 hover:underline dark:text-primary-400"
                  >
                    Pricing &amp; promotions: a profit calculator per store
                  </a>
                </li>
                <li className="flex items-baseline gap-3">
                  <span className="w-24 shrink-0 tabular-nums text-xs text-muted">
                    Aug 2, 2026
                  </span>
                  <a
                    href="#update-2026-08-02-alerts"
                    className="text-primary-600 hover:underline dark:text-primary-400"
                  >
                    Alert history, analytics, and keeping the demo honest
                  </a>
                </li>
                <li className="flex items-baseline gap-3">
                  <span className="w-24 shrink-0 tabular-nums text-xs text-muted">
                    Aug 1, 2026
                  </span>
                  <a
                    href="#update-2026-08-01-backend"
                    className="text-primary-600 hover:underline dark:text-primary-400"
                  >
                    Making it real: wiring the dashboard to a database
                  </a>
                </li>
                <li className="flex items-baseline gap-3">
                  <span className="w-24 shrink-0 tabular-nums text-xs text-muted">
                    Jul 31, 2026
                  </span>
                  <a
                    href="#update-2026-07-31-boxes"
                    className="text-primary-600 hover:underline dark:text-primary-400"
                  >
                    Planogram boxes: move products into empty spots
                  </a>
                </li>
                <li className="flex items-baseline gap-3">
                  <span className="w-24 shrink-0 tabular-nums text-xs text-muted">
                    Jul 31, 2026
                  </span>
                  <a
                    href="#update-2026-07-31-analytics"
                    className="text-primary-600 hover:underline dark:text-primary-400"
                  >
                    Sales analytics: day/week/month/year, per store and fleet
                  </a>
                </li>
                <li className="flex items-baseline gap-3">
                  <span className="w-24 shrink-0 tabular-nums text-xs text-muted">
                    Jul 31, 2026
                  </span>
                  <a
                    href="#update-2026-07-31-planogram"
                    className="text-primary-600 hover:underline dark:text-primary-400"
                  >
                    Interactive planogram: rearrange slots and re-sync sensors
                  </a>
                </li>
                <li className="flex items-baseline gap-3">
                  <span className="w-24 shrink-0 tabular-nums text-xs text-muted">
                    Jul 31, 2026
                  </span>
                  <a
                    href="#update-2026-07-31"
                    className="text-primary-600 hover:underline dark:text-primary-400"
                  >
                    Running the store: arrangement, sales history, tax calculator
                  </a>
                </li>
                <li className="flex items-baseline gap-3">
                  <span className="w-24 shrink-0 tabular-nums text-xs text-muted">
                    Initial
                  </span>
                  <span className="text-muted">
                    Operator dashboard &mdash; fleet monitoring, alerts,
                    inventory health, analytics
                  </span>
                </li>
              </ol>
            </nav>


            <section>
              <h2 className="mb-3 text-lg font-bold">Why this exists</h2>
              <p className="text-muted">
                The operator dashboard is a demo of what a real-time fleet
                management tool looks like for smart vending machines, lobby
                fridges, and micro-retail kiosks. The kind of thing where an
                operator manages 20-50 physical locations and needs to know at a
                glance which ones need attention — low stock, sensor offline,
                temperature alert, door left open.
              </p>
              <p className="mt-3 text-muted">
                It&apos;s not connected to real hardware. The data layer uses
                in-memory mock stores seeded from factory functions, with
                realistic product catalogs, sensor readings, and alert
                histories. The interesting part isn&apos;t the data — it&apos;s
                how the UI handles real-time updates, stale data, and operator
                actions without feeling sluggish.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-lg font-bold">Tiered polling</h2>
              <p className="text-muted">
                Not all data changes at the same rate, so not all data should
                poll at the same interval. The dashboard uses three tiers:
              </p>
              <ul className="mt-3 list-disc pl-5 text-muted space-y-1">
                <li>
                  <strong className="text-foreground">Alerts</strong> poll every
                  15 seconds — a critical sensor going offline is the most
                  urgent signal and the operator needs to see it fast.
                </li>
                <li>
                  <strong className="text-foreground">Store list</strong> polls
                  every 30 seconds — store status (online, degraded, offline)
                  changes less often but still matters for the fleet overview.
                </li>
                <li>
                  <strong className="text-foreground">Inventory</strong> polls
                  every 60 seconds — stock levels change when someone buys
                  something, which is frequent enough to matter but not so
                  urgent that 15-second updates are worth the network cost.
                </li>
              </ul>
              <p className="mt-3 text-muted">
                All three use{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  staleTime: 0
                </code>{" "}
                and{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  refetchOnWindowFocus: true
                </code>{" "}
                — an operator who tabs back to the dashboard after five minutes
                should see fresh data immediately, not stale numbers from the
                last poll cycle.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-lg font-bold">
                Optimistic updates for operator actions
              </h2>
              <p className="text-muted">
                When an operator clicks &quot;Mark Restocked&quot; on a
                low-stock item, the stock bar fills immediately. When they
                dismiss an alert, it vanishes from the list. The UI doesn&apos;t
                wait for the server round-trip.
              </p>
              <p className="mt-3 text-muted">
                This uses TanStack Query&apos;s{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  onMutate
                </code>{" "}
                /{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  onError
                </code>{" "}
                /{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  onSettled
                </code>{" "}
                lifecycle — the same pattern as the calendar events.{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  onMutate
                </code>{" "}
                cancels in-flight queries for the affected store, snapshots the
                cache, and applies the change immediately.{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  onError
                </code>{" "}
                restores the snapshot. The user sees the change before the
                request completes, and if it fails, the UI rolls back cleanly.
              </p>
              <p className="mt-3 text-muted">
                The bulk actions (&quot;Mark All Restocked&quot; and
                &quot;Acknowledge All Alerts&quot;) show a confirmation modal
                before executing, since they affect multiple records. A single
                misclick shouldn&apos;t dismiss twenty alerts.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-lg font-bold">
                Sort by severity, not alphabetically
              </h2>
              <p className="text-muted">
                The fleet overview sorts stores worst-first: offline stores at
                the top, then degraded stores with active alerts, then degraded
                without alerts, then healthy stores at the bottom. Within each
                tier, stores sort by name for stability.
              </p>
              <p className="mt-3 text-muted">
                This is a deliberate UX choice. An alphabetically sorted grid
                means the store that needs the most attention might be halfway
                down the page. Severity-first sorting puts the fires at the top
                of the screen — the operator opens the dashboard and immediately
                sees what needs action without scanning.
              </p>
              <p className="mt-3 text-muted">
                Store cards also use visual signals: a red left-border accent
                for critical items in the inventory, amber border for stale
                sensor data, and color-coded status badges (green for online,
                amber for degraded, red for offline).
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-lg font-bold">Data freshness system</h2>
              <p className="text-muted">
                In a real deployment, sensor data can go stale. A fridge might
                lose WiFi, a temperature probe might die, a payment terminal
                might stop reporting. The operator needs to know not just
                &quot;what is the temperature?&quot; but &quot;how old is this
                reading?&quot;
              </p>
              <p className="mt-3 text-muted">
                The freshness system uses three tiers with deterministic
                thresholds:
              </p>
              <ul className="mt-3 list-disc pl-5 text-muted space-y-1">
                <li>
                  <strong className="text-foreground">Fresh</strong> (under 2
                  minutes) — green text with pulsing dot. Data is current.
                </li>
                <li>
                  <strong className="text-foreground">Stale</strong> (2-10
                  minutes) — amber text. The operator should be aware this data
                  might be lagging.
                </li>
                <li>
                  <strong className="text-foreground">Offline</strong> (over 10
                  minutes) — red text. Something is likely wrong with the sensor
                  connection.
                </li>
              </ul>
              <p className="mt-3 text-muted">
                The{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  ConnectionQuality
                </code>{" "}
                indicator shows signal bars (strong, weak, poor, offline) based
                on the same thresholds. When sensors haven&apos;t reported in
                30+ minutes, a{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  SensorOfflineCallout
                </code>{" "}
                banner appears on the inventory tab with the offline duration
                and last known reading.
              </p>
              <p className="mt-3 text-muted">
                All threshold functions accept a{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  now
                </code>{" "}
                parameter instead of calling{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  Date.now()
                </code>{" "}
                internally — deterministic inputs for deterministic tests.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-lg font-bold">Fleet analytics</h2>
              <p className="text-muted">
                A collapsible analytics section sits between the stats bar and
                the store grid. Three Recharts visualizations: a donut chart
                showing fleet health distribution (online/degraded/offline), an
                area chart bucketing alerts into 24 one-hour slots to show
                whether frequency is rising or falling, and a horizontal bar
                chart comparing per-store inventory health percentages.
              </p>
              <p className="mt-3 text-muted">
                The section defaults to collapsed and persists collapse state in
                localStorage. Operators who prefer the compact view don&apos;t
                re-collapse every visit. The data transforms are pure functions
                in their own module — status counting, hourly alert bucketing
                with a 24h cutoff, and per-store health averaging with
                zero-capacity safety.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-lg font-bold">Store detail tabs</h2>
              <p className="text-muted">
                Each store has four tabs: Inventory, Alerts, Activity, and
                Planogram. The active tab is synced to a{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  ?tab=
                </code>{" "}
                URL search param so it survives refresh and back/forward
                navigation.
              </p>
              <ul className="mt-3 list-disc pl-5 text-muted space-y-1">
                <li>
                  <strong className="text-foreground">Inventory</strong> — stock
                  bars, fill percentages, 7-day trend sparklines, per-item
                  restock. Critical items get a red left-border accent.
                </li>
                <li>
                  <strong className="text-foreground">Alerts</strong> — sorted
                  severity-first (critical, warning, info) with category icons,
                  severity badges, timestamps, and per-alert dismiss. Filter
                  pills narrow by severity level.
                </li>
                <li>
                  <strong className="text-foreground">Activity</strong> —
                  chronological feed of recent events (restocks, maintenance,
                  alert dismissals, status changes) with type-coded icons and
                  actor emails.
                </li>
                <li>
                  <strong className="text-foreground">Planogram</strong> — CSS
                  grid representing store shelves with stock level dots, fill
                  percentages, and sensor match status. Mismatched slots
                  highlight with an amber border.
                </li>
              </ul>
            </section>

            <section>
              <h2 className="mb-3 text-lg font-bold">Toast notifications</h2>
              <p className="text-muted">
                Quick actions (bulk restock, bulk dismiss, force refresh) show
                toast notifications on completion. The toast system is
                framework-agnostic — a{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  createToastStore
                </code>{" "}
                function returns a plain object with{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  add
                </code>
                ,{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  remove
                </code>
                , and{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  subscribe
                </code>{" "}
                methods. React binds to it via{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  useSyncExternalStore
                </code>
                . Toasts auto-dismiss after 3 seconds.
              </p>
              <p className="mt-3 text-muted">
                This pattern keeps the toast state fully testable without
                rendering any React components — the store is a plain function
                call that can be tested with timers and subscriber assertions.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-lg font-bold">Architecture</h2>
              <p className="text-muted">
                The data layer follows the same BFF pattern as the rest of the
                app: Next.js API routes serve as the proxy layer, and the
                operator routes use an in-memory data store seeded from factory
                functions instead of a real backend. This means the dashboard
                works without any external dependencies — no database, no
                backend service, just the Next.js dev server.
              </p>
              <p className="mt-3 text-muted">
                Pure utility functions live in dedicated modules:{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  operator-utils.ts
                </code>{" "}
                for sorting and filtering,{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  operator-freshness.ts
                </code>{" "}
                for threshold calculations,{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  operator-detail.ts
                </code>{" "}
                for tab helpers and stock categorization,{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  operator-chart-transforms.ts
                </code>{" "}
                for chart data shaping. Every function is pure, takes explicit
                inputs, and returns new values — no side effects, no internal
                state.
              </p>
              <p className="mt-3 text-muted">
                One thing that surprised us: Next.js bundles each route handler
                independently, so a plain module-level variable in{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  operator-data.ts
                </code>{" "}
                ended up as a separate instance per route. The dismiss route
                updated its copy of the alerts map, but the alerts GET route
                read from a different copy where nothing had changed. The fix
                was to attach the data store to{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  globalThis
                </code>{" "}
                behind a singleton accessor — the same pattern the Next.js docs
                recommend for Prisma clients in development mode. Every route
                handler now shares the same maps regardless of bundling.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-lg font-bold">The self-review</h2>
              <p className="text-muted">
                After the feature was fully built and working, I went back
                through it the way I&apos;d review someone else&apos;s PR. Not
                looking for &quot;does it work&quot; — the tests answer that.
                Looking for &quot;what will bite us in six months.&quot; I
                audited in order of severity: correctness bugs first, then
                performance, then UX gaps, then code quality, then test
                coverage.
              </p>

              <h3 className="mt-5 mb-2 text-[15px] font-semibold text-foreground">
                Correctness
              </h3>
              <p className="text-muted">
                The in-memory data layer was mutating objects directly —{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  alert.acknowledged = true
                </code>{" "}
                instead of returning a new object. Not a visible bug in demo
                mode, but in production React&apos;s diffing relies on reference
                identity. If the object reference doesn&apos;t change, React
                doesn&apos;t re-render, and the UI gets out of sync with the
                data. Fixed by returning new objects from every mutation.
              </p>
              <p className="mt-3 text-muted">
                The dismiss button had shared loading state across all alert
                rows. Dismissing one alert disabled the button on every alert in
                the list. Fixed by tracking in-flight alert IDs in a Set so each
                row manages its own state independently.
              </p>
              <p className="mt-3 text-muted">
                Two time-dependent functions —{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  getConnectionQuality
                </code>{" "}
                and{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  toAlertTrendData
                </code>{" "}
                — called{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  Date.now()
                </code>{" "}
                internally instead of accepting a{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  now
                </code>{" "}
                parameter. Every other freshness function in the codebase
                already took an injectable time value for deterministic testing.
                These two were the inconsistent ones. Fixed to match the
                pattern.
              </p>
              <p className="mt-3 text-muted">
                A subtler one: the factory generated{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  lastPing
                </code>{" "}
                timestamps 0-2 hours in the past at module load time, but the
                connection quality thresholds mark anything over 10 minutes as
                offline. So every store drifted into &quot;Offline&quot; signal
                and triggered sensor offline callouts as the dev server ran.
                Fixed by recomputing{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  lastPing
                </code>{" "}
                relative to{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  Date.now()
                </code>{" "}
                on every read from the store accessors, so demo data never goes
                stale regardless of how long the server has been running.
              </p>
              <p className="mt-3 text-muted">
                The trickiest one: dismissing an alert would vanish it
                momentarily (the optimistic update worked) then it would pop
                right back on the next poll. The dismiss PATCH route and the
                alerts GET route each got their own instance of{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  operator-data.ts
                </code>{" "}
                because Next.js bundles route handlers independently. So the
                dismiss mutated one copy of the in-memory map while the poll
                read from a separate copy where the alert was never dismissed.
                Fixed by attaching the data store to{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  globalThis
                </code>{" "}
                behind a singleton accessor — the same pattern Next.js docs
                recommend for Prisma clients in dev mode.
              </p>

              <h3 className="mt-5 mb-2 text-[15px] font-semibold text-foreground">
                Performance
              </h3>
              <p className="text-muted">
                The fleet overview was making 2N+1 parallel requests per poll
                cycle — one alert query and one inventory query per store, plus
                the store list. At 6 stores that&apos;s 13 requests. At 30
                stores it&apos;s 61. The{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  useMemo
                </code>{" "}
                that aggregated query results had unstable dependencies — the
                query result arrays got new references on every render — so the
                memo ran every render anyway.
              </p>
              <p className="mt-3 text-muted">
                Replaced the entire fan-out with a single{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  /api/operator/fleet-summary
                </code>{" "}
                endpoint that returns aggregated alert counts, inventory health,
                and fleet stats per store in one request. The dashboard went
                from N parallel queries to 1. Chart transforms that were
                recomputing on every render got wrapped in{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  useMemo
                </code>{" "}
                with stable dependencies.
              </p>

              <h3 className="mt-5 mb-2 text-[15px] font-semibold text-foreground">
                UX gaps
              </h3>
              <p className="text-muted">
                When the stores fetch failed, the error state was a dead end —
                no retry button, no way to recover without reloading the page.
                Individual store sub-query failures were completely silent; the
                store card just showed zero alerts. Empty search results
                didn&apos;t suggest clearing filters. The restock button had no
                per-item feedback — all rows showed &quot;Restocking...&quot; at
                once and there was no success indicator after completion.
              </p>
              <p className="mt-3 text-muted">
                Each of these is the kind of thing that works fine in a demo but
                would frustrate a real operator. Added retry buttons on error
                states, per-store error indicators on cards, &quot;clear
                filters&quot; in empty states, and per-item restock feedback
                with a brief success checkmark after completion. Also added the
                analytics expand/collapse animation that was missing.
              </p>

              <h3 className="mt-5 mb-2 text-[15px] font-semibold text-foreground">
                Code quality
              </h3>
              <p className="text-muted">
                The{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  Bone
                </code>{" "}
                skeleton component was copy-pasted into four files.{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  STATUS_CONFIG
                </code>{" "}
                was defined twice with different shapes. Inline SVG icons were
                scattered across components.{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  FleetAnalytics
                </code>{" "}
                was flattening an alert map that the parent already had in flat
                form. None of these were bugs, but each one makes the next
                developer slower. Extracted shared components, unified configs,
                pushed transforms to where the data naturally lives.
              </p>

              <h3 className="mt-5 mb-2 text-[15px] font-semibold text-foreground">
                Testing
              </h3>
              <p className="text-muted">
                The original test suite covered utility functions well but had
                gaps at the integration level. No test for the fleet overview
                rendering with real data and verifying sort order. No tests for
                error or empty states in tab components. No test for the{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  RefreshBar
                </code>{" "}
                reading from the query cache. The restock rollback test only
                asserted the final state — a mutant that removed the optimistic
                update entirely would still pass because the stock level never
                changed from its original value.
              </p>
              <p className="mt-3 text-muted">
                Backfilled all four gaps. The rollback test was the interesting
                one — it now verifies the optimistic update fires first (stock
                jumps to capacity) and then verifies it reverts after the 500
                response. That&apos;s the difference between &quot;the final
                state is correct&quot; and &quot;the rollback mechanism actually
                works.&quot;
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-lg font-bold">What we&apos;d improve</h2>
              <p className="text-muted">
                The dashboard works well as a demo, but there are real things
                that would matter if this were serving actual operators managing
                actual stores.
              </p>

              <h3 className="mt-5 mb-2 text-[15px] font-semibold text-foreground">
                WebSocket or SSE instead of polling
              </h3>
              <p className="text-muted">
                Polling at 15-second intervals means a critical alert could sit
                for up to 14 seconds before the operator sees it. For a real
                deployment, a WebSocket connection or Server-Sent Events stream
                would push alerts the moment they fire. The current polling
                architecture is a pragmatic starting point — it works with any
                HTTP backend and doesn&apos;t require connection management —
                but the latency ceiling matters when a fridge temperature is
                climbing fast.
              </p>

              <h3 className="mt-5 mb-2 text-[15px] font-semibold text-foreground">
                Push notifications
              </h3>
              <p className="text-muted">
                An operator managing 40 stores is not sitting on the dashboard
                all day. Critical alerts need to reach them on their phone. A
                notification layer (push notifications, Slack/Teams integration,
                SMS for urgent failures) would close the loop between
                &quot;something went wrong&quot; and &quot;someone knows about
                it.&quot; Right now the dashboard only works if the operator is
                looking at it.
              </p>

              <h3 className="mt-5 mb-2 text-[15px] font-semibold text-foreground">
                Historical trends and anomaly detection
              </h3>
              <p className="text-muted">
                The inventory sparklines show 7 days of simulated history, but
                real historical data could power anomaly detection — flagging a
                fridge that&apos;s selling 3x faster than usual (likely needs an
                early restock) or a store whose sensor readings are drifting
                (might need calibration). The alert trend chart is a start, but
                with real data you could build baselines and surface deviations
                automatically.
              </p>

              <h3 className="mt-5 mb-2 text-[15px] font-semibold text-foreground">
                Role-based access and multi-tenant support
              </h3>
              <p className="text-muted">
                Currently there&apos;s no auth on the operator routes. A
                production version would need operator accounts, role-based
                permissions (fleet manager vs. field technician vs. read-only
                viewer), and multi-tenant isolation so each operator only sees
                their own stores. The Auth0 integration from the rest of the app
                could extend here with custom claims for operator roles.
              </p>

              <h3 className="mt-5 mb-2 text-[15px] font-semibold text-foreground">
                Mobile-first field technician view
              </h3>
              <p className="text-muted">
                The person restocking a fridge is on their phone, not a laptop.
                A dedicated mobile view optimized for the field workflow — scan
                barcode, confirm restock, acknowledge alert, move to next store
                — would be a different UI from the desktop fleet overview. The
                current responsive layout adapts to mobile but it&apos;s still a
                desktop-first design. A truly mobile-first version for field
                techs would prioritize single-store actions over fleet
                comparisons.
              </p>

              <h3 className="mt-5 mb-2 text-[15px] font-semibold text-foreground">
                Map view
              </h3>
              <p className="text-muted">
                When stores have physical locations, a map overlay with
                color-coded pins (green for healthy, red for critical) would
                give operators spatial context. A cluster of degraded stores in
                one building might indicate a shared infrastructure issue (power
                outage, network switch down) rather than individual sensor
                failures.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-lg font-bold">Tradeoffs</h2>
              <p className="text-muted">
                The in-memory data store means every server restart seeds fresh
                data. This is fine for a demo but means you can&apos;t test
                long-running scenarios or cross-session state. The tradeoff was
                intentional — wiring up a real database for demo data would have
                added deployment complexity without adding much to the frontend
                story. One gotcha that came up: static{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  lastPing
                </code>{" "}
                timestamps generated at module load time drifted past the
                freshness thresholds as the server ran, making every store show
                &quot;Offline.&quot; The fix was to recompute timestamps
                relative to now on every read, so the demo data stays realistic
                regardless of server uptime.
              </p>
              <p className="mt-3 text-muted">
                Two tradeoffs from the initial build have since been resolved.
                The per-store fan-out pattern (N parallel queries for alerts and
                inventory) was replaced by a single{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  /api/operator/fleet-summary
                </code>{" "}
                endpoint that returns aggregated data in one request. The chart
                transforms that recomputed on every render are now memoized with
                stable dependencies. Both were acceptable at demo scale but
                would have been real problems at fleet size, so fixing them
                early was the right call.
              </p>
            </section>
      <section
              id="update-2026-08-02-hardening"
              className="scroll-mt-24 rounded-xl border border-primary-400/40 bg-primary-500/5 p-5"
            >
              <p className="text-xs font-semibold uppercase tracking-wider text-primary-600 dark:text-primary-400">
                Update &mdash; August 2, 2026
              </p>
              <h2 className="mt-1 mb-3 text-lg font-bold">
                The bit before merging, where I found out I was wrong
              </h2>
              <p className="text-muted">
                Three features were sitting in stacked pull requests waiting to
                go in. Before merging I went back over them the way I&apos;d want
                someone to go over mine, and the most useful thing that came out
                of it was a claim of my own that turned out to be false.
              </p>

              <h3 className="mt-5 mb-2 text-[15px] font-semibold text-foreground">
                I said it would degrade gracefully. It wouldn&apos;t.
              </h3>
              <p className="text-muted">
                The timezone work added a nullable{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  timezone
                </code>{" "}
                column, and I&apos;d written in the pull request that the API
                would keep working if the migration hadn&apos;t run yet, because
                the resolver falls back to the province. Nullable column, safe
                fallback, no problem.
              </p>
              <p className="mt-3 text-muted">
                Except migrations in this project are manual. Nothing in CI, the
                Dockerfile or the start script runs them. So the gap between
                merging and migrating is real, and I wanted to know exactly how
                bad it was rather than assume. I generated the SQL Drizzle
                actually emits:
              </p>
              <pre className="mt-3 overflow-x-auto rounded-lg bg-surface p-3 text-[13px] font-mono text-foreground">
{`select "id", "name", "location", "province", "timezone",
       "status", "temperature", "uptime", "revenue_24h",
       "last_ping", "created_at"
  from "operator_stores"`}
              </pre>
              <p className="mt-3 text-muted">
                An explicit column list, not{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  select *
                </code>
                . Before the migration, Postgres raises 42703 and every store
                read returns a 500, which takes the fleet list, the store detail
                page, the fleet summary and everything that looks a store up on
                the way to doing something else. My fallback never runs, because
                the query never returns a row for it to run on.
              </p>
              <p className="mt-3 text-muted">
                The fix is not complicated once you know: run the migrations
                first, then merge. They&apos;re additive, one nullable column and
                three new tables, and the version currently in production
                doesn&apos;t select the column or know the tables exist, so the
                schema can sit ahead of the code with nothing noticing. Expand
                first, deploy second. What I find worth writing down is that I
                had the shape of the answer right and the direction backwards,
                and the only reason I caught it was checking a claim I was
                already confident about.
              </p>

              <h3 className="mt-5 mb-2 text-[15px] font-semibold text-foreground">
                Why I didn&apos;t put auth on the write endpoints
              </h3>
              <p className="text-muted">
                By this point the operator module had twenty routes, nine of them
                writes, none of them authenticated or rate limited. The obvious
                move is to add{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  checkJwt
                </code>{" "}
                to the writes, and there&apos;s already a pattern for it in this
                codebase: the feature flags console forwards the visitor&apos;s
                Auth0 token through its BFF.
              </p>
              <p className="mt-3 text-muted">
                I didn&apos;t, and the reason is worth more than the change would
                have been. The operator client sends no token. So adding auth
                would 401 every restock and every promotion coming from the
                dashboard, the BFF would catch it and fall back to its in-memory
                seed, and the demo would carry on looking like it worked while
                persisting nothing. That&apos;s exactly the fiction I&apos;d
                spent three features removing. Reintroducing it in the name of
                security would be the worst kind of change: defensible in a
                summary, actively harmful in practice.
              </p>
              <p className="mt-3 text-muted">
                What actually bounds the exposure here is a rate limit, so every
                route got one, at the numbers the flags module already uses. The
                worst an anonymous caller can do now is churn demo data at 30
                writes a minute, and there&apos;s a nightly job that reseeds it
                anyway. Auth belongs here the moment there&apos;s a real tenant
                to protect, and at that point it&apos;s a wiring job rather than
                a design one. It just isn&apos;t a decision to make quietly
                inside a cleanup.
              </p>

              <h3 className="mt-5 mb-2 text-[15px] font-semibold text-foreground">
                Two smaller things I&apos;d have missed
              </h3>
              <p className="text-muted">
                The promotion performance query had no upper bound. An open-ended
                promotion left running for a year gives you a year-long window,
                and the baseline doubles the fetch, so measuring one would drag
                two years of sales through the app to answer a single question.
                It clamps to the most recent 180 days now, and the response
                reports the range it actually measured plus a note when the clamp
                applied. A smaller number honestly labelled beats a bigger one
                quietly measured over a period the reader didn&apos;t expect.
              </p>
              <p className="mt-3 text-muted">
                And the operator module had zero OpenAPI registrations while the
                rest of the API had 43. Adding twelve was routine. The part that
                wasn&apos;t was realising both new request schemas use{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  .refine()
                </code>
                , and that the library throws on some schema shapes with no
                symptom until the docs page falls over at runtime, long after CI
                went green. So there&apos;s a test now that just generates the
                document and asserts it didn&apos;t throw. Cheap, and it covers a
                failure that would otherwise surface as a support question.
              </p>
              <p className="mt-3 text-muted">
                None of this is glamorous work. It&apos;s the difference between
                three features that demo well and three features I&apos;d be
                comfortable putting in front of real operators, which is the only
                distinction that matters once something is actually running.
              </p>
            </section>

      <section
              id="update-2026-08-02-promotions"
              className="scroll-mt-24 rounded-xl border border-primary-400/40 bg-primary-500/5 p-5"
            >
              <p className="text-xs font-semibold uppercase tracking-wider text-primary-600 dark:text-primary-400">
                Update &mdash; August 2, 2026
              </p>
              <h2 className="mt-1 mb-3 text-lg font-bold">
                Promotions: my calculator could predict but never be wrong
              </h2>
              <p className="text-muted">
                The Pricing tab I built models a discount and shows the revenue
                and profit tradeoff. It is careful to say it assumes volume
                holds, and it is a genuinely useful modelling tool. But it
                persists nothing, which means it can never be wrong out loud. You
                cannot run the promotion, and you certainly cannot go back
                afterwards and find out whether the prediction was any good.
              </p>
              <p className="mt-3 text-muted">
                Micromart shipped self-serve promotions about a month ago: create
                them, target by location or product, schedule them, and read
                built-in performance analytics. The scheduling and the
                after-the-fact measurement were the parts I did not have.
              </p>
              <p className="mt-3 text-muted">
                There was also a loose end in my own schema pointing straight at
                this. The{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  price-update
                </code>{" "}
                activity type had been in the enum since the beginning, with a
                label, a colour and an icon in the feed &mdash; and nothing had
                ever created one. Dead configuration waiting for a write path.
                This is that write path.
              </p>

              <h3 className="mt-5 mb-2 text-[15px] font-semibold text-foreground">
                Two things I deliberately did not build
              </h3>
              <p className="text-muted">
                <strong>No status column.</strong> A promotion looks like it
                wants one &mdash; scheduled, active, ended &mdash; but a stored
                status needs a job to flip it and is wrong in between runs. Status
                is a comparison between the window and the clock, so it is
                derived on every read. The client derives it again rather than
                trusting the payload, because a tab left open overnight should
                not keep calling a finished promotion live. That is one of the
                tests.
              </p>
              <p className="mt-3 text-muted">
                <strong>No price mutation.</strong> Nothing writes the discounted
                price into{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  operator_inventory.price
                </code>
                . The discount applies at read time, so the list price survives
                &mdash; and the list price is the number every margin calculation
                needs. Overwriting it would mean losing the original the moment a
                promotion starts, and then reconstructing it from an audit log to
                answer the simplest question about profitability. Same
                derive-don&apos;t-store call the Tax tab and the calculator
                already make.
              </p>

              <h3 className="mt-5 mb-2 text-[15px] font-semibold text-foreground">
                The measurement, and being honest about it
              </h3>
              <p className="text-muted">
                Performance compares units and revenue inside the promotion
                window against an{" "}
                <strong>equal-length baseline immediately before it</strong>.
                Equal length matters: comparing a two-week promotion against the
                previous month would flatter or punish it purely on duration.
                It is two grouped queries filtered in SQL, so measuring a
                fortnight does not drag eighteen months of sales into Node.
              </p>
              <p className="mt-3 text-muted">
                The part I care more about is what it does <em>not</em> claim.
                This is a before-and-after, not attribution. Seasonality, a new
                product on the next shelf, and a fridge that ran warm for a week
                all move the same number. So the API returns both raw totals
                rather than only a headline delta, ships a{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  note
                </code>{" "}
                field saying so in words, and the UI repeats it. A dashboard that
                quietly implies causation is worse than one that admits what it
                is showing &mdash; and it is the same instinct as the calculator
                saying it assumes volume holds rather than inventing an
                elasticity model.
              </p>

              <h3 className="mt-5 mb-2 text-[15px] font-semibold text-foreground">
                Where the three pieces meet
              </h3>
              <p className="text-muted">
                This is the feature that made the other two worth doing in that
                order. A promotion window is a pair of instants that an operator
                thinks about as &quot;starts Monday morning&quot;, and Monday
                morning is only meaningful in the store&apos;s timezone &mdash;
                which is why the timezone work had to land first, and why the
                schedule form names the zone rather than hoping. And the promotion
                writes a{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  price-update
                </code>{" "}
                into the same activity feed the restock sessions write to, so the
                store&apos;s history reads as one narrative instead of three
                disconnected logs.
              </p>
              <p className="mt-3 text-muted">
                It also forced me to pay a debt. Both earlier features shipped
                deliberately duplicated helpers &mdash; the same arithmetic in the
                Express service and the Next app, on purpose, because two tested
                copies of thirty lines beat coupling two deploys. Both times I
                wrote in the recap that the test justifying the duplication did
                not exist. It exists now: a parity block that runs the same
                vectors the API asserts through the client copies, so a change to
                one that is not mirrored fails the build. A design decision
                without the test that holds it up is just a comment.
              </p>

              <h3 className="mt-5 mb-2 text-[15px] font-semibold text-foreground">
                Who this helps
              </h3>
              <p className="text-muted">
                <strong>Operators</strong> get a loop instead of a guess. Model a
                discount, schedule it in two clicks with the modelled numbers
                pre-filled, and afterwards see what actually happened next to what
                was predicted. Overlapping promotions resolve to the deepest
                rather than stacking, which is both predictable and the one that
                favours the person standing at the fridge.
              </p>
              <p className="mt-3 text-muted">
                <strong>Developers</strong> get a promotions table with no
                lifecycle job attached to it, which is one fewer thing that can be
                subtly wrong at 3am. Widening it to fleet-wide campaigns is a
                single migration making{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  store_id
                </code>{" "}
                nullable &mdash; I left it NOT NULL because guessing the grouping
                semantics before anyone has asked for them is how you end up
                maintaining a shape nobody wanted.
              </p>
            </section>

      <section
              id="update-2026-08-02-restocking"
              className="scroll-mt-24 rounded-xl border border-primary-400/40 bg-primary-500/5 p-5"
            >
              <p className="text-xs font-semibold uppercase tracking-wider text-primary-600 dark:text-primary-400">
                Update &mdash; August 2, 2026
              </p>
              <h2 className="mt-1 mb-3 text-lg font-bold">
                Restocking: my one button was a fiction
              </h2>
              <p className="text-muted">
                Restocking is the single most documented workflow on
                Micromart&apos;s site, and it is documented as a phone task. Pick
                store, pick cabinet, tap a slot, see the expected count,
                optionally confirm a physical count, Add and Remove per slot with
                a required reason on removals, repeat, review, complete. Skipping
                the count is explicitly supported so a team can spot-check rather
                than count everything.
              </p>
              <p className="mt-3 text-muted">
                Mine was one button. It ran{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  update operator_inventory set current_stock = capacity
                </code>{" "}
                and wrote a single activity row reading &quot;Restocked N item(s)
                to full capacity&quot;.
              </p>
              <p className="mt-3 text-muted">
                That is not a simplification, it is a fiction. It cannot express
                six yogurts binned because they expired, a sensor reading eight
                where the shelf held five, or a case damaged in the van.
                Shrinkage and miscounts are exactly where an unattended-retail
                operator&apos;s margin goes, and my data model had nowhere to put
                either of them. I had built the happy path and called it the
                feature.
              </p>

              <h3 className="mt-5 mb-2 text-[15px] font-semibold text-foreground">
                The one decision the rest falls out of
              </h3>
              <p className="text-muted">
                A restock is now a session with one line per product touched, and{" "}
                <strong>inventory is never written directly</strong>. Lines
                accumulate while the restocker works the shelf; completing the
                session is the only thing that touches{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  operator_inventory
                </code>
                , in one transaction. One write path means the audit trail cannot
                be bypassed, which is the whole reason the feature is worth
                anything.
              </p>
              <p className="mt-3 text-muted">
                The subtle part is that{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  counted_qty
                </code>{" "}
                is nullable, and that is deliberate rather than lazy. Null means
                the restocker chose to skip counting that slot. That is a
                recorded decision, not absent data, and it is what lets a line be
                classified as matches-expected, correction, or not-counted. A
                spot-checked shelf and an unchecked one look identical in a
                schema that only stores the final number, and telling them apart
                is most of the value.
              </p>

              <h3 className="mt-5 mb-2 text-[15px] font-semibold text-foreground">
                What I did with the old button, and why
              </h3>
              <p className="text-muted">
                Three options, all defensible. Delete it and force the full flow;
                keep it as a second, un-audited path; or rewrite it. Deleting it
                turns &quot;top everything up before I leave&quot; into a
                six-step wizard, which is a worse product for a real operator on
                a real route. Keeping it un-audited leaves a hole straight
                through the feature I just built.
              </p>
              <p className="mt-3 text-muted">
                So I rewrote it. Quick-fill now opens a session, writes a line
                per item marked <em>not counted</em> with the top-up as the add,
                and completes it. The response shape is byte-identical for the
                existing client, so the optimistic mutation on the frontend did
                not change at all &mdash; but the shortcut now leaves the same
                trail as a walked shelf, and honestly labels itself as a fill
                nobody counted.
              </p>

              <h3 className="mt-5 mb-2 text-[15px] font-semibold text-foreground">
                How the backend shaped the frontend, again
              </h3>
              <p className="text-muted">
                The API contract here is not a passive data pipe; it decided the
                shape of the UI in three places.
              </p>
              <p className="mt-3 text-muted">
                <strong>Completing twice is a 409, so the client can be dumb.</strong>{" "}
                A double submit from a phone with a flaky connection is the
                likeliest failure mode in this whole feature, and applying the
                adds and removes twice would silently corrupt the shelf. Because
                the server refuses the second one, the frontend does not need
                request de-duplication, an idempotency key, or a disabled-button
                race. It needs a disabled button for the common case and an error
                message for the rare one. Pushing that invariant server-side
                removed a category of client state.
              </p>
              <p className="mt-3 text-muted">
                <strong>Lines are upserted on{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  (session_id, item_id)
                </code>
                , so saving is idempotent.</strong>{" "}
                That is what makes it safe to push a line on slot-save and retry
                without thinking. And it is why I push on save rather than on
                every tap: per-keystroke writes over a bad connection is the
                obvious wrong design, so the local draft is the source of truth
                until a slot is done, and then exactly one request goes out.
              </p>
              <p className="mt-3 text-muted">
                <strong>The session lives in the database, so resume is nearly
                free.</strong>{" "}
                One localStorage key holds the id; a reload re-fetches the
                session and carries on. That sounds like a small thing and is
                not: the target device is a phone in a parking garage or a
                stairwell, and losing twenty slots of counting to a backgrounded
                tab would make the whole feature untrustworthy. Real offline
                queueing needs conflict rules and is a project of its own, so I
                drew the line at surviving a refresh and said so.
              </p>

              <h3 className="mt-5 mb-2 text-[15px] font-semibold text-foreground">
                Design for a thumb in a cold room
              </h3>
              <p className="text-muted">
                Steppers, not number inputs. Every target at least 44px. The
                running result is in an{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  aria-live=&quot;polite&quot;
                </code>{" "}
                region so it can be confirmed without looking away from the
                shelf. The reason picker is a real radiogroup that becomes
                required the instant anything is removed, with the message tied
                by{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  aria-describedby
                </code>{" "}
                rather than shown as a floating red string.
              </p>
              <p className="mt-3 text-muted">
                Two of my own component tests failed on the first run and both
                were real bugs, not bad tests. The skip-count control relabelled
                itself as it toggled, which reads as two different buttons; it
                now keeps one label and carries the state in{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  aria-pressed
                </code>
                . And &quot;not counted&quot; appeared twice on the same screen
                in two different meanings. Writing the assertion from the
                operator&apos;s point of view is what surfaced both.
              </p>

              <h3 className="mt-5 mb-2 text-[15px] font-semibold text-foreground">
                Who this helps
              </h3>
              <p className="text-muted">
                <strong>Operators</strong> get the question they actually have an
                answer to at month end: where did the margin go. &quot;Restocked
                6 items&quot; tells them nothing; &quot;-5 (3 expired, 2
                damaged), 2 corrections&quot; is a sentence they can act on. And
                the correction count is a second, quieter signal &mdash; a slot
                that keeps disagreeing with the sensor is a hardware problem, not
                a stock problem.
              </p>
              <p className="mt-3 text-muted">
                <strong>Developers</strong> get one write path to inventory and a
                pure helper that owns the arithmetic on both sides. Every future
                feature that moves stock &mdash; fill targets, pick lists,
                returns &mdash; writes a session rather than inventing its own
                update, so the audit trail keeps working without anybody
                maintaining it. The reason codes being a constrained enum rather
                than free text is the same bet: it costs a migration to add one,
                and it makes &quot;how much did we lose to expiry last month&quot;
                a{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  GROUP BY
                </code>{" "}
                instead of a research project.
              </p>
            </section>

      <section
              id="update-2026-08-02-timezones"
              className="scroll-mt-24 rounded-xl border border-primary-400/40 bg-primary-500/5 p-5"
            >
              <p className="text-xs font-semibold uppercase tracking-wider text-primary-600 dark:text-primary-400">
                Update &mdash; August 2, 2026
              </p>
              <h2 className="mt-1 mb-3 text-lg font-bold">
                Timezones: I went looking for a missing feature and found a bug
              </h2>
              <p className="text-muted">
                I sat down and went through Micromart&apos;s product properly
                &mdash; the platform pages, the help centre, and most usefully
                their public changelog, which is dated and only lists what
                actually shipped. Their operator platform is organised as six
                areas: stores and monitoring, products and pricing, inventory and
                restocking, marketing and promotions, sales and insights, and
                finances and taxes. About seven months ago they shipped a release
                note that reads: dashboard data, timestamps, reports and CSV
                exports now display in local North American timezones.
              </p>
              <p className="mt-3 text-muted">
                I went to compare that against mine, expecting to write down a
                missing feature. What I found instead was that mine was wrong.
              </p>

              <h3 className="mt-5 mb-2 text-[15px] font-semibold text-foreground">
                The bug
              </h3>
              <p className="text-muted">
                Every bucket boundary in the whole stack was UTC.{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  buildPeriods
                </code>{" "}
                floored with{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  Date.UTC
                </code>
                ,{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  alertsByDay
                </code>{" "}
                divided epoch milliseconds by 86,400,000, and on the API side the
                SQL truncated with a bare{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  date_trunc(granularity, occurred_at)
                </code>
                , which resolves in whatever timezone the database session
                happens to be in.
              </p>
              <p className="mt-3 text-muted">
                For a Toronto store in summer that puts the day boundary at 8pm
                the previous evening. For Vancouver it&apos;s 5pm. The busiest
                part of an operator&apos;s afternoon was being filed under
                tomorrow. Nobody noticed because the seed data is spread evenly
                and every store was treated identically &mdash; the bug is
                invisible right up until you care which day a sale landed in,
                which is the entire reason a sales chart exists.
              </p>
              <p className="mt-3 text-muted">
                That&apos;s the honest version of &quot;competitive analysis&quot;
                for me. Reading someone else&apos;s changelog is worth doing not
                because you copy the feature, but because it points a flashlight
                at the assumption you never checked.
              </p>

              <h3 className="mt-5 mb-2 text-[15px] font-semibold text-foreground">
                Where the timezone lives, and why that&apos;s a product decision
              </h3>
              <p className="text-muted">
                The first real question isn&apos;t technical. A timezone could
                reasonably come from the browser or from the store, and picking
                wrong makes the whole feature feel broken. I went with the store.
                An operator servicing a Vancouver route from a hotel room in
                Toronto should not watch every chart shift three hours because
                they got on a plane. The store&apos;s day belongs to the store.
              </p>
              <p className="mt-3 text-muted">
                That decision is what makes the rest of the design fall out
                cleanly: the zone is resolved server-side, travels in the store
                DTO, and the client only ever formats with it. The frontend never
                re-derives policy, which means there is exactly one place a
                Vancouver store can be told it&apos;s in Vancouver.
              </p>

              <h3 className="mt-5 mb-2 text-[15px] font-semibold text-foreground">
                How the backend shaped the frontend
              </h3>
              <p className="text-muted">
                This is the part I find most interesting, because three
                constraints that live entirely in the API ended up dictating
                frontend code.
              </p>
              <p className="mt-3 text-muted">
                <strong>Postgres 15, not 16.</strong> The clean way to do this in
                SQL is the three-argument{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  date_trunc(field, source, zone)
                </code>
                , which landed in Postgres 16. This project runs 15. So the SQL
                does the round trip by hand: shift the timestamptz into local
                wall clock with{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  AT TIME ZONE
                </code>
                , truncate there, shift the result back. It works on both
                versions, so the fix doesn&apos;t quietly depend on someone
                bumping a Docker tag. The knock-on for the client is that the
                instants coming back are local period starts, not UTC midnights
                &mdash; which is why the bucket join key is now the raw instant
                rather than a sliced ISO string.
              </p>
              <p className="mt-3 text-muted">
                <strong>Migrations run by hand.</strong> Nothing in CI, the
                Dockerfile or the start script runs the migration. Deploying code
                that selects a column which doesn&apos;t exist yet would 500 the
                entire stores endpoint. So the column is nullable, the API
                resolves{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  store.timezone ?? timezoneForProvince(store.province)
                </code>
                , and on the client the field is optional in the Zod schema with
                the province as a fallback. A browser holding the new bundle
                against an API that hasn&apos;t deployed yet still renders
                correctly. That&apos;s not defensive padding &mdash; it&apos;s
                the only reason the two PRs can land in either order.
              </p>
              <p className="mt-3 text-muted">
                <strong>The same calendar math had to exist twice.</strong> The
                API buckets for the fleet rollup; the client buckets for
                per-store views over data it already has in cache. I deliberately
                did not extract a shared package for this. Two small, tested,
                independently-versioned copies of about eighty lines beat a
                shared dependency that couples a Next app&apos;s deploy to an
                Express service&apos;s, for a function whose inputs are two dates
                and a string. The compromise is that the two can drift; the
                mitigation is that the DST cases are pinned by tests on both
                sides, and drift there fails loudly.
              </p>

              <h3 className="mt-5 mb-2 text-[15px] font-semibold text-foreground">
                No date library, and what that cost
              </h3>
              <p className="text-muted">
                The only question zone-aware bucketing actually asks is: given
                this instant and this zone, what is the local year, month, day
                and hour.{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  Intl.DateTimeFormat.formatToParts
                </code>{" "}
                answers exactly that, using tzdata the runtime already ships.
                Pulling in Luxon or date-fns-tz would send 20 to 60kB of a second
                copy of tzdata down the wire, on a release cadence I don&apos;t
                control, to do a job the platform already does.
              </p>
              <p className="mt-3 text-muted">
                The cost is real though, and it&apos;s the thing people get wrong
                with{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  Intl
                </code>
                : constructing a formatter is genuinely expensive, while calling
                one is cheap. So formatters are built once per zone and cached in
                a module-level Map. But the bigger win is structural rather than
                a cache: rather than asking &quot;what local day is this
                sale in&quot; once per sale,{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  dayBoundaries
                </code>{" "}
                resolves the eight local-midnight boundaries up front and then
                places every sale with plain integer comparisons. Over eighteen
                months of history that&apos;s eight zone resolutions instead of
                tens of thousands, and it&apos;s the difference between a chart
                that renders instantly and one that stutters when you flip the
                range toggle.
              </p>
              <p className="mt-3 text-muted">
                Getting DST right is the whole reason this needs care. A local
                day is not 86,400,000 milliseconds twice a year: in 2026 March 8
                is 23 hours long and November 1 is 25. The instant lookup runs
                two passes, because the UTC offset you need depends on the
                instant you&apos;re trying to find. Three tests pin exactly that,
                plus one for Newfoundland, which sits at minus three thirty and
                breaks any code that assumes zone offsets are whole hours.
              </p>

              <h3 className="mt-5 mb-2 text-[15px] font-semibold text-foreground">
                The compromise I actually had to think about
              </h3>
              <p className="text-muted">
                Per-store views have an obvious right answer. The fleet view does
                not. The fleet spans BC through Ontario, so a bucket labelled
                &quot;Tue&quot; cannot simultaneously be Vancouver&apos;s Tuesday
                and Toronto&apos;s &mdash; those are different, three-hour-offset
                spans of real time.
              </p>
              <p className="mt-3 text-muted">
                The tempting answer is to bucket each store in its own zone and
                add the results up. That&apos;s the one genuinely wrong option,
                and it&apos;s wrong in a way that hides: local days are offset
                spans, so the windows overlap and leave gaps, the buckets stop
                being a partition of time, and the bar heights become quietly
                meaningless. Nothing about the chart looks broken. It just
                isn&apos;t true.
              </p>
              <p className="mt-3 text-muted">
                So the fleet chart buckets in one zone &mdash; the
                viewer&apos;s, because &quot;my Tuesday&quot; is how someone
                reading a roll-up actually thinks &mdash; and the UI says so, in
                plain text, right under the range toggle. The label is not
                decoration or a disclaimer. It is the thing that makes the number
                honest, and it&apos;s text rather than a tooltip so a screen
                reader gets the same disclosure as a mouse does.
              </p>
              <p className="mt-3 text-muted">
                One more small inconsistency I chose on purpose: the existing{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  granularity
                </code>{" "}
                param falls back silently on garbage, but a bad{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  tz
                </code>{" "}
                returns a 400. A wrong granularity shows you the wrong range and
                you can see that immediately. A wrong zone shifts every boundary
                in the response by hours and looks completely normal. Failing
                loudly is worth breaking a convention for.
              </p>

              <h3 className="mt-5 mb-2 text-[15px] font-semibold text-foreground">
                Who this actually helps
              </h3>
              <p className="text-muted">
                <strong>Operators</strong> get a day that starts when their day
                starts. The late-afternoon rush shows up on the afternoon it
                happened, the restock they did at 7pm is on that evening, and the
                7-day trend is seven of their days rather than seven arbitrary
                24-hour windows. On the fleet view they get something subtler but
                more valuable: a number they can trust, because it tells them
                what it&apos;s measuring.
              </p>
              <p className="mt-3 text-muted">
                <strong>Developers</strong> get one module that owns the
                conversion between an instant and a local wall clock, on each
                side, instead of{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  Date.UTC
                </code>{" "}
                scattered through four files. Every new time-bucketed feature
                takes a zone parameter and inherits correct DST behaviour for
                free. That matters immediately, because the next two things I
                want to build on this dashboard are a restock audit trail and
                scheduled promotions &mdash; and both of those are worthless if
                &quot;when&quot; is wrong.
              </p>
            </section>

      <section
              id="update-2026-08-02-pricing"
              className="scroll-mt-24 rounded-xl border border-primary-400/40 bg-primary-500/5 p-5"
            >
              <p className="text-xs font-semibold uppercase tracking-wider text-primary-600 dark:text-primary-400">
                Update &mdash; August 2, 2026
              </p>
              <h2 className="mt-1 mb-3 text-lg font-bold">
                Pricing &amp; promotions: a profit calculator per store
              </h2>
              <p className="text-muted">
                I went and looked at what the commercial smart-store platforms
                actually put in front of an operator, and the same section kept
                coming up that mine didn&apos;t have: products and pricing.
                Manage what you sell and how you price it, run a discount across
                the shelf, and a profit calculator to see what a promotion does
                to the numbers. My tabs could tell an operator what sold and what
                tax they owed, but nothing helped them decide what to charge. So
                this is a new Pricing tab, sitting between Sales and Tax where the
                revenue tabs cluster.
              </p>

              <h3 className="mt-5 mb-2 text-[15px] font-semibold text-foreground">
                A calculator, not a price editor
              </h3>
              <p className="text-muted">
                The obvious version of this persists a new price back to the
                store. I deliberately didn&apos;t. Committing a price is a real
                write with a real schema change flowing through the backend, and
                the question an operator actually asks first is &quot;what would
                happen if I did this&quot; &mdash; not &quot;change it now.&quot;
                So the tab is a model: pick a discount per product, or one
                discount across the whole shelf, and watch the projected weekly
                revenue move. It&apos;s the same derive-not-store call I made for
                tax &mdash; the sales and the list prices are the source of
                truth, and the calculator is a pure function over them, so
                there&apos;s no second price ledger to drift and no round-trip to
                wait on. The{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  price-update
                </code>{" "}
                activity type is already in the model for the day a persisted
                write lands.
              </p>

              <h3 className="mt-5 mb-2 text-[15px] font-semibold text-foreground">
                The numbers
              </h3>
              <p className="text-muted">
                Everything is in{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  operator-pricing.ts
                </code>
                , pure and unit-tested with no component in sight.{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  promoPrice(list, percent)
                </code>{" "}
                applies and rounds the discount (and clamps a fat-fingered
                percent into 0&ndash;100),{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  weeklyUnitsFor
                </code>{" "}
                pulls the trailing-7-day demand for a product out of the sales
                list, and{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  summarizePricing
                </code>{" "}
                rolls the rows into the headline: projected weekly revenue at
                list versus with the promos, the delta between them, and how many
                products are discounted at what average. Tax-included price per
                row reuses the existing{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  computeTax
                </code>{" "}
                by the store&apos;s province, so the pre-tax and with-tax numbers
                can&apos;t disagree with the Tax tab.
              </p>
              <p className="mt-3 text-muted">
                The one honesty note I made sure to put in the UI: the projection
                assumes volume holds at the new price. A real discount usually
                lifts volume, but modelling elasticity from a demo&apos;s seeded
                sales would be inventing a number. So the tab measures the thing
                it can actually measure &mdash; the revenue you give up (or keep)
                per week if the same units move &mdash; and says so, rather than
                dressing up a guess as a forecast.
              </p>

              <h3 className="mt-5 mb-2 text-[15px] font-semibold text-foreground">
                From revenue to profit
              </h3>
              <p className="text-muted">
                The version the commercial platforms actually sell is a{" "}
                <em>profit</em> calculator, not just revenue, and a discount only
                makes sense against what a product costs. My inventory carries a
                sale price but no cost of goods, and I didn&apos;t want to invent
                a backend field for it. So cost is derived from an assumed gross
                margin the operator plugs in &mdash; 30, 40, 50, 60% &mdash; the
                same &quot;enter your numbers&quot; move those calculators make.{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  unitCost(list, margin)
                </code>{" "}
                turns the margin into a cost,{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  buildProfitTable
                </code>{" "}
                layers projected weekly profit at list and promo onto each row,
                and{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  summarizeProfit
                </code>{" "}
                totals it and counts anything the discount has pushed below cost.
              </p>
              <p className="mt-3 text-muted">
                That below-cost guard is why the discounts go all the way to a
                50% clearance cut. A gentle 10% off never threatens a healthy
                margin, but a clearance promotion can absolutely sell a product
                at a loss, and the calculator should say so &mdash; the row turns
                red and the header warns how many products are underwater at the
                current margin. It&apos;s the difference between &quot;here&apos;s
                a discount&quot; and &quot;here&apos;s what the discount does to
                the bottom line.&quot;
              </p>

              <h3 className="mt-5 mb-2 text-[15px] font-semibold text-foreground">
                Usable and accessible
              </h3>
              <p className="text-muted">
                The discount controls are real buttons with{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  aria-pressed
                </code>{" "}
                on the selected step and labels a screen reader can read (&quot;Set
                Coca-Cola 355ml discount to 10%&quot;), the per-product breakdown
                is a proper table with scoped headers and a caption, and the
                revenue impact carries a sign and a label so colour is never the
                only signal. Store-wide &quot;apply to all&quot; is one row of
                buttons at the top so setting a shelf-wide campaign is a single
                click, then you fine-tune individual products from there.
              </p>
            </section>

      <section
              id="update-2026-07-31"
              className="scroll-mt-24 rounded-xl border border-primary-400/40 bg-primary-500/5 p-5"
            >
              <p className="text-xs font-semibold uppercase tracking-wider text-primary-600 dark:text-primary-400">
                Update &mdash; July 31, 2026
              </p>
              <h2 className="mt-1 mb-3 text-lg font-bold">
                Running the store, not just watching it
              </h2>
              <p className="text-muted">
                Picking this back up today. The original dashboard answers one
                question well: which stores need attention right now. But an
                operator also runs each store as a small business, and the tabs
                didn&apos;t help with any of that. So this is a continuation, not
                a rewrite &mdash; three new capabilities layered onto the same
                in-memory demo data and the same pure-function-plus-schema
                patterns the rest of the feature already uses.
              </p>
              <ul className="mt-3 list-disc pl-5 text-muted space-y-1">
                <li>
                  <strong className="text-foreground">Store arrangement</strong>{" "}
                  &mdash; know which product is in which spot, and what to refill
                  on the next visit.
                </li>
                <li>
                  <strong className="text-foreground">Sales history</strong>{" "}
                  &mdash; see what actually sold, not just what&apos;s in stock.
                </li>
                <li>
                  <strong className="text-foreground">Tax calculator</strong>{" "}
                  &mdash; Canada, so GST/HST/PST/QST worked out per province with
                  a remittance history.
                </li>
              </ul>

              <h3 className="mt-5 mb-2 text-[15px] font-semibold text-foreground">
                Store arrangement: slots have addresses now
              </h3>
              <p className="text-muted">
                The planogram already drew the shelves, but a slot was just a
                box in a grid. If I&apos;m standing in front of the fridge, &quot;box
                three on the second shelf&quot; means nothing. So every slot now
                carries an address &mdash; shelf letter plus 1-based position, so
                the fifth item on shelves of four is{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  B1
                </code>
                . One helper,{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  slotLabelFor(index, shelfWidth)
                </code>
                , owns that math so the grid and the refill list can&apos;t
                disagree about where something lives.
              </p>
              <p className="mt-3 text-muted">
                On top of that is a &quot;refill run&quot;:{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  getRefillList
                </code>{" "}
                pulls out every slot below the healthy fill line, tags it with
                its address, and sorts most-empty first. That&apos;s the actual
                job &mdash; not &quot;here&apos;s the whole planogram,&quot; but
                &quot;go to A2, then B1, then C4, in that order.&quot; I kept it
                to addressing and a refill list rather than drag-and-drop
                rearranging. Drag-and-drop is a lot of surface area for a demo,
                it&apos;s fiddly to test, and it doesn&apos;t answer the question
                the operator actually has, which is where things are and what
                needs topping up.
              </p>

              <h3 className="mt-5 mb-2 text-[15px] font-semibold text-foreground">
                Sales history
              </h3>
              <p className="text-muted">
                New Sales tab, backed by a seeded sales store and a{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  GET /api/operator/stores/[storeId]/sales
                </code>{" "}
                route, fetched by a{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  useOperatorSales
                </code>{" "}
                hook on the same 60-second polling tier as inventory &mdash;
                sales drain stock, so they move at roughly the same cadence. The
                display numbers are all pure functions over the sales list:{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  summarizeSales
                </code>{" "}
                for the headline totals,{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  topSellingProducts
                </code>{" "}
                for the per-product rollup ordered by revenue, and{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  salesByDay
                </code>{" "}
                for a last-7-days revenue trend. Keeping them pure means they
                test without a component in sight, and the tab is just a thin
                view over their output.
              </p>

              <h3 className="mt-5 mb-2 text-[15px] font-semibold text-foreground">
                Tax calculator: Canada, by province
              </h3>
              <p className="text-muted">
                This is the piece with real domain logic. Operators are assumed
                to be in Canada for now, so a store gained a{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  province
                </code>{" "}
                field and the tax lib carries a table of GST/HST/PST rates for
                all thirteen provinces and territories. Three regimes: HST
                provinces charge one combined rate (Ontario 13%, the Maritimes
                15%, Nova Scotia&apos;s reduced 14%), GST-only jurisdictions
                charge the flat 5% federal rate, and GST+PST provinces stack the
                5% on a provincial rate &mdash; including Quebec, whose QST of
                9.975% sits in the provincial slot.
              </p>
              <p className="mt-3 text-muted">
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  computeTax(subtotal, province)
                </code>{" "}
                rounds each component to the cent independently and then sums
                them, which is how a real invoice itemizes tax &mdash; you
                don&apos;t round the total, you round each line. And{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  buildTaxHistory
                </code>{" "}
                rolls the sales into per-month remittance rows, newest first, so
                there&apos;s a record to file against. On top of that,{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  summarizeRemittance
                </code>{" "}
                totals what&apos;s actually owed and splits it into the federal
                portion (GST/HST, off to the CRA) and the provincial portion
                (PST/QST), which is the number the operator really wants: how
                much do I owe, and to whom.
              </p>
              <p className="mt-3 text-muted">
                The decision I&apos;m happiest with here: the tax is derived from
                the sales data, not stored in its own ledger. The sales are the
                source of truth; a second tax store would just be a copy that can
                fall out of sync. Recomputing from the sales every time is cheap
                at this scale and there&apos;s nothing to drift. The rates are
                the one thing that genuinely lives outside the sales &mdash;
                they&apos;re a small table, and if a province changes a rate
                that&apos;s a one-line edit in{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  operator-tax.ts
                </code>
                .
              </p>
              <p className="mt-3 text-muted">
                Same tradeoffs as the original still apply. The rate table is a
                point-in-time snapshot, not a live tax service, so a real
                deployment would want dated rate schedules and probably a
                proper accounting integration rather than a demo remittance
                table. But for showing the shape of the thing &mdash; the
                province regimes, the itemized breakdown, the monthly history
                &mdash; a pure lib over seeded sales is exactly enough.
              </p>
            </section>

      <section
              id="update-2026-07-31-planogram"
              className="scroll-mt-24 rounded-xl border border-primary-400/40 bg-primary-500/5 p-5"
            >
              <p className="text-xs font-semibold uppercase tracking-wider text-primary-600 dark:text-primary-400">
                Update &mdash; July 31, 2026 (later the same day)
              </p>
              <h2 className="mt-1 mb-3 text-lg font-bold">
                Making the planogram do something
              </h2>
              <p className="text-muted">
                The addresses and the refill run were a good start, but the
                planogram was still something you only looked at. Two things it
                should let you actually do: rearrange where products sit, and
                deal with a slot whose sensor has drifted. So I made it
                interactive.
              </p>

              <h3 className="mt-5 mb-2 text-[15px] font-semibold text-foreground">
                Rearranging, and why it had to persist
              </h3>
              <p className="text-muted">
                The catch with an editable planogram is the 60-second inventory
                poll. If a rearrange only lived in component state, the next poll
                would wipe it out and the shelf would snap back. So the layout
                got its own persisted store &mdash; an ordered list of slots,
                each with a sensor flag &mdash; behind{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  GET
                </code>{" "}
                and{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  PATCH /api/operator/stores/[storeId]/planogram
                </code>
                . A move optimistically reorders the cached slots so the shelf
                shifts the instant you act, then the PATCH commits it and a
                rollback restores order if the request fails &mdash; the same
                optimistic pattern the restock and dismiss actions already use.
              </p>
              <p className="mt-3 text-muted">
                The reordering itself is a pure function,{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  moveSlot(order, from, to)
                </code>
                , and the render-ready grid comes from{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  assemblePlanogram
                </code>
                , which joins the persisted slot order and sensor flags with the
                live inventory. Both are unit-tested with no component in sight,
                which is exactly why I keep the moving parts out of the UI.
              </p>

              <h3 className="mt-5 mb-2 text-[15px] font-semibold text-foreground">
                Keyboard first, drag second
              </h3>
              <p className="text-muted">
                Drag-and-drop is the obvious way to rearrange a grid, but
                drag-only isn&apos;t accessible &mdash; you can&apos;t tab and
                drop. So the primary control on each slot is a pair of arrow
                buttons with real labels (&quot;Move Cola to the next slot&quot;),
                fully keyboard-operable, and native HTML5 drag is layered on top
                as a mouse convenience that calls the same reorder path. The
                buttons are also what the tests drive, so the behavior I ship is
                the behavior that&apos;s covered.
              </p>

              <h3 className="mt-5 mb-2 text-[15px] font-semibold text-foreground">
                Doing something about a sensor mismatch
              </h3>
              <p className="text-muted">
                A slot can read as a &quot;mismatch&quot; &mdash; the sensor
                thinks something other than the planned product is there. Before,
                that was just an amber badge with no way to resolve it. Now a
                mismatched slot shows a Re-sync button that clears the flag
                (optimistically, then persisted). Because the sensor state lives
                on the persisted slot rather than being recomputed from the item
                id on every render, a re-sync actually sticks.
              </p>
            </section>

      <section
              id="update-2026-07-31-analytics"
              className="scroll-mt-24 rounded-xl border border-primary-400/40 bg-primary-500/5 p-5"
            >
              <p className="text-xs font-semibold uppercase tracking-wider text-primary-600 dark:text-primary-400">
                Update &mdash; July 31, 2026 (later still)
              </p>
              <h2 className="mt-1 mb-3 text-lg font-bold">
                Sales analytics: ranges, and the whole fleet
              </h2>
              <p className="text-muted">
                The Sales tab showed a single &quot;last 7 days&quot; trend, which
                is fine for a glance but useless for spotting a monthly pattern or
                a year-over-year trend. And it was per-store only &mdash; there
                was no way to ask &quot;how is the whole fleet doing.&quot; So two
                things: range views, and a fleet rollup.
              </p>

              <h3 className="mt-5 mb-2 text-[15px] font-semibold text-foreground">
                One bucketing function, four ranges
              </h3>
              <p className="text-muted">
                The trend is now driven by{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  salesByPeriod(sales, granularity, now)
                </code>
                , which builds a fixed set of windows &mdash; 7 days, 8 weeks, 12
                months, or 5 years &mdash; ending at now, then drops each sale
                into its window. A Day/Week/Month/Year toggle on the Sales tab
                just changes the granularity argument; the re-bucketing is
                client-side over the sales already in cache, so switching ranges
                is instant and makes no request. Month and year use real calendar
                boundaries (UTC), day and week use fixed-width windows &mdash;
                same idea, and it takes an injectable{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  now
                </code>{" "}
                so every bucket boundary is testable without mocking the clock.
              </p>

              <h3 className="mt-5 mb-2 text-[15px] font-semibold text-foreground">
                The fleet rollup, aggregated server-side
              </h3>
              <p className="text-muted">
                &quot;Per whole fleet&quot; is where the request count matters. I
                could have fetched every store&apos;s sales and summed them in the
                browser, but that&apos;s N requests that grow with the fleet
                &mdash; the exact fan-out I killed on the dashboard the first time
                around. So the fleet analytics aggregate server-side:{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  GET /api/operator/sales-analytics?granularity=…
                </code>{" "}
                runs{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  aggregateFleetSales
                </code>{" "}
                over every store and returns shared time buckets, a per-store
                revenue ranking, and the fleet total in one response. The
                dashboard&apos;s &quot;Fleet sales&quot; section reads it through
                a hook keyed by granularity, so each range caches on its own.
              </p>

              <h3 className="mt-5 mb-2 text-[15px] font-semibold text-foreground">
                Counting the calls
              </h3>
              <p className="text-muted">
                The whole point here is efficiency, so it&apos;s worth being
                explicit about the request budget. Fleet analytics is{" "}
                <strong className="text-foreground">one request</strong>{" "}
                regardless of fleet size &mdash; the server does the fan-in, not
                the browser. The naive version (fetch every store&apos;s sales
                and sum in the client) is one request per store, so at 30 stores
                that&apos;s 30 requests versus 1. Switching the range on the
                per-store tab is{" "}
                <strong className="text-foreground">zero requests</strong>: the
                sales are already in cache and{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  salesByPeriod
                </code>{" "}
                re-buckets them in memory. Each granularity caches under its own
                query key, so flipping back to a range you&apos;ve already seen
                is instant and makes no call either. It&apos;s the same instinct
                as the rest of the dashboard: the fleet overview already
                collapsed a 2N+1 per-poll fan-out into a single{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  fleet-summary
                </code>{" "}
                request, the tiered polling only asks as often as each data type
                actually changes, and operator actions update optimistically so a
                click never blocks on a round-trip. Fewer calls, and the ones we
                make do more.
              </p>
              <p className="mt-3 text-muted">
                One demo-data note: the seed used to scatter sales across the last
                week, which made the month and year views basically empty. I
                widened it to spread about eighteen months of history per store,
                so every range actually has bars to show. It&apos;s still seeded
                mock data &mdash; the point is the shape of the analytics, not the
                numbers.
              </p>
            </section>

      <section
              id="update-2026-07-31-boxes"
              className="scroll-mt-24 rounded-xl border border-primary-400/40 bg-primary-500/5 p-5"
            >
              <p className="text-xs font-semibold uppercase tracking-wider text-primary-600 dark:text-primary-400">
                Update &mdash; July 31, 2026 (last one today)
              </p>
              <h2 className="mt-1 mb-3 text-lg font-bold">
                Planogram boxes: somewhere to put things
              </h2>
              <p className="text-muted">
                The interactive planogram let you rearrange products, but there
                was a gap I glossed over: the shelf was a dense list of occupied
                slots, so &quot;moving&quot; a product could only reorder or swap
                things that were already placed. There was nowhere{" "}
                <em>empty</em> to put anything. A real shelf has empty spots. So
                the model changed.
              </p>

              <h3 className="mt-5 mb-2 text-[15px] font-semibold text-foreground">
                A box can be empty
              </h3>
              <p className="text-muted">
                A planogram box is now{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  {"{ itemId, sensorMatch }"}
                </code>{" "}
                where a null{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  itemId
                </code>{" "}
                means the box is empty. Each shelf is seeded with the store&apos;s
                products plus a spare empty shelf, so there&apos;s room to move
                things around. The move itself is one pure function,{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  moveToBox(boxes, from, to)
                </code>
                : drop into an empty box and the source is vacated; drop onto an
                occupied box and the two swap. Nulls make{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  assemblePlanogram
                </code>{" "}
                render an empty box as a labelled drop target instead of skipping
                it, so every position keeps its address whether it&apos;s full or
                not.
              </p>

              <h3 className="mt-5 mb-2 text-[15px] font-semibold text-foreground">
                What it costs in calls
              </h3>
              <p className="text-muted">
                Worth being honest about the request pattern here too, since
                that&apos;s a theme across this whole feature. A move is{" "}
                <strong className="text-foreground">one</strong>{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  PATCH
                </code>
                , and it&apos;s optimistic: the client computes the new box
                layout with{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  moveToBox
                </code>
                , writes it straight into the query cache so the shelf moves on
                the same frame, then sends it. The layout is persisted
                server-side, so it survives the 60-second poll instead of
                snapping back &mdash; but nothing about the interaction blocks on
                the network. It&apos;s the same rule the rest of the dashboard
                follows: read paths are pooled into as few requests as possible
                (one fleet-summary, one sales-analytics), write paths update
                optimistically and reconcile in the background, and the poll
                cadence matches how fast each kind of data actually changes.
                Fewer round-trips, and the UI never waits on one.
              </p>
            </section>

      <section
              id="update-2026-08-01-backend"
              className="scroll-mt-24 rounded-xl border border-primary-400/40 bg-primary-500/5 p-5"
            >
              <p className="text-xs font-semibold uppercase tracking-wider text-primary-600 dark:text-primary-400">
                Update &mdash; August 1, 2026
              </p>
              <h2 className="mt-1 mb-3 text-lg font-bold">
                Making it real: wiring the dashboard to a database
              </h2>
              <p className="text-muted">
                Everything so far ran on an in-memory store &mdash; seeded
                factory data that resets on restart. Great for a demo, but it was
                never real. So I moved the operator data into{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  portfolio_api
                </code>{" "}
                (the same Node/Express/Postgres backend the rest of the site
                uses) &mdash; real tables for stores, inventory, alerts, activity,
                sales, and the planogram &mdash; and rewired the dashboard to
                read and write it.
              </p>

              <h3 className="mt-5 mb-2 text-[15px] font-semibold text-foreground">
                A BFF that falls back
              </h3>
              <p className="text-muted">
                Every{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  /api/operator/*
                </code>{" "}
                route is now a thin proxy over the live service, the same shape
                as the feature-flags console:{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  operator-client.ts
                </code>{" "}
                makes the validated HTTP calls and{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  operator-bff.ts
                </code>{" "}
                prefers the API but falls back to the in-memory seed when the
                backend is unreachable. So the demo still works, and looks
                identical, whether or not the API is running &mdash; and if you
                do run it, you get real persistence. The client validates every
                response against the same Zod schemas the UI already uses, so a
                drifting API surfaces as a clear error instead of quietly bad
                state.
              </p>

              <h3 className="mt-5 mb-2 text-[15px] font-semibold text-foreground">
                Aggregate in the database, not the app
              </h3>
              <p className="text-muted">
                This is where the earlier &quot;fewer calls&quot; instinct pays
                off for real. The fleet-summary and sales-analytics endpoints
                used to loop the in-memory data in JS; now they are grouped SQL
                on the server &mdash; one{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  GROUP BY
                </code>{" "}
                per axis (per store, per time bucket) instead of pulling every
                alert and sale row across the wire to sum them here. The browser
                still makes one request per view; the database does the fan-in.
                The backend even logs the aggregation time, so the win is
                something you can actually measure rather than just assert.
              </p>
              <p className="mt-3 text-muted">
                One small contract change fell out of it: a list read for a store
                that doesn&apos;t exist now returns an empty list, not a 404. The
                in-memory version 404&apos;d because the store simply wasn&apos;t
                in the map; a real list endpoint has no reason to &mdash; &quot;no
                rows&quot; is a fine answer. The store-detail read still 404s,
                because asking for a store that isn&apos;t there is a real
                not-found.
              </p>
            </section>

      <section
              id="update-2026-08-02-alerts"
              className="scroll-mt-24 rounded-xl border border-primary-400/40 bg-primary-500/5 p-5"
            >
              <p className="text-xs font-semibold uppercase tracking-wider text-primary-600 dark:text-primary-400">
                Update &mdash; August 2, 2026
              </p>
              <h2 className="mt-1 mb-3 text-lg font-bold">
                Alert history, analytics, and keeping the demo honest
              </h2>
              <p className="text-muted">
                Going live surfaced a few things worth fixing, and one feature
                worth adding.
              </p>

              <h3 className="mt-5 mb-2 text-[15px] font-semibold text-foreground">
                The &quot;always offline&quot; bug
              </h3>
              <p className="text-muted">
                As soon as the dashboard read from the database, every store went
                &quot;offline.&quot; A store&apos;s{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  lastPing
                </code>{" "}
                is sensor telemetry &mdash; a real device reports it continuously
                &mdash; but the seed writes it once, so it aged past the 10-minute
                offline threshold and stuck there, with nothing the operator could
                do. The in-memory demo had quietly recomputed a fresh ping on
                every read; the DB path lost that. The fix puts it back where the
                data lives: the backend synthesizes a recent ping per read from
                the store&apos;s status (online reads strong, degraded reads
                stale), so the freshness tiers still mean something. I audited the
                rest of the read path too &mdash;{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  lastPing
                </code>{" "}
                was the only value ever freshened on read, so it was the only
                place with the bug.
              </p>

              <h3 className="mt-5 mb-2 text-[15px] font-semibold text-foreground">
                A scheduled re-seed, and saying so
              </h3>
              <p className="text-muted">
                Static seed data has a subtler version of the same problem: the
                historical timestamps don&apos;t move, so now-relative windows
                (the 24-hour alert trend, the day/week sales ranges) slowly empty
                out. Rather than fake those on read, a cron job re-seeds the whole
                fleet on a schedule &mdash; the same pattern the feature-flags demo
                uses to restore itself. The CLI seed and the job now share one{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  seedOperator()
                </code>{" "}
                so they can&apos;t drift. And because a periodic reset would be
                confusing if it just happened, the dashboard now says so up front:
                your changes are saved for real, but reset periodically to keep
                the demo fresh.
              </p>

              <h3 className="mt-5 mb-2 text-[15px] font-semibold text-foreground">
                Alert history and analytics
              </h3>
              <p className="text-muted">
                Dismissing an alert used to feel like deleting it. But the backend
                keeps every alert &mdash; the{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  acknowledged
                </code>{" "}
                flag just hides resolved ones from the active list &mdash; so the
                history was already there, unused. The Alerts tab now has an
                overview (active vs resolved, a severity split, the most common
                categories, a 7-day trend) and an Active / Resolved toggle so an
                operator can look back at what was dismissed. It&apos;s all
                derived client-side with two pure helpers,{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  summarizeAlerts
                </code>{" "}
                and{" "}
                <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
                  alertsByDay
                </code>
                , from the alerts already fetched &mdash; no new request. The
                cross-store version (fleet-wide alert analytics from a grouped SQL
                query) is the natural next step if it&apos;s useful.
              </p>
            </section>

    </ThoughtLayout>
  );
}
