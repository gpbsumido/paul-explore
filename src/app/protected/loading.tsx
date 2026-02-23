import React from "react";
import styles from "./protected.module.css";
import ThemeToggle from "@/components/ThemeToggle";

function Bone({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <div
      className={className}
      style={{
        background: "var(--color-surface)",
        borderRadius: 8,
        animation: "pulse 2s cubic-bezier(0.4,0,0.6,1) infinite",
        ...style,
      }}
    />
  );
}

function ThreadSkeleton() {
  return (
    <div className={styles.thread} style={{ pointerEvents: "none" }}>
      {/* Avatar circle */}
      <div
        style={{
          width: 52,
          height: 52,
          borderRadius: "50%",
          background: "var(--color-surface)",
          flexShrink: 0,
          animation: "pulse 2s cubic-bezier(0.4,0,0.6,1) infinite",
        }}
      />
      <div className={styles.threadBody}>
        <div className={styles.threadTop}>
          <Bone style={{ height: 14, width: 120, borderRadius: 6 }} />
          <Bone style={{ height: 12, width: 36, borderRadius: 6 }} />
        </div>
        <Bone style={{ height: 12, width: "80%", borderRadius: 6, marginTop: 4 }} />
      </div>
    </div>
  );
}

export default function ProtectedLoading() {
  return (
    <div className={styles.page}>
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
      <main>
        <div className={styles.topBar}>
          <span className={styles.topBarTitle}>Messages</span>
          <ThemeToggle />
        </div>

        {/* Search bar skeleton */}
        <div className={styles.searchBar}>
          <Bone style={{ height: 36, borderRadius: 10 }} />
        </div>

        {/* Thread skeletons */}
        <div className={styles.threadList}>
          {Array.from({ length: 8 }).map((_, i) => (
            <ThreadSkeleton key={i} />
          ))}
        </div>

        {/* Bottom bar skeleton */}
        <div className={styles.bottomBar}>
          <div className={styles.userRow}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: "50%",
                background: "var(--color-surface)",
                flexShrink: 0,
                animation: "pulse 2s cubic-bezier(0.4,0,0.6,1) infinite",
              }}
            />
            <div className={styles.userDetails}>
              <Bone style={{ height: 12, width: 100, borderRadius: 6 }} />
              <Bone style={{ height: 10, width: 140, borderRadius: 6, marginTop: 4 }} />
            </div>
            <Bone style={{ height: 12, width: 48, borderRadius: 6 }} />
          </div>
        </div>
      </main>
    </div>
  );
}
