import { auth0 } from "@/lib/auth0";
import PageLayout from "@/components/PageLayout";
import PageIntro from "@/components/PageIntro";
import AuthButton from "@/components/AuthButton";
import styles from "./protected.module.css";

export default async function Protected() {
  // this page is behind auth - proxy.ts redirects to login if no session
  const session = await auth0.getSession();
  const { name, email } = session?.user ?? {};
  const defaultName = name ?? "user";

  return (
    <PageLayout className={styles.page}>
      <PageIntro
        className={styles.intro}
        heading={`Hello, ${defaultName}!`}
        subtitle="You wouldn't be here if you weren't logged in."
      />
      <div className={styles.userCard}>
        <div className={styles.avatar}>
          {defaultName?.charAt(0).toUpperCase()}
        </div>
        <div className={styles.userInfo}>
          <span className={styles.userName}>{defaultName}</span>
          <span className={styles.userEmail}>{email}</span>
        </div>
      </div>
      <AuthButton className={styles.button} loggedIn />
    </PageLayout>
  );
}
