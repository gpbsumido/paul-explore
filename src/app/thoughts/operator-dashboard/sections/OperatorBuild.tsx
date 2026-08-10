/** The original build write-up: why it exists, polling, freshness, architecture, self-review. */
export function OperatorBuild() {
  return (
    <>
      <section
        id="the-timeline"
        className="scroll-mt-24 rounded-xl border border-border bg-surface p-5"
      >
        <h2 className="text-sm font-semibold text-foreground">
          Below: the dev-thoughts timeline, in order
        </h2>
        <p className="mt-1 text-xs text-muted">
          It reads in two parts. First the original build write-up &mdash; why
          the thing exists, how it was put together, and what I already knew was
          weak when it shipped. Then every dated update since, newest first,
          each one a thing I changed my mind about or got wrong. The jump list
          at the top of the page goes straight to any of them.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-bold">Why this exists</h2>
        <p className="text-muted">
          The operator dashboard is a demo of what a real-time fleet management
          tool looks like for smart vending machines, lobby fridges, and
          micro-retail kiosks. The kind of thing where an operator manages 20-50
          physical locations and needs to know at a glance which ones need
          attention — low stock, sensor offline, temperature alert, door left
          open.
        </p>
        <p className="mt-3 text-muted">
          It&apos;s not connected to real hardware. The data layer uses
          in-memory mock stores seeded from factory functions, with realistic
          product catalogs, sensor readings, and alert histories. The
          interesting part isn&apos;t the data — it&apos;s how the UI handles
          real-time updates, stale data, and operator actions without feeling
          sluggish.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-bold">Tiered polling</h2>
        <p className="text-muted">
          Not all data changes at the same rate, so not all data should poll at
          the same interval. The dashboard uses three tiers:
        </p>
        <ul className="mt-3 list-disc pl-5 text-muted space-y-1">
          <li>
            <strong className="text-foreground">Alerts</strong> poll every 15
            seconds — a critical sensor going offline is the most urgent signal
            and the operator needs to see it fast.
          </li>
          <li>
            <strong className="text-foreground">Store list</strong> polls every
            30 seconds — store status (online, degraded, offline) changes less
            often but still matters for the fleet overview.
          </li>
          <li>
            <strong className="text-foreground">Inventory</strong> polls every
            60 seconds — stock levels change when someone buys something, which
            is frequent enough to matter but not so urgent that 15-second
            updates are worth the network cost.
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
          — an operator who tabs back to the dashboard after five minutes should
          see fresh data immediately, not stale numbers from the last poll
          cycle.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-bold">
          Optimistic updates for operator actions
        </h2>
        <p className="text-muted">
          When an operator clicks &quot;Mark Restocked&quot; on a low-stock
          item, the stock bar fills immediately. When they dismiss an alert, it
          vanishes from the list. The UI doesn&apos;t wait for the server
          round-trip.
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
          cancels in-flight queries for the affected store, snapshots the cache,
          and applies the change immediately.{" "}
          <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
            onError
          </code>{" "}
          restores the snapshot. The user sees the change before the request
          completes, and if it fails, the UI rolls back cleanly.
        </p>
        <p className="mt-3 text-muted">
          The bulk actions (&quot;Mark All Restocked&quot; and &quot;Acknowledge
          All Alerts&quot;) show a confirmation modal before executing, since
          they affect multiple records. A single misclick shouldn&apos;t dismiss
          twenty alerts.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-bold">
          Sort by severity, not alphabetically
        </h2>
        <p className="text-muted">
          The fleet overview sorts stores worst-first: offline stores at the
          top, then degraded stores with active alerts, then degraded without
          alerts, then healthy stores at the bottom. Within each tier, stores
          sort by name for stability.
        </p>
        <p className="mt-3 text-muted">
          This is a deliberate UX choice. An alphabetically sorted grid means
          the store that needs the most attention might be halfway down the
          page. Severity-first sorting puts the fires at the top of the screen —
          the operator opens the dashboard and immediately sees what needs
          action without scanning.
        </p>
        <p className="mt-3 text-muted">
          Store cards also use visual signals: a red left-border accent for
          critical items in the inventory, amber border for stale sensor data,
          and color-coded status badges (green for online, amber for degraded,
          red for offline).
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-bold">Data freshness system</h2>
        <p className="text-muted">
          In a real deployment, sensor data can go stale. A fridge might lose
          WiFi, a temperature probe might die, a payment terminal might stop
          reporting. The operator needs to know not just &quot;what is the
          temperature?&quot; but &quot;how old is this reading?&quot;
        </p>
        <p className="mt-3 text-muted">
          The freshness system uses three tiers with deterministic thresholds:
        </p>
        <ul className="mt-3 list-disc pl-5 text-muted space-y-1">
          <li>
            <strong className="text-foreground">Fresh</strong> (under 2 minutes)
            — green text with pulsing dot. Data is current.
          </li>
          <li>
            <strong className="text-foreground">Stale</strong> (2-10 minutes) —
            amber text. The operator should be aware this data might be lagging.
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
          indicator shows signal bars (strong, weak, poor, offline) based on the
          same thresholds. When sensors haven&apos;t reported in 30+ minutes, a{" "}
          <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
            SensorOfflineCallout
          </code>{" "}
          banner appears on the inventory tab with the offline duration and last
          known reading.
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
          A collapsible analytics section sits between the stats bar and the
          store grid. Three Recharts visualizations: a donut chart showing fleet
          health distribution (online/degraded/offline), an area chart bucketing
          alerts into 24 one-hour slots to show whether frequency is rising or
          falling, and a horizontal bar chart comparing per-store inventory
          health percentages.
        </p>
        <p className="mt-3 text-muted">
          The section defaults to collapsed and persists collapse state in
          localStorage. Operators who prefer the compact view don&apos;t
          re-collapse every visit. The data transforms are pure functions in
          their own module — status counting, hourly alert bucketing with a 24h
          cutoff, and per-store health averaging with zero-capacity safety.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-bold">Store detail tabs</h2>
        <p className="text-muted">
          Each store has four tabs: Inventory, Alerts, Activity, and Planogram.
          The active tab is synced to a{" "}
          <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
            ?tab=
          </code>{" "}
          URL search param so it survives refresh and back/forward navigation.
        </p>
        <ul className="mt-3 list-disc pl-5 text-muted space-y-1">
          <li>
            <strong className="text-foreground">Inventory</strong> — stock bars,
            fill percentages, 7-day trend sparklines, per-item restock. Critical
            items get a red left-border accent.
          </li>
          <li>
            <strong className="text-foreground">Alerts</strong> — sorted
            severity-first (critical, warning, info) with category icons,
            severity badges, timestamps, and per-alert dismiss. Filter pills
            narrow by severity level.
          </li>
          <li>
            <strong className="text-foreground">Activity</strong> —
            chronological feed of recent events (restocks, maintenance, alert
            dismissals, status changes) with type-coded icons and actor emails.
          </li>
          <li>
            <strong className="text-foreground">Planogram</strong> — CSS grid
            representing store shelves with stock level dots, fill percentages,
            and sensor match status. Mismatched slots highlight with an amber
            border.
          </li>
        </ul>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-bold">Toast notifications</h2>
        <p className="text-muted">
          Quick actions (bulk restock, bulk dismiss, force refresh) show toast
          notifications on completion. The toast system is framework-agnostic —
          a{" "}
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
          This pattern keeps the toast state fully testable without rendering
          any React components — the store is a plain function call that can be
          tested with timers and subscriber assertions.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-bold">Architecture</h2>
        <p className="text-muted">
          The data layer follows the same BFF pattern as the rest of the app:
          Next.js API routes serve as the proxy layer, and the operator routes
          use an in-memory data store seeded from factory functions instead of a
          real backend. This means the dashboard works without any external
          dependencies — no database, no backend service, just the Next.js dev
          server.
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
          for chart data shaping. Every function is pure, takes explicit inputs,
          and returns new values — no side effects, no internal state.
        </p>
        <p className="mt-3 text-muted">
          One thing that surprised us: Next.js bundles each route handler
          independently, so a plain module-level variable in{" "}
          <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
            operator-data.ts
          </code>{" "}
          ended up as a separate instance per route. The dismiss route updated
          its copy of the alerts map, but the alerts GET route read from a
          different copy where nothing had changed. The fix was to attach the
          data store to{" "}
          <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
            globalThis
          </code>{" "}
          behind a singleton accessor — the same pattern the Next.js docs
          recommend for Prisma clients in development mode. Every route handler
          now shares the same maps regardless of bundling.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-bold">The self-review</h2>
        <p className="text-muted">
          After the feature was fully built and working, I went back through it
          the way I&apos;d review someone else&apos;s PR. Not looking for
          &quot;does it work&quot; — the tests answer that. Looking for
          &quot;what will bite us in six months.&quot; I audited in order of
          severity: correctness bugs first, then performance, then UX gaps, then
          code quality, then test coverage.
        </p>

        <h3 className="mt-5 mb-2 text-[15px] font-semibold text-foreground">
          Correctness
        </h3>
        <p className="text-muted">
          The in-memory data layer was mutating objects directly —{" "}
          <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
            alert.acknowledged = true
          </code>{" "}
          instead of returning a new object. Not a visible bug in demo mode, but
          in production React&apos;s diffing relies on reference identity. If
          the object reference doesn&apos;t change, React doesn&apos;t
          re-render, and the UI gets out of sync with the data. Fixed by
          returning new objects from every mutation.
        </p>
        <p className="mt-3 text-muted">
          The dismiss button had shared loading state across all alert rows.
          Dismissing one alert disabled the button on every alert in the list.
          Fixed by tracking in-flight alert IDs in a Set so each row manages its
          own state independently.
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
          parameter. Every other freshness function in the codebase already took
          an injectable time value for deterministic testing. These two were the
          inconsistent ones. Fixed to match the pattern.
        </p>
        <p className="mt-3 text-muted">
          A subtler one: the factory generated{" "}
          <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
            lastPing
          </code>{" "}
          timestamps 0-2 hours in the past at module load time, but the
          connection quality thresholds mark anything over 10 minutes as
          offline. So every store drifted into &quot;Offline&quot; signal and
          triggered sensor offline callouts as the dev server ran. Fixed by
          recomputing{" "}
          <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
            lastPing
          </code>{" "}
          relative to{" "}
          <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
            Date.now()
          </code>{" "}
          on every read from the store accessors, so demo data never goes stale
          regardless of how long the server has been running.
        </p>
        <p className="mt-3 text-muted">
          The trickiest one: dismissing an alert would vanish it momentarily
          (the optimistic update worked) then it would pop right back on the
          next poll. The dismiss PATCH route and the alerts GET route each got
          their own instance of{" "}
          <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
            operator-data.ts
          </code>{" "}
          because Next.js bundles route handlers independently. So the dismiss
          mutated one copy of the in-memory map while the poll read from a
          separate copy where the alert was never dismissed. Fixed by attaching
          the data store to{" "}
          <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
            globalThis
          </code>{" "}
          behind a singleton accessor — the same pattern Next.js docs recommend
          for Prisma clients in dev mode.
        </p>

        <h3 className="mt-5 mb-2 text-[15px] font-semibold text-foreground">
          Performance
        </h3>
        <p className="text-muted">
          The fleet overview was making 2N+1 parallel requests per poll cycle —
          one alert query and one inventory query per store, plus the store
          list. At 6 stores that&apos;s 13 requests. At 30 stores it&apos;s 61.
          The{" "}
          <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
            useMemo
          </code>{" "}
          that aggregated query results had unstable dependencies — the query
          result arrays got new references on every render — so the memo ran
          every render anyway.
        </p>
        <p className="mt-3 text-muted">
          Replaced the entire fan-out with a single{" "}
          <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
            /api/operator/fleet-summary
          </code>{" "}
          endpoint that returns aggregated alert counts, inventory health, and
          fleet stats per store in one request. The dashboard went from N
          parallel queries to 1. Chart transforms that were recomputing on every
          render got wrapped in{" "}
          <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
            useMemo
          </code>{" "}
          with stable dependencies.
        </p>

        <h3 className="mt-5 mb-2 text-[15px] font-semibold text-foreground">
          UX gaps
        </h3>
        <p className="text-muted">
          When the stores fetch failed, the error state was a dead end — no
          retry button, no way to recover without reloading the page. Individual
          store sub-query failures were completely silent; the store card just
          showed zero alerts. Empty search results didn&apos;t suggest clearing
          filters. The restock button had no per-item feedback — all rows showed
          &quot;Restocking...&quot; at once and there was no success indicator
          after completion.
        </p>
        <p className="mt-3 text-muted">
          Each of these is the kind of thing that works fine in a demo but would
          frustrate a real operator. Added retry buttons on error states,
          per-store error indicators on cards, &quot;clear filters&quot; in
          empty states, and per-item restock feedback with a brief success
          checkmark after completion. Also added the analytics expand/collapse
          animation that was missing.
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
          was flattening an alert map that the parent already had in flat form.
          None of these were bugs, but each one makes the next developer slower.
          Extracted shared components, unified configs, pushed transforms to
          where the data naturally lives.
        </p>

        <h3 className="mt-5 mb-2 text-[15px] font-semibold text-foreground">
          Testing
        </h3>
        <p className="text-muted">
          The original test suite covered utility functions well but had gaps at
          the integration level. No test for the fleet overview rendering with
          real data and verifying sort order. No tests for error or empty states
          in tab components. No test for the{" "}
          <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
            RefreshBar
          </code>{" "}
          reading from the query cache. The restock rollback test only asserted
          the final state — a mutant that removed the optimistic update entirely
          would still pass because the stock level never changed from its
          original value.
        </p>
        <p className="mt-3 text-muted">
          Backfilled all four gaps. The rollback test was the interesting one —
          it now verifies the optimistic update fires first (stock jumps to
          capacity) and then verifies it reverts after the 500 response.
          That&apos;s the difference between &quot;the final state is
          correct&quot; and &quot;the rollback mechanism actually works.&quot;
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-bold">What we&apos;d improve</h2>
        <p className="text-muted">
          The dashboard works well as a demo, but there are real things that
          would matter if this were serving actual operators managing actual
          stores.
        </p>

        <h3 className="mt-5 mb-2 text-[15px] font-semibold text-foreground">
          WebSocket or SSE instead of polling
        </h3>
        <p className="text-muted">
          Polling at 15-second intervals means a critical alert could sit for up
          to 14 seconds before the operator sees it. For a real deployment, a
          WebSocket connection or Server-Sent Events stream would push alerts
          the moment they fire. The current polling architecture is a pragmatic
          starting point — it works with any HTTP backend and doesn&apos;t
          require connection management — but the latency ceiling matters when a
          fridge temperature is climbing fast.
        </p>

        <h3 className="mt-5 mb-2 text-[15px] font-semibold text-foreground">
          Push notifications
        </h3>
        <p className="text-muted">
          An operator managing 40 stores is not sitting on the dashboard all
          day. Critical alerts need to reach them on their phone. A notification
          layer (push notifications, Slack/Teams integration, SMS for urgent
          failures) would close the loop between &quot;something went
          wrong&quot; and &quot;someone knows about it.&quot; Right now the
          dashboard only works if the operator is looking at it.
        </p>

        <h3 className="mt-5 mb-2 text-[15px] font-semibold text-foreground">
          Historical trends and anomaly detection
        </h3>
        <p className="text-muted">
          The inventory sparklines show 7 days of simulated history, but real
          historical data could power anomaly detection — flagging a fridge
          that&apos;s selling 3x faster than usual (likely needs an early
          restock) or a store whose sensor readings are drifting (might need
          calibration). The alert trend chart is a start, but with real data you
          could build baselines and surface deviations automatically.
        </p>

        <h3 className="mt-5 mb-2 text-[15px] font-semibold text-foreground">
          Role-based access and multi-tenant support
        </h3>
        <p className="text-muted">
          Currently there&apos;s no auth on the operator routes. A production
          version would need operator accounts, role-based permissions (fleet
          manager vs. field technician vs. read-only viewer), and multi-tenant
          isolation so each operator only sees their own stores. The Auth0
          integration from the rest of the app could extend here with custom
          claims for operator roles.
        </p>

        <h3 className="mt-5 mb-2 text-[15px] font-semibold text-foreground">
          Mobile-first field technician view
        </h3>
        <p className="text-muted">
          The person restocking a fridge is on their phone, not a laptop. A
          dedicated mobile view optimized for the field workflow — scan barcode,
          confirm restock, acknowledge alert, move to next store — would be a
          different UI from the desktop fleet overview. The current responsive
          layout adapts to mobile but it&apos;s still a desktop-first design. A
          truly mobile-first version for field techs would prioritize
          single-store actions over fleet comparisons.
        </p>

        <h3 className="mt-5 mb-2 text-[15px] font-semibold text-foreground">
          Map view
        </h3>
        <p className="text-muted">
          When stores have physical locations, a map overlay with color-coded
          pins (green for healthy, red for critical) would give operators
          spatial context. A cluster of degraded stores in one building might
          indicate a shared infrastructure issue (power outage, network switch
          down) rather than individual sensor failures.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-bold">Tradeoffs</h2>
        <p className="text-muted">
          The in-memory data store means every server restart seeds fresh data.
          This is fine for a demo but means you can&apos;t test long-running
          scenarios or cross-session state. The tradeoff was intentional —
          wiring up a real database for demo data would have added deployment
          complexity without adding much to the frontend story. One gotcha that
          came up: static{" "}
          <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
            lastPing
          </code>{" "}
          timestamps generated at module load time drifted past the freshness
          thresholds as the server ran, making every store show
          &quot;Offline.&quot; The fix was to recompute timestamps relative to
          now on every read, so the demo data stays realistic regardless of
          server uptime.
        </p>
        <p className="mt-3 text-muted">
          Two tradeoffs from the initial build have since been resolved. The
          per-store fan-out pattern (N parallel queries for alerts and
          inventory) was replaced by a single{" "}
          <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
            /api/operator/fleet-summary
          </code>{" "}
          endpoint that returns aggregated data in one request. The chart
          transforms that recomputed on every render are now memoized with
          stable dependencies. Both were acceptable at demo scale but would have
          been real problems at fleet size, so fixing them early was the right
          call.
        </p>
      </section>
    </>
  );
}
