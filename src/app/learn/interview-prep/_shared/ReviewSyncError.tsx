/**
 * Says out loud when signed-in progress couldn't be read or saved, so a stale
 * or empty schedule never passes for the real one.
 */
export default function ReviewSyncError({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <p
      role="alert"
      className="mt-4 rounded-md border border-border bg-surface px-3 py-2 text-[14px] text-foreground"
    >
      {message}
    </p>
  );
}
