import ThoughtLayout from "@/app/thoughts/ThoughtLayout";
import { WhatsNext } from "@/app/thoughts/_shared/ThoughtUpdates";

const code =
  "rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground";
const pre =
  "mt-3 overflow-x-auto rounded-lg bg-surface p-3 text-[13px] font-mono text-foreground";

export default function RiskScoringApiContent() {
  return (
    <ThoughtLayout
      breadcrumb="Risk-scoring API"
      title="A real-time transaction risk-scoring API"
      intro={
        <>
          I wanted to build the thing a fraud or AML platform actually sells: a
          service that takes a payment transaction and hands back a risk score in
          milliseconds, with the reasons attached. So this is a small Go API that
          runs each transaction through a set of rules, adds up a weighted score,
          drops it into a green / amber / red band, and pushes anything flagged
          out to a live feed. The whole thing is the Go standard library —{" "}
          <code className={code}>net/http</code> for routing, no framework — because
          the interesting decisions here are about shape, not dependencies.
        </>
      }
    >
      <section>
        <h2 className="mb-3 text-lg font-bold">
          The rules are the only thing that changes, so they&apos;re the only
          thing you add
        </h2>
        <p className="text-muted">
          A risk engine lives or dies on how cheaply you can add the next rule.
          The one guarantee I wanted was that adding a rule is a new type and
          nothing else — the engine that runs them never gets edited, never grows
          a switch statement, never learns the name of a rule. So a rule is a tiny
          interface, and the engine only knows the interface.
        </p>
        <pre className={pre}>
          {`type Rule interface {
	ID() string
	Weight() int // score contribution when it fires
	Evaluate(ctx context.Context, txn model.Transaction) *model.RuleHit
}`}
        </pre>
        <p className="mt-3 text-muted">
          The engine holds a slice of rules and a map of which ones are enabled,
          walks the enabled ones, collects the hits, and hands them to the scorer.
          A rule that fires returns a <code className={code}>RuleHit</code> with a
          reason and its weight; a rule that doesn&apos;t returns{" "}
          <code className={code}>nil</code>. That&apos;s the entire contract.
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
          The four rules I shipped are amount-over-threshold (weight 30),
          new-device for a user (20), country-differs-from-last-seen (25), and
          velocity — too many transactions from one device in a window (40).
          Because enablement is a map the engine already owns, toggling a rule at
          runtime is a one-liner, which is what backs the{" "}
          <code className={code}>PUT /v1/rules/{"{id}"}</code> endpoint. You can
          turn the velocity rule off on a live service and watch the scores move.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-bold">
          Velocity is the one with memory, so it&apos;s the one with a mutex
        </h2>
        <p className="text-muted">
          Three of the four rules are pure functions of a single transaction —
          look at the amount, compare a country, done. Velocity is the odd one
          out: it has to remember what a device did recently. It keeps a per-device
          sliding window of timestamps, and on every transaction it drops the ones
          that have aged out of the window, records the new one, and fires if the
          count crossed the limit.
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
          The moment a rule has mutable state, it&apos;s a concurrency question,
          because an HTTP server evaluates it from many goroutines at once. So the
          map is guarded by a mutex, and the clock is injected (a{" "}
          <code className={code}>now func() time.Time</code>) so the sliding-window
          behaviour is testable without sleeping. There&apos;s a{" "}
          <code className={code}>go test -race</code> test that fires the rule from
          a pack of goroutines specifically to prove the locking holds — the kind
          of test that&apos;s worthless until the day it isn&apos;t.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-bold">
          A score is a sum; a band is a decision
        </h2>
        <p className="text-muted">
          The scorer is deliberately boring, and that&apos;s the point. It sums
          the weights of the hits, clamps the total to 100 so no pile-up of rules
          can overflow the scale, and maps the number to a band: green under 30,
          amber 30 to 69, red at 70 and up. Keeping the thresholds as named
          constants in one place means the policy — where the lines sit — is one
          edit, not a hunt through conditionals.
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
          The score that comes back carries the hits with it, so the caller never
          gets a bare number they have to trust. A red transaction says{" "}
          <em>why</em> it&apos;s red — which rules fired, each with its own reason
          string — which is the difference between a score you can action and a
          score you can only argue with.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-bold">
          A score nobody sees in time is worthless, so it streams
        </h2>
        <p className="text-muted">
          Scoring in milliseconds only matters if the flag reaches a human or a
          system while it still means something. So flagged transactions —
          anything amber or red — go out over a server-sent-events feed at{" "}
          <code className={code}>GET /v1/stream</code>. Behind it is a broker that
          fans one event out to every current subscriber, and the rule that keeps
          it honest is that a publisher must never block: a subscriber whose
          buffer is full gets skipped, not waited on.
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
          Subscribe hands back the channel and an idempotent unsubscribe closure,
          so a client that disconnects cleans itself out of the fan-out exactly
          once. One slow consumer can&apos;t hold up the firehose for everyone
          else, which is the property you actually want from a monitoring feed —
          liveness over completeness.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-bold">
          The in-memory store is a seam, not a shortcut
        </h2>
        <p className="text-muted">
          Persistence is an in-memory <code className={code}>Store</code> today,
          but it sits behind an interface on purpose. The rules and handlers only
          know the interface, so a Postgres implementation (with{" "}
          <code className={code}>pgx</code>) drops in behind it without touching a
          line of the scoring or the HTTP layer. That&apos;s the same discipline as
          the rules: the thing most likely to change — where the data lives — is
          isolated so that changing it is additive.
        </p>
        <p className="mt-3 text-muted">
          To prove any of this under something like real traffic there&apos;s a{" "}
          <code className={code}>cmd/simulator</code> load CLI that fires synthetic
          transactions with a configurable fraud rate, so you can watch the bands
          shift and the stream light up. And the whole service is one small
          multi-stage <code className={code}>Dockerfile</code> — a static Go
          binary, nothing else in the image.
        </p>
      </section>

      <WhatsNext
        nowShipped={[
          "POST /v1/transactions scores a transaction and returns the score, its band (green/amber/red), and every rule it tripped with a reason.",
          "A rules engine behind a single Rule interface: amount threshold, new-device, geo-mismatch, and velocity — the last a per-device sliding window, mutex-guarded and proven safe under a -race test.",
          "A scorer that sums rule weights, clamps at 100, and maps the total to a band with the thresholds in one place.",
          "GET /v1/rules and PUT /v1/rules/{id} to list and toggle rules at runtime, so you can turn a rule off on a live service.",
          "GET /v1/stream: a server-sent-events feed that fans flagged transactions out to every subscriber, skipping a full buffer rather than stalling the stream.",
          "A Store behind an interface with an in-memory implementation, a cmd/simulator load CLI with a configurable fraud rate, table-driven tests, and a Dockerfile that ships a static binary.",
        ]}
        couldImprove={[
          "The in-memory store grows unbounded — fine for a demo, wrong for anything that runs for a week. It's the first thing the Postgres store fixes.",
          "Velocity state is per-process, so it's only correct on a single instance. Horizontal scale needs that window in a shared store (Redis) behind the same rule.",
          "There's no auth on the endpoints. It's a demo service, but a scoring API that anyone can toggle rules on is not one you'd expose.",
        ]}
        upcoming={[
          "A Postgres store behind the existing Store interface, which is the whole reason the interface came first.",
          "Moving the velocity window into Redis so the rule stays correct across instances.",
          "Rules with configurable weights and thresholds as data rather than constants, so tuning the policy doesn't need a redeploy.",
        ]}
      />
    </ThoughtLayout>
  );
}
