import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { auth0 } from "@/lib/auth0";
import { isAllowedEmail } from "@/lib/emailAllowlist";
import TodoContent from "./TodoContent";

/**
 * The list records what has not been fixed yet across my projects, so it is
 * kept out of search engines as well as out of both repos.
 */
export const metadata: Metadata = {
  title: "To-do",
  description: "Outstanding work across my projects.",
  robots: { index: false, follow: false },
};

/**
 * Admin-only. The proxy already sends a signed-out visitor to login, so the
 * check here is specifically "signed in, but not me".
 *
 * 404 rather than 403: a 403 confirms the page exists. Rendering nothing is
 * also why this is a server component — a non-admin's browser never receives
 * the list at all, rather than being asked not to display it.
 */
export default async function TodoPage() {
  const session = await auth0.getSession();

  const isAdmin = isAllowedEmail({
    email: session?.user?.email,
    emailVerified: session?.user?.email_verified === true,
    allowlist: process.env.FLAG_ADMIN_ALLOWED_EMAILS,
  });

  if (!isAdmin) notFound();

  return <TodoContent />;
}
