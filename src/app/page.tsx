import { auth0 } from "@/lib/auth0";
import PageLayout from "@/components/PageLayout";
import PageIntro from "@/components/PageIntro";
import AuthButton from "@/components/AuthButton";

export default async function Home() {
  // get the session from the auth0 client
  const session = await auth0.getSession();

  return (
    <PageLayout>
      {session ? (
        <>
          <PageIntro
            heading={`Welcome, ${session.user.name}!`}
            subtitle={session.user.email ?? ""}
          />
          <AuthButton loggedIn />
        </>
      ) : (
        <>
          <PageIntro heading="Welcome" subtitle="Log in to get started." />
          <AuthButton loggedIn={false} />
        </>
      )}
    </PageLayout>
  );
}
