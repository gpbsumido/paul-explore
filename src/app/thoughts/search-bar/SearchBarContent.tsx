import Link from "next/link";
import ThemeToggle from "@/components/ThemeToggle";
import styles from "../styling/styling.module.css";
import { Sent, Received, Timestamp } from "@/lib/threads";
import SearchDemo from "./SearchDemo";

export default function SearchBarContent() {
  return (
    <div className={styles.phone}>
      {/* ---- Top bar ---- */}
      <div className={styles.topBar}>
        <Link href="/protected" className={styles.backLink}>
          <svg width="10" height="16" viewBox="0 0 10 16" fill="none">
            <path
              d="M9 1L2 8l7 7"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          &nbsp;Back
        </Link>
        <div className={styles.contactInfo}>
          <span className={styles.contactName}>Search Bar</span>
          <span className={styles.contactSub}>iMessage</span>
        </div>
        <div className={styles.themeBtn}>
          <ThemeToggle />
        </div>
      </div>

      {/* ---- Chat ---- */}
      <div className={styles.chat}>
        <Timestamp>Today 4:12 PM</Timestamp>

        {/* ---- The problem ---- */}
        <Received pos="first">
          the search bar on the messages page was just a readonly input
        </Received>
        <Received pos="last">what was the issue with making it work</Received>

        <Sent pos="first">
          the protected page is a <strong>server component</strong>. it calls{" "}
          <code>await auth0.getSession()</code> to get the user session
        </Sent>
        <Sent pos="middle">
          server components can{"'"}t use <code>useState</code> or handle user
          input. so the search input was just decoration
        </Sent>
        <Sent pos="last">
          to make it interactive, something had to become a client component
        </Sent>

        <Timestamp>4:14 PM</Timestamp>

        {/* ---- The approach ---- */}
        <Received>
          so you converted the whole page to a client component?
        </Received>

        <Sent pos="first">no. that would mean losing server-side auth</Sent>
        <Sent pos="middle">
          <code>auth0.getSession()</code> only works in server components — it
          reads cookies from the request. move that to the client and it breaks
        </Sent>
        <Sent pos="last">
          instead i <strong>extracted</strong> just the search bar + thread list
          into a <code>ThreadList</code> client component
        </Sent>

        <Received>what stays on the server then</Received>

        <Sent pos="first">
          the page itself — <code>protected/page.tsx</code>. it fetches the
          session, reads the user name and email, and renders the layout
        </Sent>
        <Sent pos="last">
          it passes the <code>threads</code> array down as a prop to{" "}
          <code>ThreadList</code>. the client component handles the interactive
          filtering
        </Sent>

        <Timestamp>4:17 PM</Timestamp>

        {/* ---- The split ---- */}
        <Received pos="first">walk me through the split</Received>
        <Received pos="last">what exactly moved where</Received>

        <Sent pos="first">
          <strong>server component</strong> keeps: auth session, user info, top
          bar, bottom bar with logout link, thread data definition
        </Sent>
        <Sent pos="last">
          <strong>client component</strong> gets: search input with{" "}
          <code>useState</code>, filtered thread rendering, the &quot;no
          results&quot; empty state
        </Sent>

        <div className={styles.codeBubble}>
          {`// page.tsx (server)
export default async function Protected() {
  const session = await auth0.getSession();
  return (
    <ThreadList threads={threads} />
  );
}

// ThreadList.tsx (client)
"use client";
export default function ThreadList({ threads }) {
  const [query, setQuery] = useState("");
  const filtered = threads.filter(…);
  return <>{/* search + list */}</>;
}`}
        </div>

        <Timestamp>4:20 PM</Timestamp>

        {/* ---- The filtering ---- */}
        <Received>how does the filtering work</Received>

        <Sent pos="first">
          simple <code>.filter()</code> on every keystroke. case-insensitive{" "}
          <code>.includes()</code> check against three fields: name, href, and
          preview
        </Sent>
        <Sent pos="last">
          with 4 threads this is instant. no debouncing, no fuzzy matching, no
          external library needed
        </Sent>

        <Received>show me</Received>

        <SearchDemo />

        <Sent pos="first">
          empty query shows everything. type &quot;nba&quot; and it narrows to
          one. type &quot;zzz&quot; and you get the empty state
        </Sent>
        <Sent pos="last">
          the filter runs on <code>name</code>, <code>href</code>, and{" "}
          <code>preview</code> — so you can search by route too, like
          &quot;/fantasy&quot;
        </Sent>

        <Timestamp>4:23 PM</Timestamp>

        {/* ---- Why this approach ---- */}
        <Received pos="first">
          why not just make the whole page a client component
        </Received>
        <Received pos="last">would have been simpler right</Received>

        <Sent pos="first">simpler to write, yes. but it{"'"}s a bad habit</Sent>
        <Sent pos="middle">
          server components are the default in Next.js for a reason — they don
          {"'"}t ship JS to the browser, they can access server-only APIs
          directly, and they render on first paint without hydration delay
        </Sent>
        <Sent pos="middle">
          the principle:{" "}
          <strong>push client boundaries as low as possible</strong>. only the
          leaf that needs interactivity should be{" "}
          <code>&quot;use client&quot;</code>
        </Sent>
        <Sent pos="last">
          the page layout, auth check, and static data stay on the server. only
          the search input and its filtered list hydrate on the client
        </Sent>

        {/* ---- Trade-offs ---- */}
        <Received>any trade-offs with this split</Received>

        <Sent pos="first">
          minor one: the thread data is defined in the server component and
          serialized across the boundary as props. for 4 items that{"'"}s
          nothing
        </Sent>
        <Sent pos="middle">
          if we had hundreds of threads, we{"'"}d want server-side filtering
          instead — send the query as a search param and filter before rendering
        </Sent>
        <Sent pos="last">
          also the CSS Module import is now shared between the server page and
          the client component. works fine but it{"'"}s something to be aware of
          — both need access to the same class names
        </Sent>

        <Timestamp>4:26 PM</Timestamp>

        <Received>anything you{"'"}d improve</Received>

        <Sent pos="first">
          could add keyboard navigation — arrow keys to move through results,
          enter to navigate
        </Sent>
        <Sent pos="middle">
          could highlight the matching substring in results. but for 4 threads
          that{"'"}s over-engineering
        </Sent>
        <Sent pos="last">
          the right amount of complexity is the minimum needed. this is a search
          over 4 items — <code>.filter()</code> and <code>.includes()</code> is
          the right tool
        </Sent>

        <Received>solid. simple and it works</Received>

        <Sent>that{"'"}s the goal</Sent>

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
