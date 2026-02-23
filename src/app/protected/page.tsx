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
    unread: true,
  },
  {
    name: "Landing Page",
    href: "/thoughts/landing-page",
    preview: "Sections and Functionality Preview",
    time: "5:12 PM",
    color: "#FF7373",
    initials: "LP",
    unread: true,
  },
  {
    name: "Search Bar",
    href: "/thoughts/search-bar",
    preview: "Server/client split, filtering, and trade-offs",
    time: "4:26 PM",
    color: "#5856d6",
    initials: "SB",
    unread: false,
  },
  {
    name: "NBA Stats",
    href: "/fantasy/nba/player/stats",
    preview: "View player stats for your favorite NBA team",
    time: "Today",
    color: "#007aff",
    initials: "NS",
    unread: false,
  },
  {
    name: "League History",
    href: "/fantasy/nba/league-history",
    preview: "ESPN fantasy basketball league standings",
    time: "Today",
    color: "#ff9500",
    initials: "LH",
    unread: false,
  },
  {
    name: "Pokemon TCG",
    href: "/tcg/pokemon",
    preview: "Browse, search, and explore Pokemon cards",
    time: "Today",
    color: "#ef4444",
    initials: "PT",
    unread: true,
  },
  {
    name: "TCG Pocket",
    href: "/tcg/pocket",
    preview: "Pokémon TCG Pocket — all sets and expansions",
    time: "Today",
    color: "#6366f1",
    initials: "PK",
    unread: true,
  },
  {
    name: "TCG Pages",
    href: "/thoughts/tcg",
    preview: "API proxy, server/client split, pagination patterns",
    time: "Today",
    color: "#10b981",
    initials: "TC",
    unread: true,
  },
  {
    name: "Calendar",
    href: "/calendar",
    preview: "Track events and Pokémon TCG sessions",
    time: "Today",
    color: "#f59e0b",
    initials: "CA",
    unread: true,
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
