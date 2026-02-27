import ThoughtsSkeleton from "@/components/ThoughtsSkeleton";

// Shown by Next.js during the RSC fetch when navigating to any /thoughts/* page.
// The root loading.tsx has been removed so this is the only Suspense boundary
// in the route tree for thoughts routes — no cascade, just one skeleton.
export default function ThoughtsLoading() {
  return <ThoughtsSkeleton />;
}
