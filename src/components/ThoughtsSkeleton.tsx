import styles from "@/app/thoughts/styling/styling.module.css";

/**
 * Skeleton placeholder shown while a thoughts-page content component loads.
 *
 * Replicates the phone container, sticky top bar, and a plausible mix of
 * sent/received chat bubbles so there's no jarring layout shift when the
 * real content arrives. Used as the `loading` fallback for next/dynamic on
 * all five thoughts pages.
 */
export default function ThoughtsSkeleton() {
  return (
    <div className={styles.phone}>
      {/* Top bar — matches the real sticky header structure */}
      <div className={styles.topBar}>
        {/* Back link placeholder */}
        <div className="absolute left-4 h-4 w-10 animate-pulse rounded-full bg-border" />

        {/* Contact info placeholder — two stacked lines */}
        <div className="flex flex-col items-center gap-1.5">
          <div className="h-[15px] w-24 animate-pulse rounded-full bg-border" />
          <div className="h-2.5 w-16 animate-pulse rounded-full bg-border" />
        </div>

        {/* Theme toggle placeholder */}
        <div className="absolute right-4 h-6 w-6 animate-pulse rounded-full bg-border" />
      </div>

      {/* Chat area — shimmer bubbles that mimic a real conversation layout */}
      <div className={styles.chat}>
        {/* Timestamp */}
        <div className="mx-auto h-3 w-32 animate-pulse rounded-full bg-border" />

        {/* Received — short question */}
        <div className={`${styles.bubble} ${styles.received} ${styles.receivedFirst}`}>
          <div className="h-[14px] w-[58%] animate-pulse rounded-full bg-muted/25" />
        </div>
        <div className={`${styles.bubble} ${styles.received} ${styles.receivedLast}`}>
          <div className="h-[14px] w-[38%] animate-pulse rounded-full bg-muted/25" />
        </div>

        {/* Sent — multi-line answer */}
        <div className={`${styles.bubble} ${styles.sent} ${styles.sentFirst}`}>
          <div className="h-[14px] w-[82%] animate-pulse rounded-full bg-white/30" />
        </div>
        <div className={`${styles.bubble} ${styles.sent} ${styles.sentMiddle}`}>
          <div className="h-[14px] w-[90%] animate-pulse rounded-full bg-white/30" />
        </div>
        <div className={`${styles.bubble} ${styles.sent} ${styles.sentLast}`}>
          <div className="h-[14px] w-[65%] animate-pulse rounded-full bg-white/30" />
        </div>

        {/* Received — follow-up question */}
        <div className={`${styles.bubble} ${styles.received} ${styles.receivedOnly}`}>
          <div className="h-[14px] w-[70%] animate-pulse rounded-full bg-muted/25" />
        </div>

        {/* Sent — longer multi-line */}
        <div className={`${styles.bubble} ${styles.sent} ${styles.sentFirst}`}>
          <div className="h-[14px] w-[76%] animate-pulse rounded-full bg-white/30" />
        </div>
        <div className={`${styles.bubble} ${styles.sent} ${styles.sentMiddle}`}>
          <div className="h-[14px] w-[88%] animate-pulse rounded-full bg-white/30" />
        </div>
        <div className={`${styles.bubble} ${styles.sent} ${styles.sentMiddle}`}>
          <div className="h-[14px] w-[60%] animate-pulse rounded-full bg-white/30" />
        </div>
        <div className={`${styles.bubble} ${styles.sent} ${styles.sentLast}`}>
          <div className="h-[14px] w-[80%] animate-pulse rounded-full bg-white/30" />
        </div>

        {/* Timestamp */}
        <div className="mx-auto h-3 w-24 animate-pulse rounded-full bg-border" />

        {/* Received */}
        <div className={`${styles.bubble} ${styles.received} ${styles.receivedOnly}`}>
          <div className="h-[14px] w-[62%] animate-pulse rounded-full bg-muted/25" />
        </div>

        {/* Sent — last group */}
        <div className={`${styles.bubble} ${styles.sent} ${styles.sentFirst}`}>
          <div className="h-[14px] w-[71%] animate-pulse rounded-full bg-white/30" />
        </div>
        <div className={`${styles.bubble} ${styles.sent} ${styles.sentLast}`}>
          <div className="h-[14px] w-[55%] animate-pulse rounded-full bg-white/30" />
        </div>

        {/* Typing indicator — same animated dots as the real content */}
        <div className={styles.typingDots}>
          <span />
          <span />
          <span />
        </div>
      </div>
    </div>
  );
}
