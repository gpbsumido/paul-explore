import ThoughtsSkeleton from "@/components/ThoughtsSkeleton";

// Shown by Next.js during the RSC fetch when navigating to any /thoughts/* page.
// Replaces the per-page next/dynamic loading callbacks which caused a double-skeleton
// flash — one from the server Suspense boundary, one from the client chunk download.
export default function ThoughtsLoading() {
  return <ThoughtsSkeleton />;
}
