import Link from "next/link";
import { auth0 } from "@/lib/auth0";
import styles from "./protected.module.css";

const threads = [
  {
    name: "Home",
    href: "/",
    preview: "Take me back to the homepage, users redirected back here",
    time: "Yesterday",
    color: "#ff9500",
    initials: "HM",
    unread: false,
  },
  {
    name: "Authentication",
    href: "/protected",
    preview: "THIS. Protected page. Auth0 + proxy middleware + CSP headers",
    time: "Yesterday",
    color: "#34c759",
    initials: "AU",
    unread: false,
  },
  {
    name: "Styling Decisions",
    href: "/thoughts/styling",
    preview: "CSS Modules vs Tailwind v4 + design tokens",
    time: "3:04 PM",
    color: "#007aff",
    initials: "SD",
    unread: false,
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
        </div>

        {/* ---- Search ---- */}
        <div className={styles.searchBar}>
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Search"
            readOnly
          />
        </div>

        {/* ---- Thread list ---- */}
        <div className={styles.threadList}>
          {threads.map((thread) => (
            <Link
              key={thread.href}
              href={thread.href}
              className={styles.thread}
            >
              {thread.unread && <div className={styles.unreadDot} />}
              <div
                className={styles.threadAvatar}
                style={{ background: thread.color }}
              >
                {thread.initials}
              </div>
              <div className={styles.threadBody}>
                <div className={styles.threadTop}>
                  <span className={styles.threadName}>{thread.name}</span>
                  <span className={styles.threadTime}>{thread.time}</span>
                </div>
                <span className={styles.threadPreview}>{thread.preview}</span>
              </div>
              <svg
                className={styles.threadChevron}
                width="8"
                height="14"
                viewBox="0 0 8 14"
                fill="none"
              >
                <path
                  d="M1 1l6 6-6 6"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </Link>
          ))}
        </div>

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
