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
        <p className="mt-3">
          And the city is haunted, gently. A translucent ghost replays your own
          previous stroll — sampled locally, capped, and stored only in your
          browser — or, on a first visit, a generated tour that walks six
          exhibits along real streets. It&rsquo;s the multiplayer-shaped
          feature with zero infrastructure: the recording throttle, snapshot
          shape, and replay interpolation are exactly the pieces a live
          presence layer would reuse.
        </p>
        <p className="mt-3">
          And now it does: with a realtime key configured, other live visitors
          walk the same city as outfit-colored explorers with curated animal
          names — snapshots throttled to ten a second, zod-checked at the
          boundary, interpolated a beat behind so movement stays smooth, gone
          after five silent seconds. Without a key, your own other tabs count
          as company. It all sits behind a real flag in the{" "}
          <Link href="/flags" className="underline underline-offset-2">
            flag console
          </Link>
          , and when the room is empty the ghost takes the shift again.
        </p>
      </Section>

      <Section title="Reasons to keep walking">
        <p>
          Twenty-five TTC tokens are hidden around the city and three of them
          float above the street, so the jump exists for a reason. The minimap
          starts fogged and clears block by block as you walk it, counting only
          cells you can actually stand in — a test derives that set from the
          collision data, so &ldquo;100% explored&rdquo; is a promise the world
          can keep rather than a number that taunts you.
        </p>
        <p className="mt-3">
          Two fixes ride along. The chase camera used to get shoved out of
          building footprints and occasionally lose the explorer behind a
          tower; now it samples its own sightline and shortens the boom until
          you&rsquo;re visible, snapping in fast and easing back out. And the
          fidelity slider no longer starts at a blind guess — a first visit
          reads core count, memory, and pointer type, so phones open low-poly
          and workstations open near the top.
        </p>
      </Section>

      <Section title="City things">
        <p>
          The 501 Queen runs a real timetable — steady between stops, four
          seconds waiting at each — which is what makes it boardable: you walk
          to a stop, the car pulls up, and E puts you on the running board with
          the camera along for the ride. One pure function drives both the car
          you see and the car you&rsquo;re standing on, so they can never
          disagree.
        </p>
        <p className="mt-3">
          At the foot of the CN Tower, E takes the elevator: the camera lifts to
          the pod and the city lays itself out below with every landmark one
          click away. The interact key is context-sensitive now, and the scene
          decides what it means from where you&rsquo;re standing. Elsewhere the
          leaves turn with the calendar, December strings lights over Nathan
          Phillips Square and snow onto the conifers, and five raccoons work
          short patrols that they abandon the instant you get close — the most
          accurate thing in the entire city.
        </p>
      </Section>

      <Section title="Whatever it's doing outside">
        <p>
          The site already knew the visitor&rsquo;s weather — the landing page
          has been using it for ages — so the world just asks the same hook
          and dresses accordingly. Rain goes straight down, snow wanders, fog
          pulls the skyline in close, and a thunderstorm gets a light that
          flashes on an irregular timer. The particle budget rides the fidelity
          slider, and the whole field follows the camera so a few hundred
          points cover a whole city.
        </p>
        <p className="mt-3">
          Photo mode is the other half: <C>P</C> parks the simulation, clears
          the HUD, and hands the camera over to orbit freely. The shutter is
          the interesting part — instead of paying the cost of a preserved
          drawing buffer on every frame forever, it renders one frame
          synchronously and reads it straight back out before the browser
          clears it.
        </p>
      </Section>

      <Section title="A costume you have to earn">
        <p>
          Three of the twenty-five tokens float above the street, and the
          fourth outfit in the picker is a locked <C>???</C>. Collect every
          token you can reach on foot — pointedly not those three — and the
          mystery turns out to be a very tall man. Put him on and the last
          three are simply within reach, no jumping required. The whole loop
          is four small pure functions and it took longer to describe than to
          test.
        </p>
        <p className="mt-3">
          Building him taught me something about rigs: scaling the whole body
          made a giant, not a lanky one. The fix is to keep the torso and head
          ordinary and let only the limbs grow, raising the hips by exactly the
          extra leg length so the feet still meet the pavement. Elsewhere, you
          can now jump onto a passing streetcar and ride the roof, and the
          walk-me-there feature stops on arrival to ask whether you actually
          want to go in — getting somewhere is not the same as agreeing to
          leave.
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
