"use client";

import ThoughtLayout from "@/app/thoughts/ThoughtLayout";
import { WhatsNext } from "@/app/thoughts/_shared/ThoughtUpdates";
import { ChatThread, Timestamp, Sent, Received } from "@/lib/threads";

const code =
  "rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground";

export default function ToDoContent() {
  return (
    <ThoughtLayout
      breadcrumb="To-Do List"
      title="A list I keep, not one I tick"
      intro={
        <>
          <code className={code}>/to-do</code> started as a read-only page over
          a table I seeded with a script. It rendered what was outstanding and
          let me tick things off, which sounds like a to-do list and is not
          quite one: everything on it had to be put there by me running SQL. The
          gap that actually mattered was not a feature, it was that noting
          something down cost more than the thought was worth, so things stayed
          in my head instead.
        </>
      }
      chat={
        <ChatThread>
          <Timestamp>Today 2:04 PM</Timestamp>

          <Received pos="first">
            can you add and remove items from the page yet
          </Received>
          <Received pos="last">
            it&apos;s my list that you tick, rather than mine to keep
          </Received>

          <Sent>quick add. title and project, everything else optional</Sent>

          <Received>why not the full form</Received>

          <Sent pos="first">
            because the point is a thought gets recorded when you have it
          </Sent>
          <Sent pos="last">
            a form with seven fields does not get used for that. detail and the
            PR link get filled in later
          </Sent>

          <Timestamp>2:11 PM</Timestamp>

          <Received>and delete</Received>

          <Sent pos="first">
            soft. the remove control sits next to the tick checkbox, so a
            mis-click has to survive
          </Sent>
          <Sent pos="last">
            and the record of what was once planned is worth keeping even after
            the item stops mattering
          </Sent>
        </ChatThread>
      }
    >
      <section>
        <h2 className="mb-3 text-lg font-bold">
          Position is the server&apos;s to give
        </h2>
        <p className="text-muted">
          Items sit in phases, ordered by a <code className={code}>position</code>{" "}
          column, and the ordering is most of what the page is for. The obvious
          implementation reads the current maximum, adds one, and writes it
          back. Two adds arriving together both read the same maximum and both
          claim the same slot.
        </p>
        <p className="mt-3 text-muted">
          So the position is computed inside the insert rather than around it:
        </p>
        <pre className="mt-3 overflow-x-auto rounded-lg bg-surface p-3 text-[13px] font-mono text-foreground">
          {`INSERT INTO todos (project, phase, title, detail, position)
SELECT $1, $2, $3, $4, COALESCE(MAX(position), 0) + 1
  FROM todos
 WHERE phase = $2
RETURNING *`}
        </pre>
        <p className="mt-3 text-muted">
          One statement, so there is no window between reading and writing. The
          client never sends a position and the create schema rejects the field
          outright rather than ignoring it, because a silently dropped field
          looks like it worked from the caller&apos;s side.
        </p>
        <p className="mt-3 text-muted">
          The maximum deliberately counts soft-deleted rows. Skipping them would
          reuse a position that a removed item still holds, and then restoring
          anything later would collide with whatever took its place.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-bold">
          Delete that a mis-click survives
        </h2>
        <p className="text-muted">
          Removing sets <code className={code}>deleted_at</code> rather than
          deleting the row, and every read filters it out. That decision came
          from the same place as an earlier one on this page: the tick is
          checkbox-only, because a label wrapping the whole row turned every
          stray click while reading into a state change. The remove control
          lives next to that checkbox, so it gets a confirm step and a delete
          that can be undone.
        </p>
        <p className="mt-3 text-muted">
          The guard is the part worth copying:
        </p>
        <pre className="mt-3 overflow-x-auto rounded-lg bg-surface p-3 text-[13px] font-mono text-foreground">
          {`UPDATE todos
   SET deleted_at = NOW(), updated_at = NOW()
 WHERE id = $1
   AND deleted_at IS NULL
RETURNING *`}
        </pre>
        <p className="mt-3 text-muted">
          Without <code className={code}>AND deleted_at IS NULL</code> a second
          delete succeeds quietly and moves the timestamp. With it, the second
          one matches nothing and answers 404, which is the honest response.
          Ticking a row that has been removed is refused for the same reason.
        </p>
        <p className="mt-3 text-muted">
          There is no <code className={code}>deleted_by</code> column. It is a
          single-owner table behind an email allowlist, and an actor column
          would imply a multi-user model that nothing enforces.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-bold">
          The optimistic rollback that removes the wrong row
        </h2>
        <p className="text-muted">
          An added item appears immediately and is reconciled when the server
          answers. The failure path is where the interesting bug lives: the
          obvious rollback drops the last item in the list, which is the right
          row exactly until two adds are in flight, and then it is the other
          person&apos;s work. So the insert carries a temporary id and the
          rollback filters on that id specifically.
        </p>
        <p className="mt-3 text-muted">
          The other half is smaller and matters more in practice. A failed add
          keeps the text in the box and says what happened. Losing a sentence
          you just typed because the network blinked is the kind of small
          betrayal that stops a tool being used, and the input is only cleared
          once the write has really landed.
        </p>
        <p className="mt-3 text-muted">
          Testing that honestly took a change of approach. Asserting the item
          appears proves nothing when the mocked refetch would put it there
          anyway, so the test holds the POST open and never resolves it.
          Anything on screen after that got there optimistically, which is the
          actual claim.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-bold">
          Why the list lives in a database
        </h2>
        <p className="text-muted">
          Both repositories are public, and the list is a record of what has not
          been fixed yet. Committing it to either one would publish the gaps to
          anyone reading the source, so the rows live in Postgres behind the
          same allowlist as the page.
        </p>
        <p className="mt-3 text-muted">
          The awkward consequence is that the list is the one thing about this
          project I cannot hand to a coding agent to read, which is a trade I
          would make again. The interesting part is that the gate is worth
          nothing to anyone holding the database credential directly, which is
          its own write-up.
        </p>
      </section>

      <WhatsNext
        nowShipped={[
          "Quick add: a title and a project, phase defaults to the backlog, so recording a thought costs one sentence.",
          "Soft delete behind a confirm step, hidden by default, with a second delete answering 404 rather than succeeding quietly.",
          "Positions assigned server-side inside the insert, so two adds cannot claim the same slot.",
        ]}
        couldImprove={[
          "There is no editing. Quick add means detail, command and the PR link get filled in later, and later still means running a script.",
          "The PR chip renders portfolio_api#137 as plain text rather than a link, so following it means going to find it by hand.",
          "Soft-deleted rows accumulate with nothing to purge them. Harmless at this size and a real question if the list ever gets long.",
          "detail carries both what to do and why it matters, and those get read at different moments.",
        ]}
        upcoming={[
          "History and comments, designed and deliberately unbuilt. Restoring writes a new revision rather than discarding later ones, so it reverts rather than resets, and comments sit outside revertable state so reverting cannot delete the note explaining why.",
          "Editing an existing item, which pairs naturally with that rather than doubling the add change.",
        ]}
      />
    </ThoughtLayout>
  );
}
