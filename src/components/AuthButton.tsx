import styles from "@/app/page.module.css";

// login or logout link styled as a primary CTA
// uses <a> instead of <Link> since these routes go through the auth proxy
export default function AuthButton({
  loggedIn,
}: {
  loggedIn: boolean;
}) {
  return (
    <div className={styles.ctas}>
      <a
        className={styles.primary}
        href={loggedIn ? "/auth/logout" : "/auth/login"}
      >
        {loggedIn ? "Log out" : "Log in"}
      </a>
    </div>
  );
}
