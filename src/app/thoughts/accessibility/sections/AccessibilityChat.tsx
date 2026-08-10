"use client";

import styles from "@/app/thoughts/_shared/chat.module.css";
import { ChatThread, Timestamp, Sent, Received } from "@/lib/threads";

/** The chat view of the Accessibility write-up. */
export function AccessibilityChat() {
  return (
    <ChatThread>
      <Timestamp>Today 2:30 PM</Timestamp>

      <Received pos="first">I want to add WCAG compliance to the app</Received>
      <Received pos="last">
        where do you even start with something like that
      </Received>

      <Sent pos="first">
        start at the bottom of the component tree. the primitives in
        components/ui/ — Button, Input, Modal, all of those. every feature page
        is built from them so fixing those fixes a huge surface area
      </Sent>
      <Sent pos="last">
        and add axe-core at the unit test level, not just E2E. you want fast
        feedback on every component variant, not a slow integration test that
        checks one page state
      </Sent>

      <Timestamp>2:35 PM</Timestamp>

      <Received>we already have axe in the playwright tests though</Received>

      <Sent pos="first">
        yeah but that only catches page-level stuff — missing landmarks, heading
        hierarchy, contrast on the rendered page. you can&apos;t test every
        button variant or every error state of a form through E2E
      </Sent>
      <Sent pos="middle">
        vitest-axe runs axe-core inside unit tests. render a component, pass the
        container to axe, assert zero violations. takes milliseconds
      </Sent>
      <Sent pos="last">
        the two layers catch different things. unit tests catch component-level
        violations early, E2E catches composition issues where individually
        accessible components break when assembled
      </Sent>

      <Timestamp>2:40 PM</Timestamp>

      <Received>what did axe actually find</Received>

      <Sent pos="first">
        IconButton had no accessible name — icon-only buttons need an
        aria-label. made it a required prop so TypeScript catches it at compile
        time
      </Sent>
      <Sent pos="middle">
        Input labels weren&apos;t programmatically associated. the label was
        visually next to the input but no htmlFor/id pair. screen readers
        announced the input with no context
      </Sent>
      <Sent pos="last">
        Tooltip only worked on hover. keyboard users couldn&apos;t see it. added
        onFocus/onBlur and Escape to dismiss
      </Sent>

      <Timestamp>2:45 PM</Timestamp>

      <Received>what about the 3D pages</Received>

      <Sent pos="first">
        you can&apos;t make a WebGL scene screen-reader-friendly. that&apos;s
        just the reality
      </Sent>
      <Sent pos="last">
        what you can do is make sure the canvas has a descriptive aria-label,
        doesn&apos;t trap focus, and the page is fully usable without the 3D
        content. the content is the point, the 3D is decoration
      </Sent>

      <Timestamp>2:48 PM</Timestamp>

      <Received>
        what doesn&apos;t axe catch that you had to test manually
      </Received>

      <Sent pos="first">
        all the interaction stuff. axe checks static HTML — it doesn&apos;t
        click things or press keys
      </Sent>
      <Sent pos="middle">
        focus trap holes in Modal, Tooltip not showing on keyboard focus, Chip
        removal not announcing to screen readers — those are behavioral tests
        you write with Testing Library and user-event
      </Sent>
      <Sent pos="last">
        the split is: axe for structure, manual tests for behavior. you need
        both
      </Sent>

      <Timestamp>2:52 PM</Timestamp>

      <Received>what about color contrast</Received>

      <Sent pos="first">
        WCAG wants 4.5:1 for normal text, 3:1 for large text and UI components.
        axe catches most of it at render time but dynamic states like hover and
        focus need manual checks
      </Sent>
      <Sent pos="last">
        found a few muted text colors below the threshold in both themes. the
        design token system made it easy to fix since you only verify contrast
        at the token level, not per-component
      </Sent>

      <Timestamp>2:55 PM</Timestamp>

      <Received>
        so if someone adds a new component, what should they actually test
      </Received>

      <Sent pos="first">
        three layers. first, axe scans for every visual variant — default,
        loading, error, disabled, empty. each variant can produce different DOM
        that needs separate evaluation
      </Sent>
      <Sent pos="middle">
        second, label and ARIA assertions. getByLabelText, aria-describedby
        checks, role verification. make sure screen readers get the right
        information
      </Sent>
      <Sent pos="last">
        third, keyboard behavior with user-event. tab order, Escape dismissal,
        Enter/Space activation. the WCAG criteria to hit are 1.3.1 and 4.1.2 for
        labels, 2.4.3 and 2.4.7 for focus, 2.1.1 for keyboard, 1.4.3 for
        contrast, 4.1.3 for live regions
      </Sent>

      <Timestamp>2:58 PM</Timestamp>

      <Received>can you give me a quick checklist for reviewing PRs</Received>

      <Sent pos="first">
        axe scan for every variant, keyboard-only operability, visible focus
        rings, labels on inputs (not just placeholders), error states with
        aria-describedby and role=&quot;alert&quot;
      </Sent>
      <Sent pos="middle">
        icon-only buttons have aria-label, modals trap and restore focus,
        animations respect prefers-reduced-motion, contrast ratios met, no
        tabIndex greater than 0
      </Sent>
      <Sent pos="last">
        and check for skip links and semantic landmarks — main, nav, header. not
        every item applies to every PR but scanning the list catches the common
        gaps
      </Sent>

      <Timestamp>3:02 PM</Timestamp>

      <Received pos="first">what even is WCAG though</Received>
      <Received pos="last">
        like I know it&apos;s accessibility guidelines but I don&apos;t have a
        ton of formal experience with it
      </Received>

      <Sent pos="first">
        it&apos;s organized around four principles, POUR: Perceivable, Operable,
        Understandable, Robust. can the user see it, interact with it,
        understand it, and does it work with assistive tech
      </Sent>
      <Sent pos="middle">
        there are three levels: A is bare minimum, AA is the standard everyone
        targets (and what legal requirements reference), AAA is ideal but rarely
        required in full. we target AA
      </Sent>
      <Sent pos="last">
        each rule has a number like SC 1.4.3. the first digit maps to POUR: 1 =
        Perceivable, 2 = Operable, 3 = Understandable, 4 = Robust. you
        don&apos;t need to memorize them but it helps when reading axe
        violations
      </Sent>

      <Timestamp>3:06 PM</Timestamp>

      <Received>how do you actually get good at this stuff</Received>

      <Sent pos="first">
        use your own app without a mouse. tab through the page, try to reach
        every button, dismiss a modal with Escape. then turn on VoiceOver
        (Cmd+F5 on Mac) and listen to what it announces. you&apos;ll feel the
        gaps immediately
      </Sent>
      <Sent pos="middle">
        install the axe browser extension, run it on your pages, and read the
        violations. each one links to the WCAG criterion and how to fix it. you
        learn the rules through your own code
      </Sent>
      <Sent pos="middle">
        learn semantic HTML before ARIA. most problems come from div soup. use
        button, nav, main, label — the browser gives you keyboard support and
        screen reader announcements for free. ARIA is a patch, not a replacement
      </Sent>
      <Sent pos="last">
        day to day you only touch about a dozen criteria repeatedly: labels,
        keyboard access, focus visible, contrast, error identification,
        name/role/value. get comfortable with those and you&apos;re ahead of
        most developers
      </Sent>

      <Timestamp>3:10 PM</Timestamp>

      <Received>so what&apos;s the full defense setup look like now</Received>

      <Sent pos="first">
        three layers. eslint-plugin-jsx-a11y catches structural issues at lint
        time — divs with onClick but no role, missing alt text, invalid ARIA. it
        runs before the code even executes
      </Sent>
      <Sent pos="middle">
        second layer is vitest-axe in unit tests. scans every component variant
        against WCAG 2.1 AA in milliseconds. third is @axe-core/playwright in
        E2E tests for full-page scans
      </Sent>
      <Sent pos="last">
        each catches different things. lint catches patterns, unit tests catch
        rendered DOM issues, E2E catches composition problems where individually
        accessible components break when assembled
      </Sent>

      <Timestamp>3:12 PM</Timestamp>

      <Received>didn&apos;t you also turn something on in chromatic</Received>

      <Sent pos="first">
        yeah, that was basically free. the design system&apos;s storybook
        already runs chromatic on every PR for visual regression, and chromatic
        has accessibility tests built in — same axe-core engine — they were just
        switched off
      </Sent>
      <Sent pos="middle">
        no new library, no new CI job. it was a toggle in the project settings.
        since chromatic already runs in CI the a11y results show up in the same
        build as the visual snapshots
      </Sent>
      <Sent pos="last">
        and it scans every story, so every button variant and every modal state
        gets an axe pass across the whole catalog. sits right between the fast
        unit checks and the slow full-page E2E scans
      </Sent>

      <Timestamp>3:14 PM</Timestamp>

      <Received>
        what did the feature-level audit find beyond the primitives
      </Received>

      <Sent pos="first">
        the bottom-up approach left gaps. operator charts had no text
        alternatives, skeleton loaders cluttered the a11y tree, stock bars had
        no semantic meaning. the calendar combobox couldn&apos;t be keyboard
        operated
      </Sent>
      <Sent pos="last">
        fixed all of it and added 29 tests across two new test files covering
        the feature layer. the pattern is the same: run axe, fix violations, add
        keyboard behavior tests
      </Sent>

      <Timestamp>3:18 PM</Timestamp>

      <Received>tell me about the eslint plugin setup</Received>

      <Sent pos="first">
        eslint-plugin-jsx-a11y catches stuff that&apos;s always wrong regardless
        of runtime state. divs with onClick but no role, imgs without alt,
        interactive elements without keyboard handlers
      </Sent>
      <Sent pos="middle">
        one gotcha with Next.js: eslint-config-next already registers the
        plugin, so you only add the rules object, not the full plugin config.
        otherwise you get a &quot;Cannot redefine plugin&quot; error
      </Sent>
      <Sent pos="last">
        pair it with Firefox&apos;s Accessibility Inspector and the axe DevTools
        extension for browser-side inspection. between lint, unit tests, and
        browser tools, most violations get caught before a PR
      </Sent>

      <Timestamp>3:22 PM</Timestamp>

      <Received>
        what was the deal with CalendarGrid and nested interactives
      </Received>

      <Sent pos="first">
        day cells are clickable to create events but contain clickable EventChip
        buttons inside them. can&apos;t use role=&quot;button&quot; on the outer
        div because nested interactive elements is an axe violation
      </Sent>
      <Sent pos="last">
        the fix is event delegation. the outer div handles onClick but checks if
        the target is inside a button or anchor via closest(). if it is, the
        parent ignores the click. the eslint rule gets a targeted disable since
        the pattern is intentional
      </Sent>

      <Timestamp>3:26 PM</Timestamp>

      <Received>what about stuff automated tools can&apos;t catch</Received>

      <Sent pos="first">
        automated tools catch maybe 30-40% of issues. the rest is habits. test
        with sound off, test at 200% zoom, respect prefers-reduced-motion and
        prefers-contrast media queries
      </Sent>
      <Sent pos="middle">
        make click targets large enough for motor impairments, avoid
        auto-dismissing popups, add skip links for keyboard users, caption all
        video and audio content
      </Sent>
      <Sent pos="last">
        the goal isn&apos;t perfection, it&apos;s making accessibility a natural
        part of development. build the habits so it&apos;s not an afterthought
        audit
      </Sent>

      <Timestamp>3:30 PM</Timestamp>

      <Received>how do aria-live regions actually work</Received>

      <Sent pos="first">
        three values. off is the default, no announcements. polite waits until
        the screen reader is idle — right for status messages, search counts,
        save confirmations. assertive interrupts immediately, only for critical
        errors
      </Sent>
      <Sent pos="last">
        key gotcha: the live region container must exist in the DOM before the
        content changes. if you conditionally render the container and content
        at the same time, screen readers miss it because they weren&apos;t
        watching the region when it appeared
      </Sent>

      <Timestamp>3:34 PM</Timestamp>

      <Received pos="first">how do the tests actually work though</Received>
      <Received pos="last">
        like when do they run, what do I need to do when building a new feature
      </Received>

      <Sent pos="first">
        three activation points. eslint-plugin-jsx-a11y fires on save in your
        editor and in CI lint. vitest-axe runs as part of normal npm test.
        playwright axe runs in the E2E step
      </Sent>
      <Sent pos="middle">
        none of them need special commands. the lint rules are in the eslint
        config, the axe matchers are globally registered in test/setup.ts, and
        the E2E scans are just playwright tests. they all run automatically in
        CI
      </Sent>
      <Sent pos="last">
        for authenticated routes (calendar, settings), E2E axe scans need real
        Auth0 credentials. those run locally via npm run test:e2e:auth, not in
        CI for forks
      </Sent>

      <Timestamp>3:38 PM</Timestamp>

      <Received>
        so when I build a new component, what&apos;s the checklist
      </Received>

      <Sent pos="first">
        first, add an axe scan for each visual variant — default, loading,
        error, disabled. import axe from @/test/a11y, render, pass the
        container, assert toHaveNoViolations()
      </Sent>
      <Sent pos="middle">
        second, add ARIA assertions — getByRole, getByLabelText, toHaveAttribute
        for aria-expanded, aria-selected, etc. these document the
        component&apos;s accessible API
      </Sent>
      <Sent pos="middle">
        third, keyboard tests if it&apos;s interactive. Enter, Space, Escape,
        arrow keys as appropriate. use userEvent.keyboard to simulate and assert
        callbacks fire
      </Sent>
      <Sent pos="last">
        also: make sure new pages have an h1 (use sr-only if visually
        redundant), and never use opacity modifiers on text-muted —
        text-muted/30 drops below the 4.5:1 contrast threshold
      </Sent>

      <Timestamp>3:42 PM</Timestamp>

      <Received>
        did you have to tune any of the eslint rules after enabling them
      </Received>

      <Sent pos="first">
        yeah, two rules needed project-level config. no-noninteractive-tabindex
        flags tabIndex on non-interactive elements, which is correct 99% of the
        time. but scrollable containers need tabIndex=&#123;0&#125; so keyboard
        users can scroll with arrow keys
      </Sent>
      <Sent pos="middle">
        the fix is role=&quot;region&quot; with an aria-label on the container,
        then configure the rule to allow tabIndex on region and tabpanel roles.
        still catches bad uses, but allows the legitimate pattern
      </Sent>
      <Sent pos="last">
        also had to override @typescript-eslint/no-unused-vars to support the _
        prefix convention and ignoreRestSiblings. not an a11y rule but it came
        out of the same lint cleanup — seven warnings from one config change
      </Sent>

      <div className={styles.typingDots}>
        <span />
        <span />
        <span />
      </div>
    </ChatThread>
  );
}
