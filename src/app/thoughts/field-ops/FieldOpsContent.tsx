import ThoughtLayout from "@/app/thoughts/ThoughtLayout";
import { WhatsNext } from "@/app/thoughts/_shared/ThoughtUpdates";

const code =
  "rounded bg-surface px-1 py-0.5 text-[13px] font-mono text-foreground";

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

/** One decision, laid out the way I would talk it through out loud. */
function Decision({
  title,
  chose,
  instead,
  pros,
  cons,
}: {
  title: string;
  chose: string;
  instead: string;
  pros: string;
  cons: string;
}) {
  return (
    <div className="mt-4 rounded-xl border border-border bg-surface p-4">
      <h3 className="mb-2 text-[15px] font-semibold text-foreground">{title}</h3>
      <p className="text-muted">
        <span className="font-semibold text-foreground">I chose:</span> {chose}
      </p>
      <p className="mt-2 text-muted">
        <span className="font-semibold text-foreground">Instead of:</span> {instead}
      </p>
      <p className="mt-2 text-muted">
        <span className="font-semibold text-foreground">Good:</span> {pros}
      </p>
      <p className="mt-2 text-muted">
        <span className="font-semibold text-foreground">Costs me:</span> {cons}
      </p>
    </div>
  );
}

export default function FieldOpsContent() {
  return (
    <ThoughtLayout
      breadcrumb="Field Ops"
      title="A Field Console That Tells the Truth"
      intro={
        <>
          I wanted to practise the kind of screen where a wrong or missing
          update has a real cost: live tracks on a 3D map, a camera tile and an
          alert queue, fed by a stream. Every number is fake. The decisions
          about what the screen does when the data is bad are not, and this page
          is those decisions, with what I turned down and what each one costs.
        </>
      }
    >
      <Section title="Who is looking at this screen">
        <p className="text-muted">
          I started from the person, not the map. Someone watching a field
          picture is partway through something else: a radio in one hand, a
          small screen, a bad link, maybe gloves. They are not exploring. They
          are asking three questions over and over: where is everyone, is
          anything wrong, and can I trust what I am looking at right now. Every
          decision below is an answer to the third one.
        </p>
        <p className="mt-3 text-muted">
          What I prioritised, in order: honesty about data quality, then a
          missed alert being hard to do by accident, then working with a
          keyboard and a screen reader, then working on a thin link, then
          looking good. The map is last on purpose. It is the part that gets
          noticed and the part that matters least when something goes wrong.
        </p>
      </Section>

      <Section title="How the pieces fit, and how I got there">
        <p className="text-muted">
          The shape is a chain with one job per link. portfolio_api owns the
          feed: a pure function of the clock behind{" "}
          <code className={code}>/api/field-ops/snapshot</code> and an SSE{" "}
          <code className={code}>/stream</code>. The Next app proxies both
          same-origin, which is the pattern every other route here already
          uses, so the backend address never reaches the browser. A hook
          (<code className={code}>useFieldOpsFeed</code>) owns the connection and
          tells the truth about it. A pure reducer (<code className={code}>feedState</code>)
          owns what the screen believes. The console, the map and the video tile
          only render that belief.
        </p>
        <p className="mt-3 text-muted">
          The order I thought in was the order of failure, not the order of
          data. First what the screen must never get wrong (stale looks fresh, an
          alert slips by), then where that logic can live so a test can reach it
          without a browser (the reducer and the simulation, both pure), then the
          thin impure edges around them (the stream and the WebGL canvas). That
          is why the two files with the most behaviour have no framework in
          them.
        </p>
        <p className="mt-3 text-muted">
          One wrong turn is worth keeping. My first plan put the endpoints in
          the Next app as route handlers, because that was the smallest thing
          with no second deploy. I moved them to portfolio_api because the point
          of the exercise is a client talking to a backend across a real
          boundary, and a feed that lives inside the page&apos;s own server skips
          exactly the failures I wanted to handle: a proxy that buffers, a
          backend that is down, a stream that gets cut. The cost is a deploy
          order (backend first) and a proxy hop, and I would pay it again.
        </p>
        <p className="mt-3 text-muted">
          I also tested it the way it runs, not just through unit tests: the
          real router behind compression, behind the Next proxy, read with curl
          and then in a browser. That caught nothing this time, but it is the
          check that would have caught a buffered stream, and the unit tests
          cannot.
        </p>
      </Section>

      <Section title="The decisions">
        <Decision
          title="Stale data stays on screen, labelled"
          chose="A track that stops reporting keeps its last position, is drawn as a wireframe, and says STALE with its age in words."
          instead="Removing it from the map after a timeout, or fading it with colour alone."
          pros="Nobody mistakes an empty patch of map for an empty field. The screen says what it knows and how old that is."
          cons="The map can look cluttered with ghosts, and I had to pick a threshold (10 seconds) with no real operational number behind it."
        />
        <Decision
          title="An alert needs a person"
          chose="A critical alert sorts first and stays until someone presses Acknowledge. Nothing clears it on a timer, and a repeat of it in the next update does not reset it."
          instead="Auto-dismissing toasts, or clearing an alert when the condition stops being true."
          pros="Missing one takes an action, not a distraction. The log of what was acknowledged is honest."
          cons="A noisy feed fills the queue with things someone has to touch. That is the right failure, but it means alert volume has to be designed, not hoped for."
        />
        <Decision
          title="The list is the real interface, the map is a view of it"
          chose="Every fact on the map is also a button in the track list, with the same status in words. The map is labelled as a picture of that list."
          instead="A map-first design where selecting means clicking a marker in WebGL."
          pros="Works from the keyboard and a screen reader, survives WebGL failing, and is faster to scan than hunting for a marker."
          cons="Two ways to see the same thing, so I have to keep them in step. A single reducer feeds both, which is why that stays cheap."
        />
        <Decision
          title="Colour is never the only signal"
          chose="Shape for what a track is (box, cone, diamond), text for its state, and a severity word on every alert."
          instead="Red, amber and green on identical dots."
          pros="Readable in sunlight, in a colour-blind palette, and when I am wrong about the contrast."
          cons="More visual vocabulary to teach, and shapes get small at a distance."
        />
        <Decision
          title="Real endpoints on a fake feed, in portfolio_api"
          chose="The simulation lives in portfolio_api as GET /api/field-ops/snapshot and an SSE GET /api/field-ops/stream. The Next app proxies them same-origin."
          instead="Route handlers inside the Next app, or a mock that lives only in the browser."
          pros="The client talks to a real network boundary, so reconnects, buffering and failure are real. The backend owns the feed the way a real one would."
          cons="Two PRs and a deploy order to respect, and a proxy hop that can buffer a stream if I am careless. I set no-transform on both sides for that."
        />
        <Decision
          title="Server-sent events, not WebSockets"
          chose="One-way SSE through EventSource."
          instead="WebSockets, or polling the snapshot every second."
          pros="Reconnect, retry delay and framing come with the browser. It is plain HTTP, so it goes through the proxy and compression rules I already have. The data only flows one way, so I do not need a duplex channel."
          cons="No client-to-server messages on the same channel. Acknowledging an alert is local state today, and a real one would POST it. Browsers also cap open connections per origin on old HTTP versions."
        />
        <Decision
          title="A pure simulation of the clock"
          chose="The clock goes in, the whole picture comes out, nothing is stored."
          instead="A stateful simulator ticking in memory, or rows in Postgres."
          pros="Every instance agrees, it is testable with no sockets or timers, and there is no migration."
          cons="No history, so no track trails. That is the next thing an operator would ask for and it would need state."
        />
        <Decision
          title="Smooth on the map, calm in React"
          chose="Updates land once a second into a reducer. Markers ease toward their targets inside useFrame, so React renders once per message and WebGL animates in between."
          instead="Setting positions in state every frame, or snapping markers on each update."
          pros="The page stays responsive as data streams in, and a dropped frame never delays handling an alert."
          cons="What is drawn is slightly behind what was received. For a real system I would show the report time next to the marker, which the list already does."
        />
        <Decision
          title="Low bandwidth is a switch, not a guess"
          chose="One checkbox reopens the stream at one update every 5 seconds and pauses the video tile first."
          instead="Detecting the connection type automatically."
          pros="The operator knows why the screen got slower, and video is the cheapest thing to give up first."
          cons="Someone has to turn it on. Detecting a bad link and offering the switch would be a kindness I have not built."
        />
        <Decision
          title="Say Offline by measuring silence"
          chose="Live while updates arrive, Reconnecting when the stream errors, Offline with the age of the picture after 15 quiet seconds."
          instead="Trusting the connection event alone."
          pros="It works whatever the cause, because it measures what matters: how old what you are looking at is."
          cons="A genuinely quiet field and a dead link look the same until I add a heartbeat frame."
        />
      </Section>

      <Section title="What I was thinking about but did not build">
        <p className="text-muted">
          Real tactical systems exchange messages in schemas like Cursor on
          Target, the XML that TAK clients use. I have not built on TAK. This
          console mimics the shape of the problem, which is a stream of position
          reports and alerts with a report time on every one, and the report
          time is exactly what the stale check leans on. If I wired this to a
          real feed, the work would be mapping that schema into the three
          types in <code className={code}>types.ts</code> and nothing else
          would change.
        </p>
        <p className="mt-3 text-muted">
          Other things on my mind: what happens at 500 tracks (the list needs
          virtualising and the markers need instancing, since six meshes do not
          predict five hundred), how to avoid alert fatigue (grouping, rate
          limits, and not letting a cry-wolf source bury a real one), what a
          clock skew between device and server does to staleness, and how to
          cache the last picture so a reload on a dead link is not a blank page.
        </p>
      </Section>

      <Section title="If I am asked about this in an interview">
        <p className="text-muted">
          <span className="font-semibold text-foreground">High stakes:</span>{" "}
          the stale marker and the acknowledge-only alerts. Both are the same
          idea: the screen must never show a comfortable lie.
        </p>
        <p className="mt-3 text-muted">
          <span className="font-semibold text-foreground">User empathy:</span>{" "}
          I designed for someone with one free hand and a bad link before I
          designed the map, which is why the list leads and the map follows.
        </p>
        <p className="mt-3 text-muted">
          <span className="font-semibold text-foreground">Practical problem solving:</span>{" "}
          the brief was vague, so I picked the smallest thing that has a real
          stream, a real failure mode and a real operator action, and wrote down
          what I cut. I can say what is fake and why that is fine.
        </p>
        <p className="mt-3 text-muted">
          <span className="font-semibold text-foreground">Offline and low bandwidth:</span>{" "}
          the offline status, the slow stream and the paused video. What I did
          not do is cache the last picture across reloads, and I would say so.
        </p>
      </Section>

      <WhatsNext
        nowShipped={[
          "Snapshot and SSE endpoints in portfolio_api over a pure, deterministic simulation, proxied same-origin.",
          "Stale tracks kept at their last position and labelled in words, with the offline banner saying how old the picture is.",
          "Critical alerts that only clear on an explicit acknowledge, reachable by keyboard.",
          "A low bandwidth mode that slows the stream and pauses video.",
        ]}
        couldImprove={[
          "The video tile is a placeholder. A real one needs a stream and its own stalled and buffering states.",
          "Acknowledgement is local. A real console would POST it, show who did it, and reconcile when two people act at once.",
          "Offline is judged by silence. A heartbeat event would separate a quiet field from a dead link.",
          "Nothing survives a reload on a dead link. The last picture should be cached.",
        ]}
        upcoming={[
          "A heartbeat frame on the stream, so offline means the link and not just a quiet minute.",
          "Track trails on the map, with the same text equivalent in the list.",
          "Try 500 simulated tracks and measure the frame time before deciding how to virtualise and instance.",
        ]}
      />
    </ThoughtLayout>
  );
}
