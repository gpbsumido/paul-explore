"use client";

import { useState } from "react";
import PageHeader from "@/components/PageHeader";
import styles from "@/app/thoughts/styling/styling.module.css";
import { Timestamp, Sent, Received } from "@/lib/threads";
import ViewToggle from "@/app/thoughts/ViewToggle";

/** A labelled code block for a before/after (or before/attempt/correct) pair. */
function Snippet({
  label,
  tone,
  children,
}: {
  label: string;
  tone: "before" | "after" | "attempt";
  children: string;
}) {
  const color =
    tone === "before"
      ? "text-rose-400"
      : tone === "attempt"
        ? "text-amber-400"
        : "text-emerald-400";
  return (
    <div className="mt-3">
      <p className={`mb-1 text-[11px] font-bold uppercase tracking-wider ${color}`}>
        {label}
      </p>
      <div className={styles.codeBubble}>{children}</div>
    </div>
  );
}

/** Dev-notes write-up for the react-doctor pass: the fixes, the dead ends, and what the tool got right and wrong. */
export default function ReactDoctorContent() {
  const [view, setView] = useState<"summary" | "chat">("summary");

  return (
    <div className="min-h-dvh bg-background">
      <PageHeader
        breadcrumbs={[
          { label: "Hub", href: "/" },
          { label: "React Doctor" },
        ]}
        right={<ViewToggle view={view} setView={setView} />}
        showLogout={false}
        maxWidth="max-w-3xl"
      />

      {view === "summary" ? (
        <main className="mx-auto max-w-3xl px-4 py-10 sm:py-14">
          <header className="mb-10">
            <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.15em] text-muted">
              Dev notes
            </p>
            <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              A pass with React Doctor
            </h1>
            <p className="mt-3 text-[15px] leading-relaxed text-muted">
              React Doctor is a static analyzer that scores a React codebase and
              flags bugs, performance, accessibility, and maintainability
              issues. I ran it, it said 36/100, and I worked through the
              highest-ROI findings. This page is the honest version: what I
              fixed, one fix that fought back, the false positives, and what I
              chose not to touch.
            </p>
          </header>

          <div className="space-y-10 text-[15px] leading-relaxed text-foreground">
            <section>
              <h2 className="mb-3 text-lg font-bold">The diagnosis</h2>
              <p className="text-muted">
                One command, 494 findings, a score of 36/100 (&ldquo;Critical&rdquo;).
                First job was separating signal from noise: 487 of those were in{" "}
                <code className="font-mono text-foreground/70">src/</code>, and the
                other 7 were things like a Python virtualenv that happened to
                live in the repo and a CI YAML file &mdash; not React, not mine
                to fix here. The very first &ldquo;top error&rdquo; it showed me
                was a command-injection warning inside{" "}
                <code className="font-mono text-foreground/70">pip</code>&rsquo;s
                source code. Good reminder that a scanner scans everything you
                point it at.
              </p>
              <p className="mt-3 text-muted">
                I pulled the structured JSON report and ranked the rules by
                severity and file spread. That ranking, not the pretty terminal
                output, drove everything after.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-lg font-bold">Triage before touching anything</h2>
              <p className="text-muted">
                React Doctor&rsquo;s own guidance is sensible and I followed it:
                treat findings as hypotheses, read the code before confirming,
                prefer behavior-preserving fixes, and{" "}
                <em className="text-foreground/80">sample before you sweep</em>{" "}
                when a single rule spans dozens of files. So I split the work by
                ROI:
              </p>
              <ul className="mt-3 space-y-2 text-muted">
                <li>
                  <span className="font-semibold text-foreground">Do now:</span>{" "}
                  real bugs and cheap mechanical wins &mdash; effect cleanups,
                  side effects inside state updaters, missing{" "}
                  <code className="font-mono text-foreground/70">button type</code>,
                  and fetches that read the body without checking the status.
                </li>
                <li>
                  <span className="font-semibold text-foreground">Defer:</span>{" "}
                  the migration-scale rules &mdash; a full Framer Motion import
                  in 53 files, 40 &ldquo;giant components,&rdquo; array-index keys
                  in 29 files. Each is a project on its own and the wrong thing
                  to sweep in one unreviewable pass.
                </li>
              </ul>
            </section>

            <section>
              <h2 className="mb-3 text-lg font-bold">Fixes that landed</h2>
              <p className="text-muted">
                <span className="font-semibold text-foreground">Effect cleanup.</span>{" "}
                An auto-save effect kicked off a{" "}
                <code className="font-mono text-foreground/70">fetch</code> and a{" "}
                <code className="font-mono text-foreground/70">setTimeout</code>{" "}
                with no cleanup, so an unmount mid-flight could set state on a
                dead component. Fixed with an{" "}
                <code className="font-mono text-foreground/70">AbortController</code>{" "}
                and a cleared timer, plus ignoring the resulting abort error.
              </p>
              <Snippet label="Before" tone="before">{`useEffect(() => {
  if (!autoSave || !userHasPickedRef.current || isViewMode) return;
  fetch("/api/nba/playoffs/picks", { method: "PUT", /* ... */ })
    .then((res) => {
      if (res.ok) {
        setSaveStatus("saved");
        setTimeout(() => setSaveStatus("idle"), 2000); // leaks on unmount
      }
    })
    .catch(() => setSaveStatus("idle"));
}, [autoSave, debouncedPicks, isViewMode, meQuery.data?.name]);`}</Snippet>
              <Snippet label="After" tone="after">{`useEffect(() => {
  if (!autoSave || !userHasPickedRef.current || isViewMode) return;
  const controller = new AbortController();
  let idleTimer: ReturnType<typeof setTimeout> | undefined;
  fetch("/api/nba/playoffs/picks", { method: "PUT", signal: controller.signal, /* ... */ })
    .then((res) => {
      if (res.ok) {
        setSaveStatus("saved");
        idleTimer = setTimeout(() => setSaveStatus("idle"), 2000);
      }
    })
    .catch((err: unknown) => {
      const aborted = err instanceof DOMException && err.name === "AbortError";
      if (!aborted) setSaveStatus("idle");
    });
  return () => { controller.abort(); if (idleTimer) clearTimeout(idleTimer); };
}, [autoSave, debouncedPicks, isViewMode, meQuery.data?.name]);`}</Snippet>
              <p className="mt-3 text-muted">
                <span className="font-semibold text-foreground">Side effects in state updaters.</span>{" "}
                The core rule here is that React may call an updater function more
                than once, so{" "}
                <code className="font-mono text-foreground/70">setX(prev =&gt; &#123; doSideEffect(); return next &#125;)</code>{" "}
                is a trap. The clean fixes moved the side effect to where it
                belongs: the game demo does its round transition in the interval
                callback via a ref instead of inside{" "}
                <code className="font-mono text-foreground/70">setProgress</code>;
                the weather and fleet toggles persist to localStorage in an
                effect keyed on the value; the calendar&rsquo;s infinite scroll
                captures scroll height before the prepend rather than during it.
              </p>
              <Snippet label="Before — updater does the transition" tone="before">{`setProgress((p) => {
  const next = p + 9 + Math.random() * 11;
  if (next >= 100) {
    clearInterval(timer);
    setScore(0); setTimeLeft(ROUND_SECONDS);
    setTarget(spawn(1)); setPhase("playing"); // side effects in the updater
    return 100;
  }
  return next;
});`}</Snippet>
              <Snippet label="After — transition in the interval, via a ref" tone="after">{`const next = progressRef.current + 9 + Math.random() * 11;
if (next >= 100) {
  clearInterval(timer);
  progressRef.current = 100; setProgress(100);
  setScore(0); setTimeLeft(ROUND_SECONDS);
  setTarget(spawn(1)); setPhase("playing");
} else {
  progressRef.current = next; setProgress(next);
}`}</Snippet>
              <p className="mt-4 text-muted">
                The toggle case is even simpler &mdash; the updater just computes
                the next value, and persistence moves to an effect keyed on it:
              </p>
              <Snippet label="Before" tone="before">{`const toggle = useCallback(() =>
  setEnabled((v) => {
    const next = !v;
    localStorage.setItem("weather-fx-enabled", String(next)); // in the updater
    return next;
  }), []);`}</Snippet>
              <Snippet label="After" tone="after">{`const toggle = useCallback(() => setEnabled((v) => !v), []);

useEffect(() => {
  localStorage.setItem("weather-fx-enabled", String(enabled));
}, [enabled]);`}</Snippet>
              <p className="mt-4 text-muted">
                Two more from the same batch. The landing GraphQL typewriter
                cleared its interval from inside the updater; now the updater is
                pure and a small effect stops the interval at the end &mdash; and
                that effect only calls{" "}
                <code className="font-mono text-foreground/70">clearInterval</code>,
                never <code className="font-mono text-foreground/70">setState</code>,
                so it stays clear of the rule that bit the stepper:
              </p>
              <Snippet label="Before" tone="before">{`setCount((prev) => {
  if (prev >= query.length) {
    clearInterval(intervalRef.current!); // side effect in the updater
    return prev;
  }
  return prev + 1;
});`}</Snippet>
              <Snippet label="After" tone="after">{`setCount((prev) => (prev >= query.length ? prev : prev + 1));

useEffect(() => {
  if (count >= query.length && intervalRef.current) {
    clearInterval(intervalRef.current); // clearInterval only, no setState
    intervalRef.current = null;
  }
}, [count, query.length]);`}</Snippet>
              <p className="mt-4 text-muted">
                And the infinite calendar scroll wrote a ref (the scroll height to
                restore after a prepend) from inside its updater; that read moves
                out ahead of the state update, using a ref that mirrors the
                current periods:
              </p>
              <Snippet label="Before" tone="before">{`setPeriods((prev) => {
  const prevPeriod = getPrevPeriod(prev[0]);
  const key = getPeriodKey(prevPeriod);
  if (prev.some((d) => getPeriodKey(d) === key)) return prev;
  if (scrollRef.current) prependHeightRef.current = scrollRef.current.scrollHeight; // ref write
  return [prevPeriod, ...prev];
});`}</Snippet>
              <Snippet label="After" tone="after">{`const current = periodsRef.current; // synced to periods in an effect
const prevPeriod = getPrevPeriod(current[0]);
const key = getPeriodKey(prevPeriod);
if (current.some((d) => getPeriodKey(d) === key)) return;
if (scrollRef.current) prependHeightRef.current = scrollRef.current.scrollHeight;
setPeriods((prev) =>
  prev.some((d) => getPeriodKey(d) === key) ? prev : [prevPeriod, ...prev]);`}</Snippet>
              <p className="mt-3 text-muted">
                <span className="font-semibold text-foreground">Button types.</span>{" "}
                48 buttons across 30 files had no explicit{" "}
                <code className="font-mono text-foreground/70">type</code>, which
                defaults to <code className="font-mono text-foreground/70">submit</code>.
                Before mass-editing I checked that none of those 30 files even
                contained a <code className="font-mono text-foreground/70">&lt;form&gt;</code>,
                so <code className="font-mono text-foreground/70">type=&quot;button&quot;</code>{" "}
                was unambiguously correct &mdash; a genuine submit button would
                have wanted <code className="font-mono text-foreground/70">type=&quot;submit&quot;</code>{" "}
                instead. Then a small codemod added the attribute to exactly the
                flagged lines.
              </p>
              <Snippet label="Before" tone="before">{`<button onClick={() => onMove(post.id, -1)}>‹</button>`}</Snippet>
              <Snippet label="After" tone="after">{`<button type="button" onClick={() => onMove(post.id, -1)}>‹</button>`}</Snippet>
              <p className="mt-3 text-muted">
                <span className="font-semibold text-foreground">Fetch status checks.</span>{" "}
                <code className="font-mono text-foreground/70">fetch()</code> does
                not reject on a 4xx/5xx &mdash; it resolves, and{" "}
                <code className="font-mono text-foreground/70">.json()</code> then
                happily parses an error body. Added{" "}
                <code className="font-mono text-foreground/70">if (!res.ok) throw</code>{" "}
                before the reads that lacked it.
              </p>
              <Snippet label="Before" tone="before">{`queryFn: () => fetch("/api/me").then((r) => r.json()),`}</Snippet>
              <Snippet label="After" tone="after">{`queryFn: () =>
  fetch("/api/me").then((r) => {
    if (!r.ok) throw new Error("Failed to load user");
    return r.json();
  }),`}</Snippet>
              <p className="mt-4 text-muted">
                One in this batch was a proxy, not a client read: the graphql
                route forwards the upstream status, so the fix isn&rsquo;t to
                throw on a bad status &mdash; it&rsquo;s to guard the parse so a
                non-JSON upstream error can&rsquo;t throw:
              </p>
              <Snippet label="Before" tone="before">{`const data = await upstream.json();`}</Snippet>
              <Snippet label="After" tone="after">{`const data = await upstream.json().catch(() => null);`}</Snippet>
            </section>

            <section>
              <h2 className="mb-3 text-lg font-bold">The fix that fought back</h2>
              <p className="text-muted">
                The biggest cluster by count was the same stepper pattern copied
                across ten algorithm-visualizer pages: a play/advance control
                that called{" "}
                <code className="font-mono text-foreground/70">stop()</code>{" "}
                (clear the interval, set playing false) from{" "}
                <em className="text-foreground/80">inside</em> the{" "}
                <code className="font-mono text-foreground/70">setStepIdx</code>{" "}
                updater. Textbook impure updater.
              </p>
              <Snippet label="Before — the impure updater" tone="before">{`setStepIdx((prev) => {
  if (prev >= steps.length - 1) {
    stop(); // clearInterval + setPlaying(false), inside the updater
    return prev;
  }
  return prev + 1;
});`}</Snippet>
              <p className="mt-3 text-muted">
                My first instinct: make the updater pure and move the stop into a
                small &ldquo;when we reach the last step, stop&rdquo; effect. It
                read cleanly and typechecked. Then React Doctor flagged the fix
                with a <em className="text-foreground/80">different</em> rule:
                calling <code className="font-mono text-foreground/70">setState</code>{" "}
                synchronously inside an effect body causes cascading renders. I
                had traded one finding for another &mdash; whack-a-mole.
              </p>
              <Snippet label="Attempt — pure updater, but setState in an effect" tone="attempt">{`setStepIdx((prev) => (prev >= steps.length - 1 ? prev : prev + 1));

useEffect(() => {
  if (playing && stepIdx >= steps.length - 1) stop(); // ← flagged: setState in effect
}, [playing, stepIdx, steps.length, stop]);`}</Snippet>
              <p className="mt-3 text-muted">
                The genuinely correct fix is neither the updater nor an effect:
                the side effect belongs in the event that drives the change (the
                interval tick / the click handler), reading the current step from
                a synced ref. That&rsquo;s right, but it&rsquo;s a per-file
                restructure across ten files &mdash; and critically, these
                particular side effects are idempotent (clearing an already-clear
                interval and setting a boolean false twice are both no-ops), so
                the real-world harm is close to zero. This is exactly the
                &ldquo;sample before you sweep&rdquo; case. I reverted the whole
                stepper batch and left it as a focused follow-up rather than
                bloat this PR with a risky, low-value ten-file rewrite.
              </p>
              <Snippet label="Correct (deferred) — side effect in the callback, via a ref" tone="after">{`// in the interval tick / click handler — not the updater, not an effect
if (stepIdxRef.current >= steps.length - 1) {
  stop();
  return;
}
setStepIdx((prev) => prev + 1);`}</Snippet>
              <p className="mt-3 text-muted">
                The lesson that stuck: a &ldquo;fix&rdquo; that only relocates a
                side effect from one disallowed place to another isn&rsquo;t a
                fix. And a true positive is not automatically worth fixing now
                &mdash; idempotent impurity in a demo is a different priority
                than a real leak in a save path.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-lg font-bold">Reading before fixing: the false positives</h2>
              <p className="text-muted">
                Two flagged items were false positives once I read them. A{" "}
                &ldquo;side effect in a GET handler&rdquo; (CSRF risk) pointed at{" "}
                <code className="font-mono text-foreground/70">Query.create()</code>{" "}
                in the TCG route &mdash; but that&rsquo;s a read-only query
                builder and the endpoint is idempotent and CDN-cached, no state
                mutation anywhere. And a &ldquo;fetch used without a status
                check&rdquo; in the vitals proxy was already resilient: it forwards
                the upstream status and parses with{" "}
                <code className="font-mono text-foreground/70">.catch(() =&gt; null)</code>.
                Both left as-is, documented. The tool says as much itself:
                don&rsquo;t suppress without evidence from the file.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-lg font-bold">Deferred by design</h2>
              <p className="text-muted">
                The migration-scale rules are real and worth doing &mdash; the
                full <code className="font-mono text-foreground/70">framer-motion</code>{" "}
                import inflates the bundle, giant components are hard to change,
                array-index keys bite on reorder &mdash; but they&rsquo;re each a
                deliberate, reviewable effort with their own trade-offs. Sweeping
                53 files of motion imports or splitting 40 components in a
                &ldquo;react-doctor fixes&rdquo; PR would be unreviewable and
                exactly the failure mode the tool warns about. Those get their own
                PRs, a sampled recipe first.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-lg font-bold">A second pass: render &amp; layout work</h2>
              <p className="text-muted">
                Coming back for a second batch, this time performance rules that
                were real and safe (as opposed to the migration-scale ones).
              </p>
              <p className="mt-3 text-muted">
                <span className="font-semibold text-foreground">Unmemoized context values.</span>{" "}
                Two providers built their context{" "}
                <code className="font-mono text-foreground/70">value</code> inline,
                so a brand-new object every render &mdash; which makes{" "}
                <em className="text-foreground/80">every</em> consumer of that
                context re-render even when nothing it cares about changed. The
                fix is a <code className="font-mono text-foreground/70">useMemo</code>{" "}
                keyed on the values that actually change (the store functions are
                already stable module-level refs).
              </p>
              <Snippet label="Before" tone="before">{`<ToastContext.Provider
  value={{
    toasts,
    addToast: toastStore.addToast,
    removeToast: toastStore.removeToast,
  }}
>
  {children}
</ToastContext.Provider>`}</Snippet>
              <Snippet label="After" tone="after">{`const value = useMemo(
  () => ({ toasts, addToast: toastStore.addToast, removeToast: toastStore.removeToast }),
  [toasts],
);

return <ToastContext.Provider value={value}>{children}</ToastContext.Provider>;`}</Snippet>
              <p className="mt-4 text-muted">
                <span className="font-semibold text-foreground">toLocaleString() in render.</span>{" "}
                Two operator components formatted a timestamp with{" "}
                <code className="font-mono text-foreground/70">toLocaleString()</code>{" "}
                during render &mdash; but locale and timezone differ between the
                server and the browser, so that&rsquo;s a hydration mismatch. The
                interesting part is the fix hit the{" "}
                <em className="text-foreground/80">same tension as the stepper</em>:
                the obvious &ldquo;format after mount&rdquo; needs a{" "}
                <code className="font-mono text-foreground/70">setState</code> in
                an effect, which React Doctor flags. The clean answer that
                satisfies both rules is{" "}
                <code className="font-mono text-foreground/70">useSyncExternalStore</code>{" "}
                with a server snapshot &mdash; render an empty string on the
                server, the formatted value on the client, no effect and no
                mismatch.
              </p>
              <Snippet label="Before — formats during render (hydration mismatch)" tone="before">{`<span title={date.toLocaleString()}>
  {formatDistanceToNow(date, { addSuffix: true })}
</span>`}</Snippet>
              <Snippet label="Attempt — clears the mismatch, but setState in an effect" tone="attempt">{`const [str, setStr] = useState("");
useEffect(() => { setStr(date.toLocaleString()); }, [iso]); // ← flagged`}</Snippet>
              <Snippet label="After — server snapshot, no effect, no mismatch" tone="after">{`export function useLocaleDateTime(iso: string): string {
  return useSyncExternalStore(
    () => () => {},
    () => new Date(iso).toLocaleString(), // client
    () => "",                             // server
  );
}`}</Snippet>
              <p className="mt-4 text-muted">
                <span className="font-semibold text-foreground">&lt;img&gt; to next/image.</span>{" "}
                The &ldquo;use next/image&rdquo; rule is mostly a defer &mdash;
                but the email-studio demo&rsquo;s image block is a real case worth
                doing. It renders a{" "}
                <code className="font-mono text-foreground/70">data:</code> URL
                from a local file import, so there&rsquo;s nothing for the
                optimizer to actually do; the fix is{" "}
                <code className="font-mono text-foreground/70">next/image</code>{" "}
                with <code className="font-mono text-foreground/70">fill</code>{" "}
                and <code className="font-mono text-foreground/70">unoptimized</code>,
                which clears the lint and keeps the exact same output.
              </p>
              <Snippet label="Before" tone="before">{`<img
  src={block.src}
  alt="email banner"
  className="h-16 w-full rounded-md object-cover"
/>`}</Snippet>
              <Snippet label="After" tone="after">{`<div className="relative h-16 w-full overflow-hidden rounded-md">
  <Image src={block.src} alt="email banner" fill unoptimized sizes="100vw" className="object-cover" />
</div>`}</Snippet>
              <p className="mt-4 text-muted">
                <span className="font-semibold text-foreground">Framer Motion, sampled.</span>{" "}
                The biggest deferred item is the full{" "}
                <code className="font-mono text-foreground/70">framer-motion</code>{" "}
                import across ~53 files &mdash; the fix is{" "}
                <code className="font-mono text-foreground/70">LazyMotion</code>{" "}
                plus the lighter{" "}
                <code className="font-mono text-foreground/70">m</code> components.
                Per the tool&rsquo;s own advice I did a <em className="text-foreground/80">sample</em>{" "}
                first: mount the provider once and convert three files, to prove
                the recipe before sweeping the rest. Two things it forced me to
                get right &mdash; the bundle must be{" "}
                <code className="font-mono text-foreground/70">domMax</code> (not
                the smaller <code className="font-mono text-foreground/70">domAnimation</code>)
                because the app animates <code className="font-mono text-foreground/70">layout</code>{" "}
                and <code className="font-mono text-foreground/70">drag</code>, and
                it has to stay <em className="text-foreground/80">non-strict</em>{" "}
                so the ~50 files still on <code className="font-mono text-foreground/70">motion</code>{" "}
                keep working during the migration. The real bundle win only lands
                once the sweep is done; the sample just de-risks it.
              </p>
              <Snippet label="Before" tone="before">{`import { motion } from "framer-motion";
// ...
<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} />`}</Snippet>
              <Snippet label="After" tone="after">{`// providers.tsx — once, app-wide
<LazyMotion features={domMax}>{children}</LazyMotion>

// a converted component
import { m } from "framer-motion";
<m.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} />`}</Snippet>
            </section>

            <section>
              <h2 className="mb-3 text-lg font-bold">What React Doctor got right, and wrong</h2>
              <p className="text-muted">
                <span className="font-semibold text-foreground">Right:</span> the
                bug rules are high-signal &mdash; impure updators, missing effect
                cleanup, unchecked fetches, and missing button types are all real.
                The JSON report is the actual product; ranking rules by severity
                and spread is what makes it usable. And its meta-advice
                (&ldquo;sample before you sweep,&rdquo; &ldquo;split broad work
                into separate PRs&rdquo;) is genuinely good process.
              </p>
              <p className="mt-3 text-muted">
                <span className="font-semibold text-foreground">Wrong / careful:</span>{" "}
                it scans everything you point it at, so a repo with a stray venv
                gets you findings inside <code className="font-mono text-foreground/70">pip</code>.
                Some rules are context-blind (the read-only GET handler, the
                already-resilient proxy). Severity isn&rsquo;t priority: 73
                idempotent updater findings in demos ranked above a single real
                leak. And one of its own rules can flag the naive fix for another
                &mdash; you have to understand the underlying React model, not
                just chase the score down.
              </p>
              <p className="mt-3 text-muted">
                Net: a good hypothesis generator, a bad autopilot. Every finding
                got read before it got fixed, deferred, or dismissed &mdash;
                which is the only way to use a tool like this.
              </p>
            </section>
          </div>
        </main>
      ) : (
        <main className="mx-auto max-w-3xl px-4 py-10 sm:py-14">
          <div className={styles.chat}>
            <Timestamp>React Doctor pass</Timestamp>

            <Received pos="first">Ran react-doctor. Score?</Received>
            <Sent pos="first">36 out of 100. 494 findings.</Sent>
            <Sent pos="last">
              487 in src. The other 7 were a Python venv and CI yaml. It scans
              whatever you point it at.
            </Sent>

            <Received pos="first">What&rsquo;s worth fixing?</Received>
            <Sent pos="first">
              Real bugs + cheap wins: effect cleanups, side effects inside state
              updaters, missing button types, fetches that skip the status check.
            </Sent>
            <Sent pos="last">
              Deferred the migration-scale stuff &mdash; full framer-motion
              import in 53 files, 40 giant components. Separate PRs.
            </Sent>

            <Received pos="first">Any fix backfire?</Received>
            <Sent pos="first">
              Yep. Moved a <code>stop()</code> out of a setState updater into an
              effect. React Doctor then flagged the effect for calling setState
              &mdash; different rule, same code. Whack-a-mole.
            </Sent>
            <Sent pos="middle">
              Correct fix is a ref read in the interval callback, but it&rsquo;s a
              10-file rewrite and those side effects are idempotent anyway.
            </Sent>
            <Sent pos="last">Reverted the batch, left it as a follow-up.</Sent>

            <Received pos="first">False positives?</Received>
            <Sent pos="first">
              Two. A &ldquo;CSRF in a GET handler&rdquo; that was a read-only
              query builder, and a &ldquo;fetch without status check&rdquo; that
              already forwarded the status and caught parse errors.
            </Sent>
            <Sent pos="last">Read the file first, always.</Sent>

            <Received pos="first">Verdict?</Received>
            <Sent pos="last">
              Great hypothesis generator, terrible autopilot. Severity
              isn&rsquo;t priority and one rule can flag the fix for another.
              Useful if you read every finding.
            </Sent>

            <Timestamp>Delivered</Timestamp>
          </div>
        </main>
      )}
    </div>
  );
}
