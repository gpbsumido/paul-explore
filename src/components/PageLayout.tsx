import styles from "@/app/page.module.css";

// wraps page content in the shared page/main structure
export default function PageLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className={styles.page}>
      <main className={styles.main}>{children}</main>
    </div>
  );
}
