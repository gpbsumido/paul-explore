import { Demo_Threads } from "@/lib/threads";
import { useState } from "react";
import styles from "../styling/styling.module.css";

export default function SearchDemo() {
  const [query, setQuery] = useState("");
  const filtered = Demo_Threads.filter((t) => {
    if (!query) return true;
    const q = query.toLowerCase();
    return (
      t.name.toLowerCase().includes(q) || t.preview.toLowerCase().includes(q)
    );
  });

  return (
    <div className={styles.demoBubble}>
      <span className={styles.demoLabel}>Try it</span>
      <input
        type="text"
        placeholder="Search threads..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        style={{
          width: "100%",
          height: "36px",
          borderRadius: "10px",
          border: "none",
          background: "var(--color-surface-raised)",
          padding: "0 12px",
          fontSize: "14px",
          color: "var(--color-foreground)",
          fontFamily: "inherit",
          outline: "none",
        }}
      />
      <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
        {filtered.map((t) => (
          <div
            key={t.name}
            style={{
              padding: "6px 0",
              borderBottom: "0.5px solid var(--color-border)",
              fontSize: "13px",
            }}
          >
            <span style={{ fontWeight: 500, color: "var(--color-foreground)" }}>
              {t.name}
            </span>
            <span style={{ color: "var(--color-muted)", marginLeft: "8px" }}>
              {t.preview}
            </span>
          </div>
        ))}
        {query && filtered.length === 0 && (
          <span
            style={{
              padding: "8px 0",
              color: "var(--color-muted)",
              fontSize: "13px",
            }}
          >
            No results
          </span>
        )}
      </div>
    </div>
  );
}
