// Neutral loading state, for the same reason the root page has one. This route
// calls auth0.getSession() and renders either the hub or the public landing, so
// a fallback that looks like either one flashes the wrong layout at whichever
// group of visitors got the other.
export default function DiscoverLoading() {
  return <div className="min-h-dvh bg-background" />;
}
