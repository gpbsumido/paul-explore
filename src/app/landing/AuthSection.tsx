import { type RefObject } from "react";
import { useInView } from "./useInView";
import Section, { reveal } from "./Section";

export default function AuthSection() {
  const [ref, visible] = useInView();

  return (
    <Section className="bg-gradient-to-br from-primary-50 to-primary-100 dark:from-primary-950 dark:to-neutral-950">
      <div
        ref={ref as RefObject<HTMLDivElement>}
        className="grid items-center gap-8 md:gap-12 md:grid-cols-2"
      >
        {/* left: text */}
        <div className={reveal(visible)}>
          <h2 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">
            Auth & Security
          </h2>
          <ul className="mt-6 space-y-4 text-muted">
            <li className="flex items-start gap-3">
              <span className="mt-0.5 text-primary-500">&#9654;</span>
              <span>
                <strong className="text-foreground">Auth0 SDK</strong> —
                session management with server-side token handling
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="mt-0.5 text-primary-500">&#9654;</span>
              <span>
                <strong className="text-foreground">CSP Headers</strong> —
                strict Content-Security-Policy via middleware
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="mt-0.5 text-primary-500">&#9654;</span>
              <span>
                <strong className="text-foreground">Proxy Middleware</strong>{" "}
                — API calls proxied server-side to hide secrets
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="mt-0.5 text-primary-500">&#9654;</span>
              <span>
                <strong className="text-foreground">Route Protection</strong>{" "}
                — unauthenticated users redirected from private pages
              </span>
            </li>
          </ul>
        </div>

        {/* right: code snippet */}
        <div className={`min-w-0 ${reveal(visible, "delay-200")}`}>
          <div className="overflow-x-auto rounded-xl border border-border bg-neutral-950 p-4 font-mono text-xs leading-relaxed text-neutral-300 shadow-lg sm:p-5 sm:text-sm dark:bg-neutral-900">
            <div className="mb-3 flex gap-1.5">
              <span className="h-3 w-3 rounded-full bg-error-500/80" />
              <span className="h-3 w-3 rounded-full bg-warning-500/80" />
              <span className="h-3 w-3 rounded-full bg-success-500/80" />
            </div>
            <pre className="overflow-x-auto">
              <code>{`// middleware.ts
export async function middleware(req) {
  const session = await auth0.getSession();

  if (!session && isProtected(req)) {
    return redirect("/auth/login");
  }

  // attach CSP + nonce headers
  return addSecurityHeaders(req);
}`}</code>
            </pre>
          </div>
        </div>
      </div>
    </Section>
  );
}
