"use client";

import ThoughtLayout from "@/app/thoughts/ThoughtLayout";
import { WhatsNext } from "@/app/thoughts/_shared/ThoughtUpdates";

/** Inline code, matching the muted-mono treatment the other write-ups use. */
const C = ({ children }: { children: React.ReactNode }) => (
  <code className="font-mono text-foreground/70">{children}</code>
);

/** The macOS menu bar build in the angular-paul desktop clone. */
export default function MacMenuBarContent() {
  return (
    <ThoughtLayout
      breadcrumb="macOS Menu Bar"
      title="macOS Menu Bar"
      intro={
        <>
          The angular-paul desktop clone looked the part until you reached for
          the menu bar &mdash; the strip of Apple / File / Edit / View / Window
          / Help labels along the top was dead paint. This is the pass that
          turned it into a real macOS menu system: a signal-driven service that
          derives every menu from the live window and dock state, dropdowns that
          run actual actions, and keyboard access that holds up to an axe scan
          with a menu open.
        </>
      }
    >
      <section>
        <h2 className="mb-3 text-lg font-bold">The starting point</h2>
        <p className="text-muted">
          The menu bar was the most conspicuously unfinished thing on the
          desktop. It rendered the right words, but nothing was clickable, the
          active-app slot was hardcoded to <C>&quot;Finder&quot;</C> no matter
          what window you had focused, and there were no dropdowns at all. Every
          other part of the shell &mdash; the dock, the windows, the traffic
          lights &mdash; did something. The menu bar just sat there, and it was
          the first place your eye went.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-bold">Derive the menu from state</h2>
        <p className="text-muted">
          The tempting version is to hand-write a static menu tree and wire each
          item to a handler. That falls apart the moment the menu has to reflect
          reality: the active app name, whether there&rsquo;s a window to close
          or minimize, the live list of open windows under the Window menu. All
          of that already lives in <C>WindowManagerService</C> and{" "}
          <C>DockService</C>. So the menu shouldn&rsquo;t own any of it &mdash;
          it should be a <em className="text-foreground/80">projection</em> of
          state that already exists.
        </p>
        <p className="mt-3 text-muted">
          Angular signals make that projection cheap. The whole menu model is a
          set of <C>computed</C> signals reading off the window and dock
          services: the active app name derives from the focused window (falling
          back to &ldquo;Finder&rdquo; when nothing is focused, the way real
          macOS falls back to the Finder), and the per-app File / Edit / View /
          Window / Help menus rebuild themselves whenever the underlying state
          changes. Nothing to keep in sync by hand; the menu is always a pure
          function of the desktop.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-bold">
          A service, not component state
        </h2>
        <p className="text-muted">
          The menu model went into a new <C>MenuBarService</C> (
          <C>providedIn: &quot;root&quot;</C>), not into the component. Two
          reasons. First, the model is derived data that several things may want
          to read, so it belongs where the other derived desktop state lives,
          next to the window and dock services it depends on. Second, it keeps
          the <C>MenuBar</C> component thin: the component renders the model and
          reports clicks, and the service decides what a click{" "}
          <em className="text-foreground/80">means</em>.
        </p>
        <p className="mt-3 text-muted">
          The actions are the part that makes it feel real rather than
          decorative. The Apple menu opens About / Settings / README; the app
          menus close, minimize, zoom, and quit the focused window; the Window
          menu cycles and focuses among the live open windows; and there&rsquo;s
          a Spotlight entry. Each is a small method on the service operating on
          the same window and dock state the menus are derived from, so the menu
          you see and the action you get can never drift apart.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-bold">
          Keyboard and screen-reader access
        </h2>
        <p className="text-muted">
          A menu bar is a classic a11y trap: it&rsquo;s trivial to build one
          that only works with a mouse. This one was built to the menu pattern
          from the start. Top-level menus are real <C>&lt;button&gt;</C>{" "}
          elements with <C>aria-haspopup</C> and <C>aria-expanded</C>; open
          dropdowns are <C>role=&quot;menu&quot;</C> with{" "}
          <C>role=&quot;menuitem&quot;</C> children, each a native button so
          it&rsquo;s focusable and operable by keyboard, with the shortcut shown
          as a hint.
        </p>
        <ul className="mt-3 space-y-2 text-muted">
          <li>
            <span className="font-semibold text-foreground">
              Escape closes and returns focus
            </span>{" "}
            to the menu that opened it, so a keyboard user is never dumped at
            the top of the document.
          </li>
          <li>
            <span className="font-semibold text-foreground">
              Arrow keys move within a menu
            </span>
            , and hovering a sibling top-level menu while one is open switches
            to it &mdash; the way the real menu bar behaves.
          </li>
          <li>
            <span className="font-semibold text-foreground">
              Click-outside closes
            </span>{" "}
            without stranding focus, and the translucent dropdown styling
            matches the desktop&rsquo;s existing visual language rather than
            inventing a new one.
          </li>
        </ul>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-bold">
          What shipped, and how it&rsquo;s verified
        </h2>
        <p className="text-muted">
          The suite went from 229 to 252 tests: 14 new <C>MenuBarService</C>{" "}
          unit tests covering the derived model and every action, new
          interaction tests for the <C>MenuBar</C> component, and an added axe
          scan of the menu bar{" "}
          <em className="text-foreground/80">with a menu open</em> &mdash; the
          state most menu-bar a11y tests skip. All 252 pass, ESLint is clean
          over <C>src/</C>, <C>tsc --noEmit</C> is clean, and the production
          build succeeds. WCAG 2.1 AA holds with the menu expanded, not just
          closed.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-bold">One thing to watch</h2>
        <p className="text-muted">
          The eager bundle grew slightly and the production build now emits a
          soft budget <em className="text-foreground/80">warning</em> (406 kB
          against the 400 kB warn threshold, still well under the 500 kB error
          ceiling). CI has no build step, so nothing gates on it today, but it
          tells you the shell is getting heavy. If more lands in the desktop
          chrome, that warning is the first place a real budget problem will
          show up.
        </p>
      </section>
      <WhatsNext
        nowShipped={[
          "The menu derived from state rather than assembled imperatively, so what is enabled and what is checked cannot drift from what is true.",
          "A faithful reproduction used as a constraint — matching a well-known interface forces the details that get skipped when inventing one.",
        ]}
        couldImprove={[
          "Keyboard traversal is partial. A real menu bar is fully operable from the keyboard, and this is closer to mouse-first with keyboard support.",
          "The menu model is local to this page rather than a primitive anything else could use.",
        ]}
        upcoming={[
          "Nothing scheduled. It is a faithful reproduction that has not needed changing, which is the honest status.",
        ]}
      />
    </ThoughtLayout>
  );
}
