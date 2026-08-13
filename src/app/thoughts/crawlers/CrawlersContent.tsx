"use client";

import ThoughtLayout from "@/app/thoughts/ThoughtLayout";
import { WhatsNext } from "@/app/thoughts/_shared/ThoughtUpdates";
import { ChatThread, Timestamp, Sent, Received } from "@/lib/threads";

/** Inline monospace token, matching the styling used across thoughts pages. */
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

export default function CrawlersContent() {
  return (
    <ThoughtLayout
      breadcrumb="Crawlers"
      title="Telling Crawlers What&rsquo;s Here"
      intro={
        <>
          A full scan of this project turned up something plainer than a bug:
          the site had none of the five files a site is supposed to serve. No{" "}
          <C>robots.txt</C>, no <C>sitemap.xml</C>, no <C>llms.txt</C>, no{" "}
          <C>security.txt</C>, no web manifest. Around sixty write-ups sitting
          behind no map at all. The interesting part was not adding them, which
          takes an afternoon. It was deciding what to leave out, and stopping
          the sitemap from rotting the first time I add a page.
        </>
      }
      chat={
        <ChatThread>
          <Timestamp>Today 2:15 PM</Timestamp>

          <Received pos="first">no robots.txt? really?</Received>
          <Received pos="last">
            thought that was like the first thing you add
          </Received>

          <Sent pos="first">
            it is. and the funny part is the proxy has been excluding{" "}
            <code>/robots.txt</code> from its matcher this whole time — so past
            me clearly meant to write one and never did
          </Sent>
          <Sent pos="last">
            the exclusion was sitting there pointing at a file that didn&apos;t
            exist. a comment about intent, basically
          </Sent>

          <Received>so what goes in it</Received>

          <Sent pos="first">
            the useful question is what stays out. <code>/api</code> returns
            JSON, <code>/dev</code> is skeleton harnesses I use while building
            UI, and <code>/settings</code> and <code>/calendar</code> hand an
            anonymous crawler a login redirect and nothing else
          </Sent>
          <Sent pos="last">
            none of that is secret. it&apos;s just nothing worth spending a
            crawl on. blocking it keeps attention on the write-ups, which are
            the part actually worth finding
          </Sent>

          <Received pos="first">
            isn&apos;t disallowing /settings telling people it exists
          </Received>
          <Received pos="last">
            like a map of where to poke
          </Received>

          <Sent pos="first">
            it is, and that&apos;s fine, because robots.txt was never the thing
            protecting it. auth is. anyone can read the file, and a crawler that
            ignores it faces exactly the same session check as everyone else
          </Sent>
          <Sent pos="last">
            treating robots.txt as security is the actual mistake there. it&apos;s
            a hint about what&apos;s worth indexing, nothing more
          </Sent>

          <Timestamp>2:24 PM</Timestamp>

          <Received>and the sitemap just lists everything?</Received>

          <Sent pos="first">
            everything static and public. dynamic routes are out — there&apos;s
            no single URL for <code>/tcg/pokemon/card/[cardId]</code> to publish
          </Sent>
          <Sent pos="last">
            comes out at 102 URLs, 56 of them write-ups. that ratio is the whole
            argument for having one
          </Sent>

          <Received>
            what stops it going stale when you add a page
          </Received>

          <Sent pos="first">
            a test. it walks <code>src/app</code> for every{" "}
            <code>page.tsx</code>, filters out the dynamic, dev and gated ones,
            and asserts that list equals the one in the source
          </Sent>
          <Sent pos="middle">
            so adding a page without listing it fails a test rather than quietly
            going unindexed. which is the failure mode that matters — nothing
            about a stale sitemap is visible from the outside
          </Sent>
          <Sent pos="last">
            and I checked the test can actually fail. deleted a route from the
            list, watched it go red, put it back. a guard you haven&apos;t seen
            fail isn&apos;t a guard
          </Sent>

          <Timestamp>2:31 PM</Timestamp>

          <Received>what&apos;s llms.txt, that&apos;s new</Received>

          <Sent pos="first">
            a convention for telling language models what a site is, instead of
            making them infer it from markup. same spirit as robots.txt, aimed
            at a different reader
          </Sent>
          <Sent pos="last">
            for this site it&apos;s worth having, because the obvious summary is
            wrong. the features look like the point and they aren&apos;t —
            they exist so there&apos;s something real to write about. so the file
            says that outright: summarise the write-ups, not the feature list
          </Sent>

          <Received>and security.txt needs your email right</Received>

          <Sent pos="first">
            it needs a contact, not an email. this repo is public, and an address
            committed here is published to every scraper that walks GitHub —
            permanently, since deleting it later leaves it in the history
          </Sent>
          <Sent pos="last">
            so it points at GitHub&apos;s private advisory form. reaches me,
            publishes nothing. the same reasoning already applied to the research
            allowlist, so it was a rule I&apos;d written down and could just
            follow
          </Sent>
        </ChatThread>
      }
    >
      <Section title="What was missing">
        <p className="mb-3 text-muted">
          Five files, none of them present, all of them standard:
        </p>
        <ul className="mt-2 space-y-2 text-muted">
          <Bullet>
            <C>robots.txt</C> — nothing told a crawler which parts of a
            hundred-plus routes were worth its time.
          </Bullet>
          <Bullet>
            <C>sitemap.xml</C> — around sixty write-ups, reachable only by
            following links from the home page.
          </Bullet>
          <Bullet>
            <C>llms.txt</C> — the emerging convention for telling a language
            model what a site actually is.
          </Bullet>
          <Bullet>
            <C>/.well-known/security.txt</C> — RFC 9116, a stated way to report
            something without guessing at an address.
          </Bullet>
          <Bullet>
            A web manifest — the icons already existed as <C>icon.tsx</C> and{" "}
            <C>apple-icon.tsx</C>, so &ldquo;Add to Home Screen&rdquo; produced
            an untitled shortcut with nothing to name it.
          </Bullet>
        </ul>
      </Section>

      <Section title="The decisions worth writing down">
        <ul className="mt-2 space-y-2 text-muted">
          <Bullet>
            <strong className="text-foreground">
              robots.txt is a hint, not a fence.
            </strong>{" "}
            Disallowing <C>/settings</C> does advertise that it exists. That is
            fine: the session check is what protects it, and a crawler ignoring
            the file meets exactly the same check. The mistake would be treating
            the file as the protection.
          </Bullet>
          <Bullet>
            <strong className="text-foreground">
              No <C>lastModified</C> in the sitemap.
            </strong>{" "}
            The honest value is unknown, and a build timestamp on every URL
            claims every page changed whenever anything did. A crawler that
            learns the dates are noise stops trusting them, which is worse than
            saying nothing. Priority is omitted for the same reason.
          </Bullet>
          <Bullet>
            <strong className="text-foreground">
              The route list is a literal, and a test walks the filesystem.
            </strong>{" "}
            The sitemap runs in the Next runtime, where reading <C>src/app</C>{" "}
            is not something to depend on — so the list is source, and the drift
            is what gets tested. Adding a page without listing it fails a test.
          </Bullet>
          <Bullet>
            <strong className="text-foreground">
              <C>display: &quot;browser&quot;</C>, not standalone.
            </strong>{" "}
            Standalone strips the address bar. This is a set of linked pages
            meant to be navigated and shared, and taking away back, forward, and
            the URL would make it worse rather than more app-like.
          </Bullet>
          <Bullet>
            <strong className="text-foreground">
              A contact that isn&apos;t an email.
            </strong>{" "}
            The repo is public, so <C>security.txt</C> points at GitHub&apos;s
            private advisory form. It reaches me and publishes nothing.
          </Bullet>
        </ul>
      </Section>

      <WhatsNext
        nowShipped={[
          "The five files a site is supposed to serve, after a scan found none of them present — and a proxy matcher that had been excluding /robots.txt for a file that was never written.",
          "A sitemap of 102 URLs, 56 of them write-ups, which is the ratio that makes having one worth the trouble.",
          "A test that walks src/app and fails when the sitemap list and the pages on disk disagree, checked by deleting a route and watching it go red — a guard nobody has seen fail is not a guard.",
          "metadataBase, which Next had been warning about: without it every relative metadata URL resolves against localhost.",
        ]}
        couldImprove={[
          "security.txt carries a hard-coded Expires date. RFC 9116 requires one, and the failure mode is silent — it lapses and nothing says so.",
          "llms.txt is hand-written prose that names specific write-ups, so it drifts the moment one is renamed. The sitemap has a test for exactly this and this file does not.",
          "Nothing verifies the sitemap URLs actually resolve. A route deleted without updating the list would publish a page of 404s and no test would notice.",
        ]}
        upcoming={[
          "A check that every sitemap URL returns 200, which the e2e suite is already positioned to do.",
        ]}
      />
    </ThoughtLayout>
  );
}
