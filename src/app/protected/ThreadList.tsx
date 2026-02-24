"use client";

import { useState, useSyncExternalStore } from "react";
import Link from "next/link";
import styles from "./protected.module.css";
import type { ProtectedThread } from "@/types/protected";

const STORAGE_KEY = "read_threads";

function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  return () => window.removeEventListener("storage", callback);
}

// get snapshot of read threads, avoid creating new Set every call
function getSnapshot(): string {
  try {
    return localStorage.getItem(STORAGE_KEY) ?? "[]";
  } catch {
    return "[]";
  }
}

function getServerSnapshot(): string {
  return "[]";
}

// persist read threads
function markRead(href: string) {
  try {
    const current: string[] = JSON.parse(getSnapshot());
    if (current.includes(href)) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...current, href]));
    window.dispatchEvent(new StorageEvent("storage", { key: STORAGE_KEY }));
  } catch {
    // private browsing or quota exceeded — nothing we can do
  }
}

export default function ThreadList({
  threads,
}: {
  threads: ProtectedThread[];
}) {
  const [query, setQuery] = useState("");

  const readJson = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );
  const readHrefs = new Set<string>(JSON.parse(readJson));

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
        {filtered.map((thread) => {
          const isUnread = !readHrefs.has(thread.href);
          return (
            <Link
              key={thread.href}
              href={thread.href}
              className={styles.thread}
              onClick={() => markRead(thread.href)}
            >
              {isUnread && <div className={styles.unreadDot} />}
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
          );
        })}
        {query && filtered.length === 0 && (
          <div className="py-8 px-4 text-center text-[15px] text-muted">
            No results
          </div>
        )}
      </div>
    </>
  );
}
