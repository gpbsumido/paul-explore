import Link from "next/link";
import ThoughtLayout from "@/app/thoughts/ThoughtLayout";
import { WhatsNext } from "@/app/thoughts/_shared/ThoughtUpdates";

/** Inline monospace token, matches the code styling used across thoughts pages. */
function C({ children }: { children: React.ReactNode }) {
  return (
    <code className="rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground">
      {children}
    </code>
  );
}

function Bullet({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex gap-2">
      <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-foreground/30" />
      <span>{children}</span>
    </li>
  );
}

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

export default function ErrorToastsContent() {
  return (
    <ThoughtLayout
      breadcrumb="Error Toasts"
      title="One place that catches every failed write"
      intro={
        <>
          A write that failed used to be silent unless the one screen that made
          it happened to catch and render its own error &mdash; and most
          didn&rsquo;t. You&rsquo;d click, nothing would move, and there was
          nothing to tell you whether it saved. This is the write-up on closing
          that gap once, at the layer every write already flows through, and on
          building the notification it shows in{" "}
          <Link
            href="/design-system"
            className="underline underline-offset-2"
          >
            my design system
          </Link>{" "}
          first so it looks the same wherever it appears.
        </>
      }
    >
      <Section title="The bug is the silence, not the error">
        <p>
          Every data write on the site is a TanStack Query mutation. When one
          rejects, React Query hands the error to whoever called{" "}
          <C>useMutation</C> &mdash; and if that caller didn&rsquo;t wire up an{" "}
          <C>onError</C> and render something, the failure just evaporated. It
          worked most of the time, so the missing branch was easy to never
          write. The result was the worst kind of bug: not a crash, not a wrong
          number, just a click that quietly did nothing.
        </p>
        <p className="mt-3">
          I didn&rsquo;t want to fix that mutation by mutation. Fifty callers
          each remembering to catch and render an error is fifty chances to
          forget. I wanted one place that couldn&rsquo;t be skipped.
        </p>
      </Section>

      <Section title="The QueryClient already has that place">
        <p>
          React Query&rsquo;s <C>MutationCache</C> has its own <C>onError</C>{" "}
          that fires for <em>every</em> mutation on the client, before the
          per-call handler. So the whole feature is: give the app&rsquo;s
          QueryClient a mutation cache whose <C>onError</C> raises a toast, and
          nothing can fail unseen.
        </p>
        <pre className="mt-3 overflow-x-auto rounded-lg bg-surface p-3 text-[13px] font-mono text-foreground">
          {`new QueryClient({
  mutationCache: new MutationCache({
    onError: (error, _v, _c, mutation) =>
      notifyMutationError(error, mutation.meta),
  }),
  // ...existing query defaults
})`}
        </pre>
        <p className="mt-3">
          The handler shows the backend&rsquo;s own message where there is one,
          so <C>You already have an active season wallet</C> reaches you word
          for word, and a plain <C>Something went wrong. Please try again.</C>{" "}
          where the error carries nothing useful.
        </p>
        <ul className="mt-3 space-y-2">
          <Bullet>
            A screen that shows its own inline error &mdash; a retryable load
            state, a field-level validation message &mdash; opts out with{" "}
            <C>meta: {"{ silent: true }"}</C> on the mutation, so nothing is
            reported twice.
          </Bullet>
          <Bullet>
            The catch lives above every caller, so a new mutation added next
            month is covered the moment it&rsquo;s written, with no wiring to
            remember.
          </Bullet>
        </ul>
      </Section>

      <Section title="Why the toast is imperative, not a hook">
        <p>
          The obvious way to raise a toast is a <C>useToast()</C> hook. But the
          mutation-cache handler runs inside the QueryClient, outside the React
          tree &mdash; there&rsquo;s no component, so there&rsquo;s no hook to
          call. That shaped the design-system piece I built for this: a{" "}
          <C>Toaster</C> you mount once, driven by an imperative{" "}
          <C>toast.error(msg)</C> (and <C>success</C>/<C>warning</C>/<C>info</C>
          ) you can call from anywhere, React or not.
        </p>
        <p className="mt-3">
          Under it is a tiny module-level store &mdash; a list of live toasts
          and a set of listeners &mdash; that <C>Toaster</C> subscribes to with{" "}
          <C>useSyncExternalStore</C>. Calling <C>toast.error</C> pushes a
          record and notifies; the mounted region re-renders. A toast raised
          before the region has mounted is simply queued in the store and shown
          when it does.
        </p>
      </Section>

      <Section title="It has to render nothing on the server">
        <p>
          The region portals into <C>document.body</C>, and there is no{" "}
          <C>document</C> during a server render. An earlier component on this
          site crashed a whole route&rsquo;s prerender by reaching{" "}
          <C>createPortal</C> on the server, so I built the guard in from the
          start &mdash; <C>Toaster</C> returns <C>null</C> until it has a
          document, and its server snapshot is an empty list. There&rsquo;s a
          test that renders it to static markup with <C>document</C> deleted and
          asserts it comes back empty.
        </p>
      </Section>

      <Section title="Accessible by default">
        <p>
          The toasts stack in a labelled live region. An error announces
          assertively so a screen reader interrupts with it; everything else is
          polite. That matches the urgency to the tone rather than shouting
          every notification, and it means the failure you couldn&rsquo;t see
          before is now both visible and spoken.
        </p>
      </Section>

      <WhatsNext
        nowShipped={[
          "One mutation-cache handler above every caller, so a failed write can't be silent no matter which screen made it.",
          "The toast surface built as a design-system component first, then consumed here, so it's the same everywhere and dogfooded in the gallery.",
          "An imperative toast() that works outside React, which is the only thing that could serve a handler running inside the QueryClient.",
        ]}
        couldImprove={[
          "It only covers writes. A failed background query (a list that won't load) still needs its own inline, retryable state — the toast layer deliberately doesn't touch reads.",
          "Every error is one flat toast. A validation failure with several field errors collapses to a single line rather than pointing at each field.",
          "There's no dedupe yet, so a burst of failures from one action can stack several near-identical toasts.",
        ]}
        upcoming={[
          "Reconcile the ZeroProof lobby's per-action toasts onto this global handler, so there's one toast path rather than two.",
        ]}
      />
    </ThoughtLayout>
  );
}
