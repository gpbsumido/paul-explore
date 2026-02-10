import { auth0 } from "@/lib/auth0";
import PageLayout from "@/components/PageLayout";
import PageIntro from "@/components/PageIntro";
import AuthButton from "@/components/AuthButton";

export default async function Protected() {
  // this page is behind auth - proxy.ts redirects to login if no session
  const session = await auth0.getSession();

  return (
    <PageLayout>
      <PageIntro
        heading={`Hello, ${session?.user.name ?? "there"}`}
        subtitle="You wouldn't be here if you weren't logged in."
      />
      <AuthButton loggedIn />
    </PageLayout>
  );
}
