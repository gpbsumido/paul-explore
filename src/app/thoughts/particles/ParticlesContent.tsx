"use client";

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

export default function ParticlesContent() {
  return (
    <ThoughtLayout
      breadcrumb="Particle Lab"
      title="A Particle Field That Stays Cheap"
      intro={
        <>
          A drifting field of particles with lines drawn between the ones close
          enough to be neighbours, plus live controls for speed, connection
          distance, colour theme, and whether the field reacts to the pointer.
          It is a small page, and the only decision in it worth writing down is
          the one that keeps it smooth.
        </>
      }
    >
      <Section title="Two point clouds, not a mesh per particle">
        <p className="text-muted">
          The naive shape for this is a component per particle, which React and
          three.js will both happily let you write and which falls over at a few
          hundred. Every particle becomes an object with its own draw call, and
          the frame budget goes on overhead rather than pixels.
        </p>
        <p className="mt-3 text-muted">
          Instead the whole field is two{" "}
          <code className={code}>BufferGeometry</code> point clouds &mdash; one
          for the larger &quot;star&quot; particles, one for the small ones
          &mdash; built by writing positions straight into typed arrays. Two
          geometries, two materials, two draw calls, regardless of how many
          points are in them. The particle count becomes a number in an array
          rather than a number of objects, which is the difference between
          scaling and not.
        </p>
      </Section>

      <Section title="The lines are the expensive part">
        <p className="text-muted">
          Connecting near neighbours is what makes the effect read as a network
          rather than static, and it is also the only part with bad asymptotics:
          deciding which pairs are close enough is quadratic in the particle
          count. The point rendering would happily take ten times more
          particles; the line pass is what sets the ceiling.
        </p>
        <p className="mt-3 text-muted">
          So the connection distance is a control rather than a constant. It
          looks like an aesthetic slider and it is really the performance dial
          &mdash; raising it grows the number of qualifying pairs, not the
          number of particles. Keeping that honest and visible felt better than
          picking one value and hiding the tradeoff.
        </p>
      </Section>

      <Section title="Why it is a lab and not a feature">
        <p className="text-muted">
          This page exists to try something, and its write-up should say so
          rather than dress it up. There is no data layer, no persistence and
          nothing to get wrong at the boundary. Filing it under{" "}
          <code className={code}>/lab</code> was deliberate: it sets the
          expectation that the code is a sketch, and it means I do not owe it
          the same architecture as the pages that hold real state.
        </p>
      </Section>

      <WhatsNext
        nowShipped={[
          "Two BufferGeometry point clouds for the whole field rather than an object per particle, so the draw-call count does not grow with the particle count.",
          "Connection distance exposed as a control, because it is the parameter that actually governs cost — the pair check is quadratic while the points are nearly free.",
          "Kept in /lab, which is an honest signal that this is a sketch rather than a feature carrying state.",
        ]}
        couldImprove={[
          "The neighbour search is a plain double loop. A spatial grid would make the line pass roughly linear and lift the ceiling on particle count, which is the one change that would let the field get genuinely dense.",
          "Nothing respects prefers-reduced-motion here. A permanently animating field is exactly the case that setting exists for, and it should stop or slow rather than ignore it.",
          "The controls have no persistence, so a configuration you liked is gone on reload.",
        ]}
        upcoming={[
          "Honour prefers-reduced-motion — that is a correctness fix rather than a nice-to-have, and it is the next thing I will do here.",
          "A spatial grid for the neighbour pass, if I want the field denser than it currently goes.",
        ]}
      />
    </ThoughtLayout>
  );
}
