"use client";

import { useMemo, useState, type KeyboardEvent } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  buildSearchIndex,
  searchItems,
  searchIndexResponseSchema,
  type SearchItem,
} from "@/lib/operator-search";

interface OperatorSearchProps {
  /** Called when the operator picks a result, by click or Enter. */
  onSelect: (item: SearchItem) => void;
}

const LISTBOX_ID = "operator-search-listbox";
const optionId = (index: number) => `operator-search-option-${index}`;

const TYPE_LABEL: Record<SearchItem["type"], string> = {
  store: "Store",
  product: "Product",
  tool: "Tool",
};

/**
 * A keyboard-first quick-search over stores, fleet products and the operator
 * tools, built to the ARIA combobox-with-listbox pattern: the input owns
 * aria-activedescendant so arrow keys move a visual highlight without ever
 * moving DOM focus off the field. Selection is handed up via onSelect, so the
 * component stays free of any navigation dependency.
 */
export default function OperatorSearch({ onSelect }: OperatorSearchProps) {
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);

  const { data: index = [] } = useQuery({
    queryKey: ["operator", "search-index"],
    queryFn: async ({ signal }) => {
      const res = await fetch("/api/operator/search-index", { signal });
      if (!res.ok) throw new Error("Failed to load the search index");
      return buildSearchIndex(searchIndexResponseSchema.parse(await res.json()));
    },
    staleTime: 5 * 60_000,
  });

  const results = useMemo(() => searchItems(index, query), [index, query]);

  // Keep the highlight in range as the result set changes under it.
  const active = Math.min(activeIndex, Math.max(0, results.length - 1));

  const move = (delta: number) => {
    if (results.length === 0) return;
    setActiveIndex((i) => {
      const next = Math.min(Math.max(0, results.length - 1), Math.max(0, i));
      return (next + delta + results.length) % results.length;
    });
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      move(1);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      move(-1);
    } else if (event.key === "Enter") {
      const item = results[active];
      if (item) {
        event.preventDefault();
        onSelect(item);
      }
    } else if (event.key === "Escape") {
      setQuery("");
    }
  };

  return (
    <div className="mx-auto max-w-xl">
      <label htmlFor="operator-search" className="sr-only">
        Search stores, products and tools
      </label>
      <input
        id="operator-search"
        type="text"
        role="combobox"
        aria-expanded={results.length > 0}
        aria-controls={LISTBOX_ID}
        aria-autocomplete="list"
        aria-activedescendant={
          results.length > 0 ? optionId(active) : undefined
        }
        placeholder="Search stores, products, tools…"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setActiveIndex(0);
        }}
        onKeyDown={onKeyDown}
        autoComplete="off"
        className="w-full rounded-lg border border-border bg-surface px-4 py-2.5 text-sm text-foreground shadow-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500"
      />

      {results.length === 0 ? (
        <p className="mt-3 px-1 text-sm text-muted">
          Nothing matches &ldquo;{query.trim()}&rdquo;.
        </p>
      ) : (
        <ul
          id={LISTBOX_ID}
          role="listbox"
          aria-label="Search results"
          className="mt-2 overflow-hidden rounded-xl border border-border bg-surface"
        >
          {results.map((item, i) => {
            const isActive = i === active;
            return (
              // Options are driven by the combobox input's keyboard handler via
              // aria-activedescendant, so focus never lands here and a per-option
              // key listener could never fire; the click is a mouse convenience.
              // eslint-disable-next-line jsx-a11y/click-events-have-key-events
              <li
                key={item.id}
                id={optionId(i)}
                role="option"
                aria-selected={isActive}
                onMouseEnter={() => setActiveIndex(i)}
                onClick={() => onSelect(item)}
                className={`flex cursor-pointer items-center justify-between gap-3 border-b border-border/60 px-4 py-2.5 text-sm last:border-0 ${
                  isActive ? "bg-primary-50 dark:bg-primary-950/30" : ""
                }`}
              >
                <span className="min-w-0">
                  <span className="block truncate font-medium text-foreground">
                    {item.label}
                  </span>
                  <span className="block truncate text-xs text-muted">
                    {item.sublabel}
                  </span>
                </span>
                <span className="shrink-0 rounded-full border border-border px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide text-muted">
                  {TYPE_LABEL[item.type]}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
