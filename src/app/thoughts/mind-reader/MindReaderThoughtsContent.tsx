import Link from "next/link";
import ThoughtLayout from "@/app/thoughts/ThoughtLayout";
import { WhatsNext } from "@/app/thoughts/_shared/ThoughtUpdates";

const code =
  "rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground";

const link =
  "font-medium text-primary-600 hover:underline dark:text-primary-400";

const pre =
  "mt-3 overflow-x-auto rounded-lg bg-surface p-3 text-[13px] font-mono text-foreground";

/**
 * Dev-notes write-up for The Mind Reader. Summary-only (no chat), so it
 * renders as a server component with no layout JS.
 */
export default function MindReaderThoughtsContent() {
  return (
    <ThoughtLayout
      breadcrumb="Mind Reader"
      title="My first Svelte, inside a Next app"
      intro={
        <>
          I wanted something on the site that shows I have started learning
          Svelte, and a framework is easiest to learn by building something
          small that actually gets used. So{" "}
          <Link href="/mind-reader" className={link}>
            /mind-reader
          </Link>{" "}
          is a party game: one person is dealt a secret role toward the other (
          &ldquo;I am your bodyguard&rdquo;, &ldquo;I am a spy trying to steal
          your wallet&rdquo;), talks normally while dropping hints, and the other
          has five minutes to work out what it is.
        </>
      }
    >
      <section>
        <h2 className="mb-2 text-xl font-bold text-foreground">
          Two hundred and forty ways to be someone
        </h2>
        <p className="text-muted">
          The deck is 240 sentences in six categories: protector, threat,
          secret, history, fantasy and everyday. Every one starts with &ldquo;I
          am&rdquo; because it is what Player A could say out loud, and the
          categories exist so a pair can pick the mood they want. A test pins the
          deck at over 200, rejects a repeated id or wording, and makes sure no
          category falls under ten, so filtering never leaves anyone with a deck
          that runs dry in two rounds. A role also does not repeat until the whole
          deck, or the chosen category, has been dealt.
        </p>
      </section>

      <section>
        <h2 className="mb-2 text-xl font-bold text-foreground">
          The rules are plain TypeScript, the screen is Svelte
        </h2>
        <p className="text-muted">
          Before I wrote any Svelte I wrote the game as a pure reducer:{" "}
          <code className={code}>setup</code>, <code className={code}>secret</code>
          , <code className={code}>playing</code>, <code className={code}>reveal</code>,
          with the dice and the clock passed in instead of read. That kept the
          interesting part, what a round is allowed to do next, testable without
          rendering anything, and it left Svelte with a narrow job: turn state
          into a screen. It also meant I was learning one thing at a time. The
          component uses <code className={code}>$state</code> for the game,{" "}
          <code className={code}>$derived</code> for the time left and the screen
          reader message, <code className={code}>$effect</code> for the interval,{" "}
          <code className={code}>$props</code> for an injectable dice and clock,
          and snippets for the heading and buttons I would otherwise have copied
          five times.
        </p>
      </section>

      <section>
        <h2 className="mb-2 text-xl font-bold text-foreground">
          A ten-line loader instead of a second app
        </h2>
        <p className="text-muted">
          I could have stood up a separate SvelteKit project, but the point was
          a Svelte feature on this site. Next does not know what a{" "}
          <code className={code}>.svelte</code> file is, but Svelte 5&apos;s
          compiler already strips TypeScript, so the whole integration is a
          loader that calls <code className={code}>compile()</code> and hands
          back the JavaScript, registered as a Turbopack rule (and a webpack one
          so <code className={code}>pnpm analyze</code> still works). The React
          page is a thin client shell that imports Svelte inside an effect,
          mounts the component into an empty div, and unmounts it on the way out.
          Doing the import inside the effect also keeps the Svelte runtime out of
          every other route.
        </p>
      </section>

      <section>
        <h2 className="mb-2 text-xl font-bold text-foreground">
          What the compiler told me that my tests did not
        </h2>
        <p className="text-muted">
          My component tests passed on the first full run, and the production
          build still printed this, because the loader forwards the compiler&apos;s
          warnings:
        </p>
        <pre className={pre}>
          {`./src/app/mind-reader/MindReader.svelte
Warning: Issue while running loader
Error: This reference only captures the initial value of \`game\`. Did you mean to reference it inside a closure instead?
https://svelte.dev/e/state_referenced_locally`}
        </pre>
        <p className="mt-3 text-muted">
          I had written <code className={code}>let lastPhase = game.phase</code>{" "}
          to remember the previous screen, which reads reactive state once, at
          setup, and never again. It worked in the tests because the starting
          phase was the value I wanted anyway. I fixed it by starting from the
          literal <code className={code}>&quot;setup&quot;</code>. The second
          warning was the same mistake in a quieter place:{" "}
          <code className={code}>$state(now())</code> reads the{" "}
          <code className={code}>now</code> prop at init. The effect resets the
          clock as soon as a round starts, so the seed can be{" "}
          <code className={code}>0</code>. I now check the compiler&apos;s warning
          count is zero before I trust a green run.
        </p>
      </section>

      <section>
        <h2 className="mb-2 text-xl font-bold text-foreground">
          The two small things that cost me time
        </h2>
        <p className="text-muted">
          The lint rule for accessibility is applied to every file, but the
          Next config only registers its plugin for some extensions, so naming
          the loader <code className={code}>svelte-loader.cjs</code> broke the
          whole lint run:
        </p>
        <pre className={pre}>
          {`A configuration object specifies rule "jsx-a11y/alt-text", but could not find plugin "jsx-a11y".`}
        </pre>
        <p className="mt-3 text-muted">
          Nothing was wrong with the plugin. Renaming the file to{" "}
          <code className={code}>.js</code> put it back inside the glob. And the
          axe test timed out at five seconds until I stopped using fake timers
          for it, since axe schedules its own work with timers; every other
          Svelte test keeps the fake clock so five minutes of game takes a few
          milliseconds.
        </p>
      </section>

      <section>
        <h2 className="mb-2 text-xl font-bold text-foreground">
          Accessible by default
        </h2>
        <p className="text-muted">
          The clock has <code className={code}>role=&quot;timer&quot;</code> with{" "}
          <code className={code}>aria-live=&quot;off&quot;</code>, and a separate
          status region announces only &ldquo;one minute left&rdquo; and
          &ldquo;ten seconds left&rdquo;, because reading out every second would
          drown the conversation the game is about. Focus moves to the new
          heading on every screen change but not on first load, so the page does
          not steal it from the header. Everything is a real button or radio, and
          the secret role leaves the DOM entirely once the clock starts rather
          than being hidden with CSS.
        </p>
      </section>

      <WhatsNext
        nowShipped={[
          "A 240-role deck in six categories, dealt without repeats until the deck or chosen category is spent.",
          "A five-minute round with pause and resume, a guessed or stumped result, a running score, and a fresh role for the next round.",
          "Svelte 5 with runes and snippets, compiled by a small loader and mounted from a React shell.",
          "A separate Vitest project for Svelte components, with an axe check.",
        ]}
        couldImprove={[
          "It is one shared device: Player B has to look away while A reads the role.",
          "The deck is fixed in code, so there is no way to add your own roles.",
        ]}
        upcoming={[
          "Online rooms, so the two players can be in different places and the role is only ever sent to Player A.",
          "A harder mode where Player B gets a limited number of questions.",
        ]}
      />
    </ThoughtLayout>
  );
}
