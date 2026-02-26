import { auth0 } from "@/lib/auth0";
import ThemeToggle from "@/components/ThemeToggle";
import ThreadList from "./ThreadList";
import styles from "./protected.module.css";

const threads = [
  {
    name: "Styling Decisions",
    href: "/thoughts/styling",
    preview: "CSS Modules vs Tailwind v4 + design tokens",
    time: "8:04 PM",
    color: "#007aff",
    initials: "SD",
  },
  {
    name: "Landing Page",
    href: "/thoughts/landing-page",
    preview: "Sections and Functionality Preview",
    time: "5:12 PM",
    color: "#FF7373",
    initials: "LP",
  },
  {
    name: "Search Bar",
    href: "/thoughts/search-bar",
    preview: "Server/client split, filtering, and trade-offs",
    time: "4:26 PM",
    color: "#5856d6",
    initials: "SB",
  },
  {
    name: "NBA Stats",
    href: "/fantasy/nba/player/stats",
    preview: "View player stats for your favorite NBA team",
    time: "Today",
    color: "#007aff",
    initials: "NS",
  },
  {
    name: "League History",
    href: "/fantasy/nba/league-history",
    preview: "ESPN fantasy basketball league standings",
    time: "Today",
    color: "#ff9500",
    initials: "LH",
  },
  {
    name: "Pokemon TCG",
    href: "/tcg/pokemon",
    preview: "Browse, search, and explore Pokemon cards",
    time: "Today",
    color: "#ef4444",
    initials: "PT",
  },
  {
    name: "TCG Pocket",
    href: "/tcg/pocket",
    preview: "Pokémon TCG Pocket — all sets and expansions",
    time: "Today",
    color: "#6366f1",
    initials: "PK",
  },
  {
    name: "TCG Pages",
    href: "/thoughts/tcg",
    preview: "API proxy, server/client split, pagination patterns",
    time: "Today",
    color: "#10b981",
    initials: "TC",
  },
  {
    name: "Calendar",
    href: "/calendar",
    preview: "Track events and Pokémon TCG sessions",
    time: "Today",
    color: "#f59e0b",
    initials: "CA",
  },
  {
    name: "Events",
    href: "/thoughts/calendar",
    preview: "Calendar events, TCG integration, etc",
    time: "Today",
    color: "#10b981",
    initials: "EV",
  },
  {
    name: "GraphQL Pokédex",
    href: "/graphql",
    preview: "Browse Pokémon with a live GraphQL query",
    time: "Today",
    color: "#14b8a6",
    initials: "GQ",
  },
  {
    name: "GraphQL",
    href: "/thoughts/graphql",
    preview: "Why GraphQL, why plain fetch over Apollo",
    time: "Today",
    color: "#6366f1",
    initials: "GL",
  },
];

export default async function Protected() {
  const session = await auth0.getSession();
  const { name, email } = session?.user ?? {};
  const defaultName = name ?? "user";

  return (
    <div className={styles.page}>
      <main>
        {/* ---- Top bar ---- */}
        <div className={styles.topBar}>
          <span className={styles.topBarTitle}>Messages</span>
          <ThemeToggle />
        </div>

        {/* ---- Search + Thread list ---- */}
        <ThreadList threads={threads} />

        {/* ---- Bottom bar ---- */}
        <div className={styles.bottomBar}>
          <div className={styles.userRow}>
            <div className={styles.userAvatar}>
              {defaultName.charAt(0).toUpperCase()}
            </div>
            <div className={styles.userDetails}>
              <span className={styles.userNameSmall}>{defaultName}</span>
              <span className={styles.userEmailSmall}>{email}</span>
            </div>
            <a href="/auth/logout" className={styles.logoutLink}>
              Log out
            </a>
          </div>
        </div>
      </main>
    </div>
  );
}
