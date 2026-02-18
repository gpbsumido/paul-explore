"use client";

import { useState } from "react";
import Link from "next/link";
import styles from "./protected.module.css";
import { ProtectedThread } from "@/types/protected";

export default function ThreadList({
  threads,
}: {
  threads: ProtectedThread[];
}) {
  const [query, setQuery] = useState("");

  const filtered = threads.filter((t) => {
    if (!query) return true;
    const q = query.toLowerCase();
    return (
      t.name.toLowerCase().includes(q) ||
      t.href.toLowerCase().includes(q) ||
      t.preview.toLowerCase().includes(q)
    );
  });

  return (
    <>
      <div className={styles.searchBar}>
        <input
          type="text"
          className={styles.searchInput}
          placeholder="Search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      <div className={styles.threadList}>
        {filtered.map((thread) => (
          <Link key={thread.href} href={thread.href} className={styles.thread}>
            {thread.unread && <div className={styles.unreadDot} />}
            <div
              className={styles.threadAvatar}
              style={{ background: thread.color }}
            >
              {thread.initials}
            </div>
            <div className={styles.threadBody}>
              <div className={styles.threadTop}>
                <span className={styles.threadName}>{thread.name}</span>
                <span className={styles.threadTime}>{thread.time}</span>
              </div>
              <span className={styles.threadPreview}>{thread.preview}</span>
            </div>
            <svg
              className={styles.threadChevron}
              width="8"
              height="14"
              viewBox="0 0 8 14"
              fill="none"
            >
              <path
                d="M1 1l6 6-6 6"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </Link>
        ))}
        {query && filtered.length === 0 && (
          <div className="py-8 px-4 text-center text-[15px] text-muted">
            No results
          </div>
        )}
      </div>
    </>
  );
}
