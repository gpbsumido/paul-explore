"use client";

import Link from "next/link";
import ThoughtLayout from "@/app/thoughts/ThoughtLayout";

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

export default function WorldThoughtsContent() {
  return (
    <ThoughtLayout
      breadcrumb="Explore Toronto"
      title="Explore Toronto"
      intro={
        <>
          A site map you walk through.{" "}
          <Link href="/world" className="underline underline-offset-2">
            Explore Toronto
          </Link>{" "}
          is a low-poly downtown at night — real streets, real landmarks —
          where each feature of this site gets an exhibit at the landmark that
          suits it: Web Vitals on the Yonge-Dundas billboards, the design
          system at OCAD, fantasy NBA at the arena. WASD to walk, E to step
          into a feature. This is how a &ldquo;game&rdquo; fits into a codebase
          that insists on TDD and pure functions.
        </>
      }
    >
      <Section title="The game is a pure function; the scene is a shell">
        <p>
          Nothing in the render loop makes decisions. All of it lives in{" "}
          <C>src/lib/world</C> as plain data-in data-out functions:{" "}
          <C>input</C> turns held keys into a normalized move vector,{" "}
          <C>movement</C> integrates one frame of acceleration, friction,
          turning, and bounds, <C>colliders</C> resolves a circle against
          building footprints with sliding, and <C>proximity</C> answers
          &ldquo;which exhibit is the player standing at.&rdquo; The R3F
          component calls <C>stepPlayer</C> once per frame and copies the
          result onto three.js objects — that&rsquo;s its whole job.
        </p>
        <p className="mt-3">
          That split is what made TDD possible for a feature that looks
          untestable. The movement spec reads like game-feel requirements:
          diagonals aren&rsquo;t faster, top speed is asymptotic, turning takes
          the shortest arc across the ±π seam, a huge <C>dt</C> after a tab
          switch can&rsquo;t teleport you, and two 30fps frames land where one
          60fps pair does. jsdom never has to mount a canvas.
        </p>
      </Section>

      <Section title="Toronto out of boxes">
        <p>
          The city is data first: a street grid named after the real one
          (Yonge, Queen, Spadina, University, Front) and hand-placed landmark
          plots, then a seeded generator fills the blocks between roads with
          towers. The seed is 416, obviously. Because generation is
          index-based and deterministic, the skyline is identical on every
          load — and snapshot-tested.
        </p>
        <ul className="mt-3 space-y-2">
          <Bullet>
            Landmarks are bespoke primitive builds: the CN Tower&rsquo;s pod
            and blinking beacon, City Hall&rsquo;s two curved half-pipe towers
            around the saucer, OCAD&rsquo;s checkered tabletop on colored
            stilts (no collider — you can walk under it, like in life), the
            Gooderham flatiron as an extruded wedge, a TTC streetcar shuttling
            along Queen.
          </Bullet>
          <Bullet>
            Integrity tests keep the fiction honest: every exhibit&rsquo;s{" "}
            <C>featureId</C> must exist in <C>FEATURES</C>, stand on ground
            the collision system says is reachable, sit inside the world
            bounds, and keep enough distance from its neighbours that two
            placards can never fight over the player.
          </Bullet>
          <Bullet>
            No textures were downloaded. Window grids, the TORONTO sign&rsquo;s
            multicolored letters, billboard ads, and OCAD&rsquo;s checker are
            all generated on a canvas at mount, hash-seeded so they never
            flicker between loads.
          </Bullet>
        </ul>
      </Section>

      <Section title="Keeping 60fps honest">
        <p>
          The whole generic skyline is one instanced mesh — one draw call with
          per-instance color, windows via a shared emissive texture. Exhibit
          dioramas animate only when the player is within thirty units, so a
          dozen idle <C>useFrame</C> callbacks cost a distance check each.
          There are exactly two real lights plus a lantern point light that
          follows the player; shadows are faked with blob circles. The canvas
          pauses entirely if it scrolls out of view, and reduced-motion turns
          off every ambient animation while leaving the world fully walkable.
        </p>
      </Section>

      <Section title="The toys on top">
        <p>
          The world dresses for your clock — day, golden hour, or night,
          computed from local time with night as the fallback. A fidelity
          slider scales every curve from chunky low-poly to very smooth (it
          feeds a context inside the canvas that geometry segment counts read).
          The explorer has a wardrobe — Jays, Raptors, Tempo, and a silver
          number 1 — plus a jump with real gravity in the tested core. And the
          exhibit list doesn&rsquo;t teleport: it speed-runs the character
          through the actual street grid, planned by a tiny road-graph router,
          before opening the feature.
        </p>
      </Section>

      <Section title="A 3D page that screen readers can use">
        <p>
          The canvas is decoration by ARIA standards, so everything it can do
          has a DOM twin: an &ldquo;All exhibits&rdquo; panel lists every
          feature as a real link with its landmark, the placard that slides up
          near an exhibit contains a real <C>&lt;Link&gt;</C> next to the E
          shortcut, and the minimap is labeled SVG built from the same road
          data as the world. Touch devices get a pointer-events joystick
          instead of the keyboard legend.
        </p>
      </Section>
    </ThoughtLayout>
  );
}
