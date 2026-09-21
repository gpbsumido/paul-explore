// Neutral loading state that matches the page background so nothing flashes
// before the client view mounts.
export default function SurpriseLoading() {
  return <div className="min-h-dvh bg-background" />;
}
