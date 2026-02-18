import styles from "../app/thoughts/styling/styling.module.css";

/*TODO: move to db */
export const Demo_Threads = [
  { name: "Home", preview: "Take me back to the homepage" },
  { name: "Authentication", preview: "Auth0 + proxy middleware" },
  { name: "Styling Decisions", preview: "CSS Modules vs Tailwind v4" },
  { name: "NBA Stats", preview: "Player stats for your favorite NBA team" },
];

export function Sent({
  children,
  pos = "only",
}: {
  children: React.ReactNode;
  pos?: "first" | "middle" | "last" | "only";
}) {
  const posClass =
    pos === "first"
      ? styles.sentFirst
      : pos === "middle"
        ? styles.sentMiddle
        : pos === "last"
          ? styles.sentLast
          : styles.sentOnly;
  return (
    <div className={`${styles.bubble} ${styles.sent} ${posClass}`}>
      {children}
    </div>
  );
}

export function Received({
  children,
  pos = "only",
}: {
  children: React.ReactNode;
  pos?: "first" | "middle" | "last" | "only";
}) {
  const posClass =
    pos === "first"
      ? styles.receivedFirst
      : pos === "middle"
        ? styles.receivedMiddle
        : pos === "last"
          ? styles.receivedLast
          : styles.receivedOnly;
  return (
    <div className={`${styles.bubble} ${styles.received} ${posClass}`}>
      {children}
    </div>
  );
}

export function Timestamp({ children }: { children: React.ReactNode }) {
  return <div className={styles.timestamp}>{children}</div>;
}
