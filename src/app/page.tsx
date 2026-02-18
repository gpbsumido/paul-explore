import { redirect } from "next/navigation";
import { auth0 } from "@/lib/auth0";
import PageLayout from "@/components/PageLayout";
import PageIntro from "@/components/PageIntro";
import AuthButton from "@/components/AuthButton";
import styles from "./page.module.css";

export default async function Home() {
  const session = await auth0.getSession();

  if (session) {
    redirect("/protected");
  }

  return (
    <PageLayout className={styles.page}>
      <PageIntro
        className={styles.intro}
        heading="Welcome"
        subtitle="Log in to get started."
      />
      <AuthButton className={styles.button} loggedIn={false} />
    </PageLayout>
  );
}
