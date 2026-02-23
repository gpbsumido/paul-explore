import Link from "next/link";

/** Back-navigation link to the events list. */
export default function BackLink() {
  return (
    <Link
      href="/calendar/events"
      className="flex items-center gap-1.5 text-sm text-muted hover:text-foreground transition-colors w-fit"
    >
      <svg width="5" height="9" viewBox="0 0 5 9" fill="none">
        <path
          d="M4 1L1 4.5 4 8"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      All events
    </Link>
  );
}
