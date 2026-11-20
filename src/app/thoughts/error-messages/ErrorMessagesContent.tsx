import Link from "next/link";
import ThoughtLayout from "@/app/thoughts/ThoughtLayout";
import { WhatsNext } from "@/app/thoughts/_shared/ThoughtUpdates";

/** Inline code chip, matching the rest of the write-ups. */
const C = ({ children }: { children: React.ReactNode }) => (
  <code className="rounded bg-surface px-1 py-0.5 font-mono text-[13px] text-foreground">
    {children}
  </code>
);

const pre =
  "mt-3 overflow-x-auto rounded-lg bg-surface p-3 text-[13px] font-mono text-foreground";

const beat = "mt-6 mb-2 text-[15px] font-semibold text-foreground";

const linkClass = "text-primary-600 hover:underline dark:text-primary-400";

/**
 * The write-up on error messages people can read: the calendar create that
 * failed after it worked, the toast that dumped a validation error, and what to
 * check when an AI wrote the error handling.
 */
export default function ErrorMessagesContent() {
  return (
    <ThoughtLayout
      breadcrumb="Error Messages"
      title="Errors people can read"
      intro={
        <>
          I created a calendar on the live site and it said it couldn&rsquo;t
          save. A toast slid up holding a wall of JSON about{" "}
          <C>calendar.role</C>. The calendar had been created. Two separate
          bugs were hiding behind that one screen, and the one I want to write
          about is the second: the page was willing to show a person a
          developer&rsquo;s diagnostic as if it were a message to them. Nobody
          had ever looked at it, including the AI that helped write the code
          around it.
        </>
      }
    >
      <section>
        <h2 className="mb-3 text-lg font-bold">
          The calendar was created, and the page said it wasn&rsquo;t
        </h2>
        <p className="text-muted">
          This is what the toast said, character for character:
        </p>
        <pre className={pre}>
          {`[
  {
    "code": "invalid_value",
    "values": [ "owner", "editor", "viewer" ],
    "path": [ "calendar", "role" ],
    "message": "Invalid option: expected one of \\"owner\\"|\\"editor\\"|\\"viewer\\""
  }
]`}
        </pre>
        <p className="mt-3 text-muted">
          Under it, the modal said &ldquo;Couldn&rsquo;t save the calendar.
          Please try again.&rdquo; Trying again was the wrong advice. The insert
          had already committed, so a retry would have made a second calendar.
          A write that succeeded, reported as a failure, with an invitation to
          do it twice.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-bold">Two bugs wearing one message</h2>

        <h3 className={beat}>The API answered with a row that had no role</h3>
        <p className="text-muted">
          The web app checks every response body against a schema, and the
          calendar schema requires a <C>role</C>. The list query gets one from
          a membership join. A create doesn&rsquo;t join anything: it returns
          the row it just wrote, and the <C>calendars</C> table has no role
          column. The mapper that builds the response had been written to
          tolerate that:
        </p>
        <pre className={pre}>
          {`role: row.role ?? undefined,`}
        </pre>
        <p className="mt-3 text-muted">
          Tolerant on the API side, strict on the web side, and neither noticed
          the other. The schema threw after the write. Editing a calendar did
          the same thing for the same reason. Only the owner can make either
          call, so the role was always knowable. The API now says{" "}
          <C>owner</C>, and the web app treats a missing role on those two
          responses as the caller&rsquo;s own, so whichever deploys first
          doesn&rsquo;t matter.
        </p>

        <h3 className={beat}>The toast showed whatever the error said</h3>
        <p className="text-muted">
          That is the part I would have missed if I had only fixed the role.
          The global handler for a failed write looked like this:
        </p>
        <pre className={pre}>
          {`const message =
  error instanceof Error && error.message
    ? error.message
    : "Something went wrong. Please try again.";
toast.error(message);`}
        </pre>
        <p className="mt-3 text-muted">
          A <C>ZodError</C> is an <C>Error</C>, and its <C>message</C> is the
          JSON of every issue it found. So the check I had written, &ldquo;is
          there a message?&rdquo;, passed, and the JSON went to the screen. The
          docstring above it says the goal out loud: no API failure is silent.
          It was true. Nothing was silent. Some of it was unreadable.
        </p>
        <p className="mt-3 text-muted">
          The test for it had the same blind spot. It threw{" "}
          <C>new Error(&quot;You already have an active season wallet&quot;)</C>{" "}
          and asserted that sentence appeared, which proves messages somebody
          wrote reach the screen. It said nothing about messages nobody wrote
          for a person.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-bold">The rule I ended up with</h2>
        <p className="text-muted">
          There are really three kinds of thing that get thrown, and a person
          should only ever read the first:
        </p>
        <ul className="mt-3 space-y-2 text-muted">
          <li>
            <strong className="text-foreground">Written for people.</strong>{" "}
            <C>new Error(&quot;You already have an active season wallet&quot;)</C>.
            It shows as written.
          </li>
          <li>
            <strong className="text-foreground">A diagnostic.</strong> A{" "}
            <C>ZodError</C> (the response didn&rsquo;t match what the code
            expects), a <C>SyntaxError</C> (an error page came back where JSON
            was expected), a <C>TypeError</C> (<C>fetch</C> rejected). These go
            to the console with the original error attached, and the person
            reads the screen&rsquo;s own fallback. A rejected fetch gets its own
            line, because &ldquo;couldn&rsquo;t reach the server&rdquo; is
            something they can act on.
          </li>
          <li>
            <strong className="text-foreground">Not an error at all.</strong> A
            thrown string or <C>undefined</C>. Fallback.
          </li>
        </ul>
        <p className="mt-3 text-muted">
          That became one function, <C>userFacingErrorMessage(error, fallback)</C>.
          The toast uses it, the query hooks use it, and so do the dozen places
          that had been rendering <C>error.message</C> themselves: the fantasy
          pages, the gallery wall, the calendar invite, the restock flow. After
          the sweep a search for <C>error.message</C> in the client finds only
          messages written on purpose. The{" "}
          <Link href="/thoughts/error-toasts" className={linkClass}>
            toast write-up
          </Link>{" "}
          has the original reasoning for catching every failed write in one
          place; this is the other half of it, deciding what that place is
          allowed to say.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-bold">
          Looking for the same bug somewhere else
        </h2>
        <p className="text-muted">
          A write that succeeds and then throws while reading its own response
          is a pattern, so I went looking. I read every write across both repos
          whose response is validated or has fields read off it, about two
          dozen, and compared what the schema requires with what the API
          really sends: flags, operator, restock, budget, ZeroProof, check-in,
          gallery walls, calendar events, cards and countdowns. Two were wrong,
          and they were the two calendar ones. Everything else matched.
        </p>
        <p className="mt-3 text-muted">
          It also turned up things that weren&rsquo;t that bug but sit next to
          it. The operator proxy catches any error from a write, including a
          failed validation, and falls back to demo data, which can turn a
          write that landed into a &ldquo;not found&rdquo;. The API&rsquo;s own
          validation errors read like <C>calendar.role: Invalid option</C>. And
          one calendar card update builds its query with a placeholder style
          the database library doesn&rsquo;t read. None of those are fixed in
          this change. They are written down where I will find them.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-bold">
          Watch for this when an AI is writing the code
        </h2>
        <p className="text-muted">
          This is the part I most want to keep. The error handling here was
          written with an AI assistant, and it did the thing I asked: every
          failure surfaced. The tests proved a message was shown. The audit I
          ran across the codebase afterwards found thirteen bugs that were each
          a failure dressed up as a plausible result, and this one was not on
          the list, because it is the opposite. A failure dressed up as
          internals. Nobody, human or otherwise, had looked at the screen.
        </p>
        <p className="mt-3 text-muted">
          I don&rsquo;t think that is an accident. An assistant optimises for
          the goal in the prompt and for tests that go green. &ldquo;No failure
          is silent&rdquo; is checkable in code. &ldquo;A person can understand
          and act on what they see&rdquo; is not, unless you make it so. The
          code reads fine, the types are fine, the test is fine, and the page
          is bad. Things I check now:
        </p>
        <ul className="mt-3 space-y-2 text-muted">
          <li>
            <strong className="text-foreground">Make the failure happen and read it.</strong>{" "}
            For every error path, force the failure in a real browser and look
            at what a person gets. A test that asserts a message exists is not
            the same as a message that makes sense.
          </li>
          <li>
            <strong className="text-foreground">Ask who wrote the string.</strong>{" "}
            Anywhere <C>error.message</C> reaches the screen, someone has to
            have written that sentence for a reader. If the answer is a
            library, it is a leak.
          </li>
          <li>
            <strong className="text-foreground">Check what a retry would do.</strong>{" "}
            &ldquo;Please try again&rdquo; on an error that arrived after the
            write committed is an instruction to duplicate it.
          </li>
          <li>
            <strong className="text-foreground">Compare the schema with the producer, not the consumer.</strong>{" "}
            A client schema that requires a field the server only sometimes
            sends will pass every test where the test data was written by the
            same hand as the schema.
          </li>
          <li>
            <strong className="text-foreground">Say what you mean in the prompt.</strong>{" "}
            &ldquo;Show errors&rdquo; got me errors. &ldquo;Show errors a
            non-developer can act on, and put the detail in the console&rdquo;
            is a different requirement, and it needs its own test.
          </li>
        </ul>
      </section>

      <WhatsNext
        nowShipped={[
          "One function decides what an error is allowed to say, and every place that showed error.message goes through it.",
          "Creating or editing a calendar no longer fails after it worked, on either side of the API.",
        ]}
        couldImprove={[
          "The API's validation messages are still a path and a library string. They should be a sentence.",
          "The operator proxy should surface a validation failure after a write instead of falling back to demo data.",
          "A lint rule against rendering error.message, so the next one is caught before a person sees it.",
        ]}
      />
    </ThoughtLayout>
  );
}
