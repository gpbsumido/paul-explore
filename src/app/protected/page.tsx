import FeatureHub from "./FeatureHub";

// Explicit guarantee that this page is always statically generated at build time.
// If something dynamic ever sneaks in (a cookies() call, a headers() read, anything
// like that), the build fails rather than silently downgrading to server-rendered.
// Auth is handled by middleware at the edge before the static HTML is served.
export const dynamic = "force-static";

export default function Protected() {
  return <FeatureHub />;
}
