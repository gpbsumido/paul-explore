import { auth0 } from "@/lib/auth0";
import PageLayout from "@/components/PageLayout";
import PageIntro from "@/components/PageIntro";
import AuthButton from "@/components/AuthButton";
import styles from "./page.module.css";

export default async function Home() {
  // get the session from the auth0 client
  const session = await auth0.getSession();

  return (
    <PageLayout className={styles.page}>
      {session ? (
        <>
          <PageIntro
            className={styles.intro}
            heading={`Welcome, ${session.user.name}!`}
            subtitle={session.user.email ?? ""}
          />
          <AuthButton className={styles.button} loggedIn />
        </>
      ) : (
        <>
          <PageIntro
            className={styles.intro}
            heading="Welcome"
            subtitle="Log in to get started."
          />
          <AuthButton className={styles.button} loggedIn={false} />
        </>
      )}
    </PageLayout>
  );
}
