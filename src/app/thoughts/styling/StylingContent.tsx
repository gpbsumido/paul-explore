"use client";

import { useState } from "react";
import Link from "next/link";
import { Button, Input, Modal } from "@/components/ui";
import ThemeToggle from "@/components/ThemeToggle";
import styles from "./styling.module.css";
import { Timestamp, Sent, Received } from "@/lib/threads";

export default function StylingContent() {
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [inputError, setInputError] = useState("");

  function handleLoadingDemo() {
    setLoading(true);
    setTimeout(() => setLoading(false), 2000);
  }

  function handleInputDemo(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    if (val.length > 0 && val.length < 3) {
      setInputError("Must be at least 3 characters");
    } else {
      setInputError("");
    }
  }

  return (
    <div className={styles.phone}>
      {/* ---- Top bar ---- */}
      <div className={styles.topBar}>
        <Link href="/" className={styles.backLink}>
          <svg width="10" height="16" viewBox="0 0 10 16" fill="none">
            <path
              d="M9 1L2 8l7 7"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          &nbsp;Home
        </Link>
        <div className={styles.contactInfo}>
          <span className={styles.contactName}>Styling Decisions</span>
          <span className={styles.contactSub}>iMessage</span>
        </div>
        <div className={styles.themeBtn}>
          <ThemeToggle />
        </div>
      </div>

      {/* ---- Chat ---- */}
      <div className={styles.chat}>
        <Timestamp>Today 2:41 PM</Timestamp>

        {/* ---- The starting point ---- */}
        <Received pos="first">
          so what was the styling situation before you started
        </Received>
        <Received pos="last">like what were you working with</Received>

        <Sent pos="first">
          CSS Modules. each page had its own <code>.module.css</code> with
          hardcoded hex colors
        </Sent>
        <Sent pos="middle">
          dark mode was just a <code>prefers-color-scheme</code> media query. no
          way to toggle it manually
        </Sent>
        <Sent pos="last">I had to copy-paste values for every new page</Sent>

        {/*<Reaction side="sent">yikes</Reaction>*/}

        <Received>what did you actually build then</Received>

        {/* ---- What was built ---- */}
        <Sent pos="first">four layers basically</Sent>
        <Sent pos="middle">
          1. <strong>design tokens</strong> — one <code>tokens.css</code> file
          with colors, spacing, font sizes, etc as custom properties
        </Sent>
        <Sent pos="middle">
          2. <strong>tailwind v4</strong> — added tailwind. <code>@theme</code>
          &apos; block bridges the above tokens to tailwind utilities
        </Sent>
        <Sent pos="middle">
          3. <strong>theming</strong> — ThemeProvider using&apos;
          <code>useSyncExternalStore</code> to subscribe to localStorage and
          matchMedia. defaults to OS theme but allows changing it
        </Sent>
        <Sent pos="last">
          4. <strong>primitives</strong> — reusable components with
          accessibility
        </Sent>

        <Timestamp>2:43 PM</Timestamp>

        {/* ---- Tokens ---- */}
        <Received pos="first">ok start with the tokens</Received>
        <Received pos="last">why not just keep using hex values</Received>

        <Sent pos="first">
          makes these values easily reusable so you&apos;re not typing it out
          all the time
        </Sent>
        <Sent pos="last">
          and if you want to change the value, you only do it once for
          everywhere
        </Sent>

        <Received>show me</Received>

        {/* Token swatch */}
        <div className={styles.demoBubble}>
          <span className={styles.demoLabel}>Primary palette</span>
          <div className={styles.swatchGrid}>
            {[50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950].map(
              (shade) => (
                <div
                  key={shade}
                  className={styles.swatchColor}
                  style={{ background: `var(--color-primary-${shade})` }}
                  title={`primary-${shade}`}
                />
              ),
            )}
          </div>
        </div>

        <div className={styles.codeBubble}>
          {`:root {
  --color-primary-500: #3b82f6;
  --color-primary-600: #2563eb;
}

[data-theme="dark"] {
  --color-background: #0a0a0a;
  --color-foreground: #ededed;
}`}
        </div>

        <Sent pos="first">
          the palette shades (50–950) are the same in both light and dark mode
        </Sent>
        <Sent pos="last">
          the semantic aliases flip — background, foreground, surface, border,
          muted
        </Sent>

        <Received>what{"'"}s the downside</Received>

        <Sent pos="first">lots of CSS variables</Sent>
        <Sent pos="last">
          and once you name a token it&apos;s hard to rename
        </Sent>

        <Timestamp>2:47 PM</Timestamp>

        {/* ---- Tailwind + CSS Modules ---- */}
        <Received pos="first">
          why add tailwind if you already had CSS Modules working
        </Received>
        <Received pos="last">isn{"'"}t that two styling systems</Received>

        <Sent pos="first">
          it is. and in a bigger team i{"'"}d probably pick one, but this is a
          demo so we&apos;ll keep both
        </Sent>
        <Sent pos="middle">
          the CSS module files are legacy and kept there for backwards
          compatibility
        </Sent>
        <Sent pos="last">
          the bridge is a <code>@theme</code> block that maps CSS vars to
          utility classes. ie <code>bg-primary-600</code> and
          <code>var(--color-primary-600)</code> resolve to the same value
        </Sent>

        <Sent>
          for dark mode a <code>@custom-variant</code> tells tailwind to match{" "}
          <code>[data-theme=&quot;dark&quot;]</code> instead of the media query.
          so <code>dark:hover:bg-neutral-800</code> works with the toggle
        </Sent>

        <Received>what{"'"}s the cost of running both</Received>

        <Sent pos="first">
          mental overhead. new contributors have to know when to use which
        </Sent>
        <Sent pos="middle">
          also tailwind{"'"}s preflight reset can subtly change unstyled
          elements
        </Sent>
        <Sent pos="last">
          and the @theme bridge block is kinda verbose and repetitive
        </Sent>

        <Timestamp>2:52 PM</Timestamp>

        {/* ---- Theming ---- */}
        <Received>tell me about the theming</Received>

        <Sent pos="first">
          originally it was just <code>prefers-color-scheme</code>. just CSS no
          way for users to override it
        </Sent>
        <Sent pos="middle">
          i added a <code>ThemeProvider</code> that sets <code>data-theme</code>{" "}
          attribute the the base <code>&lt;html&gt;</code> element
        </Sent>
        <Sent pos="last">
          choice: instead of useState with useEffect (triggers eslint warnings
          about setState in effects), it uses <code>useSyncExternalStore</code>{" "}
          — one sub for localStorage, one for matchMedia. the theme is derived,
          never stored in state
        </Sent>

        <Received>can i try it</Received>

        <div className={styles.demoBubble}>
          <span className={styles.demoLabel}>Theme toggle</span>
          <div className={styles.demoRow}>
            <ThemeToggle />
          </div>
          <span
            style={{
              fontSize: "12px",
              color: "var(--color-muted)",
            }}
          >
            Cycles system / light / dark. Persists in localStorage.
          </span>
        </div>

        <Received>
          why <code>data-theme</code> instead of a class
        </Received>

        <Sent pos="first">
          data attributes describe state. classes describe styling
        </Sent>
        <Sent pos="last">
          also avoids any collision with tailwind utility classes
        </Sent>

        <Timestamp>2:58 PM</Timestamp>

        {/* ---- Components ---- */}
        <Received pos="first">ok show me the components</Received>
        <Received pos="last">you said button, input, modal?</Received>

        <Sent>
          yeah. the goal was build them once with accessibility baked in so
          every consumer gets correct ARIA, keyboard nav, and focus management
          for free
        </Sent>

        {/* Button demo */}
        <div className={styles.demoBubble}>
          <span className={styles.demoLabel}>Button — variants</span>
          <div className={styles.demoRow}>
            <Button variant="primary" size="sm">
              Primary
            </Button>
            <Button variant="secondary" size="sm">
              Secondary
            </Button>
            <Button variant="outline" size="sm">
              Outline
            </Button>
            <Button variant="ghost" size="sm">
              Ghost
            </Button>
          </div>
          <span className={styles.demoLabel}>Sizes</span>
          <div className={styles.demoRow}>
            <Button size="sm">Small</Button>
            <Button size="md">Medium</Button>
            <Button size="lg">Large</Button>
          </div>
          <span className={styles.demoLabel}>States</span>
          <div className={styles.demoRow}>
            <Button disabled size="sm">
              Disabled
            </Button>
            <Button loading={loading} size="sm" onClick={handleLoadingDemo}>
              {loading ? "Saving..." : "Click me"}
            </Button>
          </div>
        </div>

        <Sent pos="first">
          the <code>loading</code> prop sets <code>aria-busy</code>, shows a
          spinner, and disables clicks
        </Sent>
        <Sent pos="last">
          focus rings use <code>focus-visible</code> so they only show for
          keyboard users, not mouse clicks
        </Sent>

        {/* Input demo */}
        <div className={styles.demoBubble}>
          <span className={styles.demoLabel}>Input</span>
          <div className={styles.demoInputs}>
            <Input
              label="Email"
              placeholder="you@example.com"
              helperText="We'll never share your email"
            />
            <Input
              label="Username"
              required
              placeholder="Type < 3 chars to see error"
              onChange={handleInputDemo}
              error={inputError}
            />
            <Input label="Disabled" disabled placeholder="Can't touch this" />
          </div>
        </div>

        <Sent pos="first">
          labels auto-associate via <code>useId()</code>
        </Sent>
        <Sent pos="last">
          errors use <code>role=&quot;alert&quot;</code> so screen readers
          announce them immediately. <code>aria-describedby</code> links the
          input to its error or helper text
        </Sent>

        <Received>what about the modal</Received>

        {/* Modal demo */}
        <div className={styles.demoBubble}>
          <span className={styles.demoLabel}>Modal</span>
          <div className={styles.demoRow}>
            <Button size="sm" onClick={() => setModalOpen(true)}>
              Open modal
            </Button>
          </div>
          <span
            style={{
              fontSize: "12px",
              color: "var(--color-muted)",
            }}
          >
            Focus trap, Escape to close, backdrop click, scroll lock.
          </span>
        </div>

        <Modal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          aria-label="Example modal"
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "var(--spacing-4)",
            }}
          >
            <h3
              style={{
                fontSize: "var(--text-lg)",
                fontWeight: 600,
                color: "var(--color-foreground)",
              }}
            >
              This is a modal
            </h3>
            <p
              style={{
                fontSize: "var(--text-sm)",
                lineHeight: "var(--leading-relaxed)",
                color: "var(--color-muted)",
              }}
            >
              Tab cycles through the buttons below. Escape or backdrop click
              closes it. Scroll is locked on the body. Focus returns to the
              trigger button on close.
            </p>
            <div
              style={{
                display: "flex",
                gap: "var(--spacing-2)",
                justifyContent: "flex-end",
              }}
            >
              <Button variant="ghost" onClick={() => setModalOpen(false)}>
                Cancel
              </Button>
              <Button onClick={() => setModalOpen(false)}>Confirm</Button>
            </div>
          </div>
        </Modal>

        <Sent pos="first">
          built with <code>createPortal</code> so it escapes stacking contexts
        </Sent>
        <Sent pos="middle">
          custom focus trap cycles Tab through focusable elements. no external
          dependencies
        </Sent>
        <Sent pos="last">
          when it closes, focus returns to whatever element opened it
        </Sent>

        <Timestamp>3:04 PM</Timestamp>

        {/* ---- Decision making ---- */}
        <Received pos="first">how did you decide all this</Received>
        <Received pos="last">like what was the thought process</Received>

        <Sent pos="first">
          <strong>start from what exists.</strong> the project already had CSS
          Modules. so i picked a tool that layers on top instead of replacing
          everything
        </Sent>
        <Sent pos="middle">
          <strong>tokens before components.</strong> components are just
          opinions about how to combine tokens. getting colors, spacing, and
          typography right first means components naturally look consistent
        </Sent>
        <Sent pos="middle">
          <strong>no external component library.</strong> radix and headless UI
          are great but for three components it{"'"}s reasonable to build by
          hand. zero runtime deps, full DOM control, and you actually learn
          focus management
        </Sent>
        <Sent pos="last">
          <strong>CSS vars over JS tokens.</strong> no runtime cost, cascade
          naturally, work in both CSS Modules and tailwind without extra
          bridging
        </Sent>

        {/* ---- Trade-offs ---- */}
        <Received>anything you{"'"}d do differently</Received>

        <Sent pos="first">
          probably look harder at native <code>&lt;dialog&gt;</code> for the
          modal. it gives you backdrop, escape-to-close, and basic focus
          management for free. browser support is solid now
        </Sent>
        <Sent pos="last">
          the two-styling-systems thing is fine for exploring but i{"'"}d pick
          one for a real team project
        </Sent>

        <Received>nice. thanks for walking me through it</Received>

        <Sent>anytime</Sent>

        {/* Typing indicator */}
        <div className={styles.typingDots}>
          <span />
          <span />
          <span />
        </div>
      </div>
    </div>
  );
}
