import type { Metadata } from "next";
import Link from "next/link";
import { buildArticleMetadata } from "@/lib/site";

export const metadata: Metadata = buildArticleMetadata({
  title: "Privacy & cookies",
  description:
    "What this site stores on your device and why: the cookies it sets, the cookieless analytics it uses, and the functional data kept in your browser.",
  path: "/privacy",
});

// Static notice — cache at the CDN for a day.
export const revalidate = 86400;

/** A row in the cookie/storage table. */
function Item({
  name,
  purpose,
  necessity,
}: {
  name: string;
  purpose: string;
  necessity: string;
}) {
  return (
    <tr className="border-b border-border align-top">
      <td className="py-2 pr-4 font-mono text-[13px] text-foreground">{name}</td>
      <td className="py-2 pr-4 text-muted">{purpose}</td>
      <td className="py-2 text-muted">{necessity}</td>
    </tr>
  );
}

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="mb-2 text-3xl font-bold tracking-tight text-foreground">
        Privacy &amp; cookies
      </h1>
      <p className="mb-8 text-muted">
        This is a personal portfolio. It collects as little as possible, sets no
        advertising or third-party tracking cookies, and asks for consent before
        storing the one cookie on your device that is not strictly necessary.
      </p>

      <section className="mb-10">
        <h2 className="mb-3 text-lg font-bold text-foreground">Cookies</h2>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-border text-left text-muted">
                <th className="py-2 pr-4 font-semibold">Cookie</th>
                <th className="py-2 pr-4 font-semibold">Purpose</th>
                <th className="py-2 font-semibold">Category</th>
              </tr>
            </thead>
            <tbody>
              <Item
                name="visitor_id"
                purpose="An anonymous, random per-browser key used to keep feature rollouts consistent for you and to let the backend rate-limit fairly. It identifies a browser, not a person."
                necessity="Functional — only set after you accept."
              />
              <Item
                name="cookie_consent"
                purpose="Remembers whether you accepted or declined the functional cookie, so you are not asked again."
                necessity="Strictly necessary."
              />
              <Item
                name="Auth session"
                purpose="Keeps you signed in if you log in (encrypted session, set by Auth0). Only present for signed-in visitors."
                necessity="Strictly necessary."
              />
            </tbody>
          </table>
        </div>
      </section>

      <section className="mb-10">
        <h2 className="mb-3 text-lg font-bold text-foreground">Analytics</h2>
        <p className="text-muted">
          Page-performance data (Core Web Vitals) is collected with Vercel Speed
          Insights and a small first-party beacon. Both are cookieless, store
          nothing on your device, and carry no identifier — just anonymous timing
          numbers per page. There is no Google Analytics, no advertising pixels,
          and no cross-site tracking.
        </p>
      </section>

      <section className="mb-10">
        <h2 className="mb-3 text-lg font-bold text-foreground">
          Data kept in your browser
        </h2>
        <p className="text-muted">
          Some features remember your preferences in your browser&apos;s local
          storage — your light/dark theme, weather-effect settings, and various
          per-feature state (game scores, audio settings, and so on). This never
          leaves your device and is not sent anywhere.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-bold text-foreground">
          Changing your choice
        </h2>
        <p className="text-muted">
          Declining leaves the site fully working — feature rollouts just fall
          back to a default and rate-limiting uses your IP. To change your mind,
          clear this site&apos;s cookies in your browser and the consent banner
          will appear again. Questions? Reach me from the{" "}
          <Link
            href="/"
            className="text-primary-600 underline hover:no-underline dark:text-primary-400"
          >
            home page
          </Link>
          .
        </p>
      </section>
    </main>
  );
}
