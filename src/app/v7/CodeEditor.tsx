"use client";

import { useId, useRef, useState, type CSSProperties, type KeyboardEvent, type ReactNode } from "react";
import styles from "./v7.module.css";

export type EditorFile = { name: string; lines: ReactNode[] };

/** The stagger index for the rise animation. CSSProperties has no slot for custom properties, hence the cast. */
function stagger(index: number): CSSProperties {
  return { "--i": index } as CSSProperties;
}

/**
 * The hero's editor panel. Each file is a tab, following the WAI-ARIA tabs
 * pattern: one tab in the tab order at a time, arrow keys and Home/End move
 * between files, and the code shows in the selected file's panel.
 */
export default function CodeEditor({ files }: { files: EditorFile[] }) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const idPrefix = useId();
  const tabId = (index: number) => `${idPrefix}-tab-${index}`;
  const panelId = (index: number) => `${idPrefix}-panel-${index}`;

  function selectAndFocus(index: number) {
    setSelectedIndex(index);
    tabRefs.current[index]?.focus();
  }

  function handleTabKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    const lastIndex = files.length - 1;
    const nextIndexByKey: Record<string, number> = {
      ArrowRight: selectedIndex === lastIndex ? 0 : selectedIndex + 1,
      ArrowLeft: selectedIndex === 0 ? lastIndex : selectedIndex - 1,
      Home: 0,
      End: lastIndex,
    };
    const nextIndex = nextIndexByKey[event.key];
    if (nextIndex === undefined) return;
    event.preventDefault();
    selectAndFocus(nextIndex);
  }

  return (
    <figure className={styles.editor} aria-label="About me and my work, in TypeScript">
      <div className={styles.tabs}>
        <div role="tablist" aria-label="Files" className={styles.tabList}>
          {files.map((file, index) => {
            const isSelected = index === selectedIndex;
            return (
              <button
                key={file.name}
                ref={(element) => {
                  tabRefs.current[index] = element;
                }}
                type="button"
                role="tab"
                id={tabId(index)}
                aria-selected={isSelected}
                aria-controls={isSelected ? panelId(index) : undefined}
                tabIndex={isSelected ? 0 : -1}
                className={isSelected ? `${styles.tab} ${styles.tabOn}` : styles.tab}
                onClick={() => setSelectedIndex(index)}
                onKeyDown={handleTabKeyDown}
              >
                {file.name}
              </button>
            );
          })}
        </div>
        <span className={styles.lang} aria-hidden="true">TypeScript</span>
      </div>
      <pre
        key={selectedIndex}
        role="tabpanel"
        id={panelId(selectedIndex)}
        aria-labelledby={tabId(selectedIndex)}
        tabIndex={0}
        className={styles.code}
      >
        {files[selectedIndex].lines.map((line, index) => (
          <span key={index} className={styles.line} style={stagger(index)}>{line}</span>
        ))}
      </pre>
    </figure>
  );
}
