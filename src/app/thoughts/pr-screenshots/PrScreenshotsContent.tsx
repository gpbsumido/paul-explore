import ThoughtLayout from "@/app/thoughts/ThoughtLayout";
import { WhatsNext } from "@/app/thoughts/_shared/ThoughtUpdates";
import styles from "@/app/thoughts/_shared/chat.module.css";
import { ChatThread, Timestamp, Sent, Received } from "@/lib/threads";

const code =
  "rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground";

export default function PrScreenshotsContent() {
  return (
    <ThoughtLayout
      breadcrumb="PR Screenshots From an Unattended Agent"
      title="PR Screenshots From an Unattended Agent"
      intro={
        <>
          A pull request that changes something visible should prove it — a
          before and an after, rendered inline in the description where a
          reviewer already is. Easy in a browser. Hard when the author is an
          unattended agent whose only tool is the{" "}
          <code className={code}>gh</code> CLI, with no session cookie to drag a
          PNG onto. Three clean-looking hosting methods each failed for a
          different reason; the one that works is slightly grubby, and the
          honest move was to admit that rather than dress it up.
        </>
      }
      chat={
        <ChatThread>
          <Timestamp>Today 2:12 PM</Timestamp>

          <Received pos="first">
            the harness should put before/after screenshots in every PR that
            changes the UI
          </Received>
          <Received pos="last">inline in the description, not links</Received>

          <Sent pos="first">
            the problem is the agent has no browser. GitHub&apos;s own image
            upload — the one that gives you user-attachments URLs — only works
            from a logged-in session. it&apos;s not scriptable
          </Sent>
          <Sent pos="last">
            so the image has to already live at some URL the markdown can point
            at, and gh has to be able to put it there
          </Sent>

          <Timestamp>2:15 PM</Timestamp>

          <Received>gist? gh gist create</Received>

          <Sent pos="last">
            tried it. gh gist rejects binary files outright — &quot;binary file
            not supported.&quot; it literally can&apos;t host a PNG
          </Sent>

          <Timestamp>2:16 PM</Timestamp>

          <Received>release assets then. gh release upload works</Received>

          <Sent pos="first">
            it does work, and the CDN URL renders inline. but it&apos;s
            semantically wrong — now every screenshot needs a release tag, and
            the Releases page fills up with junk tags that aren&apos;t releases
          </Sent>
          <Sent pos="last">
            you&apos;d be abusing the releases feature as a blob store to avoid
            abusing git as a blob store. no cleaner, just less obvious
          </Sent>

          <Timestamp>2:19 PM</Timestamp>

          <Received>so what actually worked</Received>

          <Sent pos="first">
            commit the PNGs onto the PR&apos;s own branch, then embed them with
            branch-pinned raw.githubusercontent URLs —
            raw.githubusercontent.com/owner/repo/branch/path
          </Sent>
          <Sent pos="middle">
            because they&apos;re on the branch the PR is built from, they render
            the moment the description loads. this is what paul-explore #237
            actually did — it&apos;s not theoretical
          </Sent>
          <Sent pos="last">
            release PRs (develop→main) don&apos;t re-shoot anything — they reuse
            the develop PR&apos;s images, since the same commits carry them up
          </Sent>

          <Timestamp>2:23 PM</Timestamp>

          <Received>
            doesn&apos;t that leave screenshots sitting in main? delete them at
            release time to keep it clean
          </Received>

          <Sent pos="first">
            that&apos;s the tempting one, and it&apos;s theater. once the blobs
            merge develop→main they&apos;re in git history forever
          </Sent>
          <Sent pos="middle">
            deleting the working-tree copy reclaims nothing — the objects are
            still in the packfile — and it risks breaking a live PR description
            that points at the path
          </Sent>
          <Sent pos="last">
            so we don&apos;t prune. we just keep the shots small. the only
            honest lever is size, not a cleanup ritual that doesn&apos;t clean
          </Sent>

          <Timestamp>2:26 PM</Timestamp>

          <Received>one more thing — the dev overlays</Received>

          <Sent pos="first">
            right. the Next.js dev indicator sits bottom-left and the React
            Query devtools button bottom-right. both get hidden before capture
          </Sent>
          <Sent pos="last">
            a screenshot should show the product, not the tooling parked on top
            of it
          </Sent>

          <div className={styles.typingDots}>
            <span />
            <span />
            <span />
          </div>
        </ChatThread>
      }
    >
      <section>
        <h2 className="mb-3 text-lg font-bold">The requirement</h2>
        <p className="text-muted">
          Any pull request that changes something a user can see should carry
          before/after screenshots <em>inline</em> in the description — not as
          links a reviewer has to open, but as images that render where they are
          already looking. Release PRs (<code className={code}>develop</code> →{" "}
          <code className={code}>main</code>) shouldn&apos;t re-capture
          anything; they should reuse the screenshots from the feature PRs that
          fed into the release.
        </p>
        <p className="mt-3 text-muted">
          The constraint that makes this interesting: the author is the{" "}
          <code className={code}>claude-harness</code> agent. It runs unattended
          and its only lever on GitHub is the <code className={code}>gh</code>{" "}
          CLI. There is no browser, no logged-in session, no cursor to drag a
          file with. Every hosting option has to survive that.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-bold">
          The clean options, and why each failed
        </h2>
        <p className="text-muted">
          Inline images in GitHub markdown need a URL the image already lives
          at. The obvious, tidy ways to produce that URL all fell over:
        </p>
        <p className="mt-3 text-muted">
          <strong>GitHub&apos;s native upload</strong> — the drag-and-drop that
          mints <code className={code}>user-attachments</code> CDN links — is
          the canonical answer. It is a browser-session feature. There is no{" "}
          <code className={code}>gh</code> command and no documented API that
          reproduces it, so an unattended agent simply cannot reach it.
        </p>
        <p className="mt-3 text-muted">
          <strong>
            <code className={code}>gh gist create</code>
          </strong>{" "}
          looks like a free blob host, but it <em>rejects binary files</em>.
          Feed it a PNG and it returns{" "}
          <code className={code}>binary file not supported</code>. It can host
          the markdown, not the image the markdown needs. Dead end.
        </p>
        <p className="mt-3 text-muted">
          <strong>
            Release assets (<code className={code}>gh release upload</code>)
          </strong>{" "}
          actually work — the asset gets a stable CDN URL that renders inline.
          But it is semantically wrong. Every screenshot would need a release to
          attach to, so the Releases page fills with tags that aren&apos;t
          releases. That trades one kind of clutter for a worse one: it hollows
          out a feature that means something. Rejected.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-bold">What actually works</h2>
        <p className="text-muted">
          The one method that reliably renders inline from the CLI: commit the
          PNGs onto the PR&apos;s own branch, then embed them with{" "}
          <em>branch-pinned</em>{" "}
          <code className={code}>raw.githubusercontent.com</code> URLs:
        </p>
        <pre className="mt-3 overflow-x-auto rounded bg-surface px-4 py-3 text-[13px] font-mono text-foreground">
          {`![before](https://raw.githubusercontent.com/<owner>/<repo>/<branch>/<path>)`}
        </pre>
        <p className="mt-3 text-muted">
          Because the image is a real file on the branch the PR is built from,
          it exists the instant the description is rendered — no upload step, no
          external host, nothing that needs a session. This is not theoretical:
          it is exactly what a real prior PR,{" "}
          <code className={code}>paul-explore #237</code>, did.
        </p>
        <p className="mt-3 text-muted">
          The files land at a structured path rather than a bare branch folder:{" "}
          <code className={code}>
            docs/pr-screenshots/&lt;version&gt;/&lt;pr-number&gt;/&lt;feature&gt;/before.png
          </code>{" "}
          — the package version this PR bumps to, then the PR number, then a
          short feature name. Grouping by version keeps every screenshot for a
          release together (a release is one version made of several PRs), and
          the PR number disambiguates within it. The wrinkle: a PR number only
          exists once the PR is open, so the screenshots land in a commit{" "}
          <em>after</em> the PR is created — which the push-early workflow
          already does anyway.
        </p>
        <p className="mt-3 text-muted">
          Release PRs get this for free. A <code className={code}>develop</code>{" "}
          → <code className={code}>main</code> PR carries the same commits that
          already hold the feature PRs&apos; screenshots, so the release
          description reuses those images rather than shooting anything new.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-bold">
          The cleanup ritual we refused to add
        </h2>
        <p className="text-muted">
          The obvious follow-up feels responsible: &quot;delete the screenshots
          from <code className={code}>main</code> at release time so the repo
          stays clean.&quot; It is theater. Once the blobs merge through{" "}
          <code className={code}>develop</code> →{" "}
          <code className={code}>main</code>, they live in git history forever —
          the objects are in the packfile whether or not a working-tree copy
          still points at them.
        </p>
        <p className="mt-3 text-muted">
          So deleting the file reclaims no space and undoes no commit. It only
          adds risk: a live PR description embeds a branch-pinned URL, and
          removing the file underneath it can break that render. We do{" "}
          <em>not</em> prune. The only honest lever on repo weight is keeping
          the screenshots small in the first place, so that is the one we pull.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-bold">Hiding the dev-mode overlays</h2>
        <p className="text-muted">
          A screenshot should show the product, not the tooling sitting on top
          of it. Before capture, the harness hides the two dev-mode overlays:
          the Next.js dev indicator in the bottom-left corner and the React
          Query devtools button in the bottom-right. Otherwise the
          &quot;after&quot; image documents the dev chrome instead of the UI
          change under review.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-bold">The meta-lesson</h2>
        <p className="text-muted">
          The tidiest-looking designs here were the ones that didn&apos;t work
          (user-attachments, gists) or that worked by quietly corrupting another
          feature (release assets). The method we shipped — PNGs on the branch,
          raw URLs pinned to it — is a little grubby, and the temptation was to
          bolt a cleanup step onto it to feel better. But that step cleans
          nothing.
        </p>
        <p className="mt-3 text-muted">
          &quot;Best engineering&quot; sometimes means picking the pragmatic
          method that actually works and being honest about its cost, rather
          than a prettier design that fails or a ritual that only looks like
          hygiene.
        </p>
      </section>
      <WhatsNext
        nowShipped={[
          "A method that actually works from a CLI, arrived at by elimination — gists reject binaries and the drag-drop CDN needs a browser session, so committing the image to the branch is what is left.",
          "URLs pinned to a commit SHA rather than a branch, since a merged branch is deleted and every branch-pinned image silently dies with it.",
          "Dev-mode overlays hidden before capture, so the screenshot shows the product rather than the tooling.",
        ]}
        couldImprove={[
          "The images live in git history permanently, so the repository grows with every visual PR and nothing prunes it.",
          "Capture is manual per PR rather than something CI does, which means it happens when I remember.",
        ]}
        upcoming={[
          "Nothing scheduled. This is a working method, and the honest trigger to revisit it is GitHub changing what is possible.",
        ]}
      />
    </ThoughtLayout>
  );
}
