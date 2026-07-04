// Neutral loading state for the root page. auth0.getSession() is a local
// cookie decrypt so this resolves in milliseconds, but Next.js still shows
// this Suspense fallback during client-side navigations to "/". It must NOT
// look like either the authenticated hub or the public landing page —
// otherwise one group of users sees a brief flash of the wrong layout.
export default function RootLoading() {
  return <div className="min-h-dvh bg-background" />;
}
