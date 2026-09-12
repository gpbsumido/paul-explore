import ThoughtLayout from "@/app/thoughts/ThoughtLayout";
import {
  Update,
  UpdateTimeline,
  WhatsNext,
} from "@/app/thoughts/_shared/ThoughtUpdates";
import RiskScoringDemo from "./RiskScoringDemo";

const code =
  "rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground";
const pre =
  "mt-3 overflow-x-auto rounded-lg bg-surface p-3 text-[13px] font-mono text-foreground";

export default function RiskScoringApiContent() {
  return (
    <ThoughtLayout
      breadcrumb="Risk-scoring API"
      title="Learning Go by building a risk-scoring API"
      intro={
        <>
          I&apos;m new to Go. I write TypeScript all day, and I&apos;ve learned
          the hard way that I don&apos;t absorb a language from tutorials — I
          need a project with real decisions in it. So I picked one where the
          domain would teach me something too: the thing a fraud or AML platform
          actually sells, a service that takes a payment transaction and hands
          back a risk score in milliseconds, with the reasons attached. This
          write-up is two sets of notes interleaved — the Go I learned and the
          risk-assessment concepts I learned — in the order the project taught
          me them. It&apos;s all standard library,{" "}
          <code className={code}>net/http</code> and no framework, partly
          because that&apos;s what every Go person told me to do and partly
          because I came to learn the language, not a framework&apos;s opinion
          of it.
        </>
      }
    >
      <UpdateTimeline
        entries={[
          {
            id: "update-2026-09-11-learner-lens",
            date: "Sep 11, 2026",
            title: "Rewritten as the beginner I actually am, plus a live demo",
          },
        ]}
      />

      <section>
        <h2 className="mb-3 text-lg font-bold">
          What a rule is, and what a Go interface is — learned in the same hour
        </h2>
        <p className="text-muted">
          First domain lesson: a risk engine doesn&apos;t detect fraud, it
          accumulates suspicion. A <em>rule</em> is one codified suspicion — a
          single question asked of every transaction, like &quot;is this amount
          unusually large?&quot; or &quot;have we seen this device before?&quot;
          No rule proves anything on its own; each is a weak signal, and the{" "}
          <em>weight</em> attached to it says how much you trust that signal
          relative to the others. The engine&apos;s job is to run all of them
          and add up what fired.
        </p>
        <p className="mt-3 text-muted">
          My TypeScript instinct was a base class, or a union type with a
          switch. Go&apos;s answer is a small interface — and Go interfaces are
          structural, which surprised me: a type implements{" "}
          <code className={code}>Rule</code> just by having these methods.
          There&apos;s no <code className={code}>implements</code> keyword, so
          the engine and the rules never have to know about each other.
        </p>
        <pre className={pre}>
          {`type Rule interface {
	ID() string
	Weight() int // score contribution when it fires
	Evaluate(ctx context.Context, txn model.Transaction) *model.RuleHit
}`}
        </pre>
        <p className="mt-3 text-muted">
          The <code className={code}>*model.RuleHit</code> return taught me
          another idiom: Go has no <code className={code}>Option</code> type, so
          a pointer doubles as one. A rule that fires returns a hit with a
          reason and its weight; a rule that doesn&apos;t returns{" "}
          <code className={code}>nil</code>. The engine walks the enabled rules,
          collects the hits, and hands them to the scorer — it never learns a
          rule&apos;s name, so adding the next rule is a new type and nothing
          else.
        </p>
        <pre className={pre}>
          {`func (e *Engine) Score(ctx, txn) model.Score {
	var hits []model.RuleHit
	for _, r := range e.rules {
		if !e.enabled[r.ID()] {
			continue
		}
		if hit := r.Evaluate(ctx, txn); hit != nil {
			hits = append(hits, *hit)
		}
	}
	return scoring.Score(txn.ID, hits)
}`}
        </pre>
        <p className="mt-3 text-muted">
          The four rules I shipped are the beginner set every fraud primer
          starts with: amount-over-threshold (weight 30), new-device for a user
          (20), country-differs-from-last-seen (25), and velocity — too many
          transactions from one device in a window (40). Enablement is a map the
          engine owns, so toggling a rule at runtime backs the{" "}
          <code className={code}>PUT /v1/rules/{"{id}"}</code> endpoint: turn
          the velocity rule off on a live service and watch the scores move.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-bold">
          Velocity is where the domain got stateful and Go made me say mutex
        </h2>
        <p className="text-muted">
          Second domain lesson: the highest-weight signals in fraud are about{" "}
          <em>behaviour over time</em>, not any single transaction. Velocity —
          one device firing many transactions in a short window — is the classic
          card-testing pattern, where someone validates a batch of stolen card
          numbers with rapid small charges. Three of my four rules are pure
          functions of one transaction. Velocity has to remember, so it keeps a
          per-device sliding window of timestamps: age out the old ones, record
          the new one, fire if the count crossed the limit.
        </p>
        <pre className={pre}>
          {`recent := r.seen[txn.DeviceID][:0]
for _, ts := range r.seen[txn.DeviceID] {
	if ts.After(cutoff) {
		recent = append(recent, ts)
	}
}
recent = append(recent, now)
r.seen[txn.DeviceID] = recent`}
        </pre>
        <p className="mt-3 text-muted">
          (That <code className={code}>[:0]</code> is a Go trick I had to look
          up: reslicing to zero length keeps the backing array, so filtering in
          place doesn&apos;t allocate.)
        </p>
        <p className="mt-3 text-muted">
          The Go lesson hiding in this rule is that concurrency isn&apos;t
          opt-in. Go&apos;s HTTP server runs every request in its own
          goroutine, so the moment a rule holds a map, that map is being read
          and written from many goroutines at once — which in Go is not
          &quot;probably fine&quot;, it&apos;s a data race. So the map is
          guarded by a mutex, and the clock is injected (a{" "}
          <code className={code}>now func() time.Time</code> field — no DI
          framework, just a function) so the sliding window is testable without
          sleeping. Then I found <code className={code}>go test -race</code>,
          which felt like cheating: a test fires the rule from a pack of
          goroutines and the runtime itself proves the locking holds.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-bold">
          A score is arithmetic; a band is your risk appetite written down
        </h2>
        <p className="text-muted">
          The scorer is the least Go-interesting code in the project and the
          most domain-interesting. Weighted additive scoring is the simplest
          model there is — sum the weights of the hits, clamp to 100 so a
          pile-up of rules can&apos;t overflow the scale — and it&apos;s what
          real platforms start with before anyone says machine learning,
          because you can explain it to an analyst and a regulator.
        </p>
        <pre className={pre}>
          {`total := 0
for _, h := range hits {
	total += h.Weight
}
if total > maxScore {
	total = maxScore
}
// band: green < 30, amber 30-69, red >= 70`}
        </pre>
        <p className="mt-3 text-muted">
          The band is where the number becomes a decision: green flows through,
          amber queues for human review, red gets blocked. And the thresholds
          are not a technical choice at all — they are the <em>risk appetite</em>{" "}
          of whoever runs the service. Slide the lines down and you block more
          fraud but generate more false positives, which means declining real
          customers; slide them up and good customers sail through alongside
          the fraud you missed. That trade-off is the entire business, which is
          why the thresholds live as named constants in one place — policy
          should be one edit, not a hunt through conditionals.
        </p>
        <p className="mt-3 text-muted">
          The other domain rule I picked up: never return a bare number. The
          score carries its hits, so a red transaction says <em>why</em>{" "}
          it&apos;s red — which rules fired, each with a reason string. An
          analyst can action that; a bare 85 they can only argue with.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-bold">
          Channels, and why a flag that arrives late is just a log line
        </h2>
        <p className="text-muted">
          Scoring in milliseconds only matters if the flag reaches a human or a
          downstream system while it can still stop something — a fraud alert
          an hour later is forensics, not prevention. So anything amber or red
          goes out live over server-sent events at{" "}
          <code className={code}>GET /v1/stream</code>, and building the SSE
          broker behind it is where I finally understood channels: a channel is
          how goroutines hand values to each other, and{" "}
          <code className={code}>select</code> with a{" "}
          <code className={code}>default</code> arm is how you refuse to wait.
        </p>
        <pre className={pre}>
          {`func (b *Broker) Publish(ev Event) {
	b.mu.Lock()
	defer b.mu.Unlock()
	for ch := range b.subs {
		select {
		case ch <- ev:
		default: // full buffer? skip, don't stall the stream
		}
	}
}`}
        </pre>
        <p className="mt-3 text-muted">
          That <code className={code}>default</code> arm encodes the one rule
          that keeps a monitoring feed honest: a publisher must never block. A
          subscriber whose buffer is full gets skipped, not waited on, so one
          slow consumer can&apos;t hold up the firehose for everyone else —
          liveness over completeness, which I&apos;d have gotten wrong without
          reading about the pattern first, because dropping events feels wrong
          until you realise stalling the stream is worse. Subscribe hands back
          the channel and an idempotent unsubscribe closure, so a client that
          disconnects cleans itself out of the fan-out exactly once.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-bold">
          The in-memory store is where interfaces clicked as seams
        </h2>
        <p className="text-muted">
          Persistence is an in-memory <code className={code}>Store</code> today,
          sitting behind an interface — and having just learned interfaces on
          the rules, I could see this is the same move one level up. The rules
          and handlers only know the interface, so a Postgres implementation
          (with <code className={code}>pgx</code>) drops in later without
          touching a line of scoring or HTTP. The thing most likely to change —
          where the data lives — is isolated so changing it is additive. In
          TypeScript I&apos;d have reached for the same shape with more
          ceremony; in Go it&apos;s the default way to hold a dependency.
        </p>
        <p className="mt-3 text-muted">
          To watch it behave under something like real traffic there&apos;s a{" "}
          <code className={code}>cmd/simulator</code> load CLI that fires
          synthetic transactions with a configurable fraud rate — bands
          shifting and the stream lighting up is the closest thing this project
          has to a demo. And the deploy story was my favourite Go surprise: the
          whole service compiles to one static binary, so the multi-stage{" "}
          <code className={code}>Dockerfile</code> is a few lines with nothing
          else in the image.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-bold">Score one yourself</h2>
        <p className="mb-3 text-muted">
          Reading about a scoring engine is one thing; feeding it a transaction
          is better. This form posts to the real Go service through a small
          proxy on this site (<code className={code}>/api/risk/transactions</code>
          ), so what comes back is the actual engine&apos;s answer: the score,
          the band, and every rule that fired with its reason. The defaults are
          tuned to trip the amount rule — drop the amount under 5000 and watch
          it go green. If the backend isn&apos;t deployed right now, the demo
          says so rather than pretending.
        </p>
        <RiskScoringDemo />
      </section>

      <Update
        id="update-2026-09-11-learner-lens"
        date="September 11, 2026"
        title="Rewritten as the beginner I actually am, plus a live demo"
      >
        <p>
          This page got two changes in one sitting: the whole write-up was
          recast from the voice of someone who already knew Go into the voice I
          actually wrote the code in — a Go beginner taking notes on the
          language and the fraud domain at once — and it grew the demo above,
          so the service can be poked instead of just described.
        </p>

        <h3 className="mt-5 mb-2 text-[15px] font-semibold text-foreground">
          The first draft was written by someone I&apos;m not yet
        </h3>
        <p className="text-muted">
          The original version read like a staff Go engineer explaining design
          decisions they&apos;d made a hundred times. I haven&apos;t. Every one
          of those decisions was something I learned the week I made it — that
          interfaces are structural, that a pointer stands in for an Option
          type, that an HTTP server puts every request on its own goroutine
          whether you asked or not. Flattening that into expert prose threw
          away the most useful thing the page had. The reframe went in
          test-first like everything else here, which produced the slightly
          absurd artifact of a failing test demanding humility:
        </p>
        <pre className={pre}>
          {`FAIL  RiskScoringApiContent > is written as someone new to Go,
      not as a Go veteran
AssertionError: expected 0 to be greater than 0`}
        </pre>

        <h3 className="mt-5 mb-2 text-[15px] font-semibold text-foreground">
          A write-up about an API shouldn&apos;t ask you to take my word for it
        </h3>
        <p className="text-muted">
          The demo posts a transaction and renders the engine&apos;s real
          answer. The browser never talks to the Go service directly — a Next
          route at <code className={code}>/api/risk/transactions</code>{" "}
          forwards to it server-side, which keeps the backend URL in one env
          var and means the Go service never needs to learn CORS for the sake
          of one page. What comes back is the same JSON the write-up describes:
        </p>
        <pre className={pre}>
          {`{"score": {"value": 55, "band": "amber", "hits": [
  {"rule_id": "amount_threshold",
   "reason": "amount 6000.00 exceeds limit 5000.00",
   "weight": 30}]}}`}
        </pre>

        <h3 className="mt-5 mb-2 text-[15px] font-semibold text-foreground">
          The demo shipped before the deployment, and it admits that
        </h3>
        <p className="text-muted">
          The Go service compiles to a static binary in a distroless image, so
          the deploy target is Railway with nothing but the repo&apos;s
          Dockerfile. Until <code className={code}>RISK_API_URL</code> points
          at that deployment, the proxy answers with the truth instead of a
          spinner, and the demo shows it verbatim:
        </p>
        <pre className={pre}>
          {`{"error": "RISK_API_URL is not configured on this deployment"}`}
        </pre>
        <p className="text-muted">
          I&apos;d rather ship the page in that state than hold it for the
          deploy — a demo that names its missing dependency is documentation; a
          spinner that never resolves is a bug report.
        </p>
      </Update>

      <WhatsNext
        nowShipped={[
          "POST /v1/transactions scores a transaction and returns the score, its band (green/amber/red), and every rule it tripped with a reason.",
          "A rules engine behind a single Rule interface: amount threshold, new-device, geo-mismatch, and velocity — the last a per-device sliding window, mutex-guarded and proven safe under a -race test.",
          "A scorer that sums rule weights, clamps at 100, and maps the total to a band with the thresholds in one place.",
          "GET /v1/rules and PUT /v1/rules/{id} to list and toggle rules at runtime, so you can turn a rule off on a live service.",
          "GET /v1/stream: a server-sent events feed that fans flagged transactions out to every subscriber, skipping a full buffer rather than stalling the stream.",
          "A Store behind an interface with an in-memory implementation, a cmd/simulator load CLI with a configurable fraud rate, table-driven tests, and a Dockerfile that ships a static binary.",
          "A live demo on this page: fill in a transaction and get the band and every reason back, through a proxy at /api/risk/transactions that keeps the backend URL server-side.",
        ]}
        couldImprove={[
          "The in-memory store grows unbounded — fine for a demo, wrong for anything that runs for a week. It's the first thing the Postgres store fixes.",
          "Velocity state is per-process, so it's only correct on a single instance. Horizontal scale needs that window in a shared store (Redis) behind the same rule — a distributed-state lesson I haven't earned yet.",
          "There's no auth on the endpoints. It's a demo service, but a scoring API that anyone can toggle rules on is not one you'd expose.",
          "The demo only exercises POST /v1/transactions — the SSE stream and the rule toggles aren't surfaced on the page yet.",
        ]}
        upcoming={[
          "Deploy the Go service to Railway and point RISK_API_URL at it, so the demo above scores against the real thing.",
          "A Postgres store behind the existing Store interface, which is the whole reason the interface came first — and my excuse to learn pgx.",
          "Moving the velocity window into Redis so the rule stays correct across instances.",
          "Rules with configurable weights and thresholds as data rather than constants, so tuning the risk appetite doesn't need a redeploy.",
        ]}
      />
    </ThoughtLayout>
  );
}
