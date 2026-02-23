"use client";

import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui";
import { type CardResume } from "@/lib/tcg";
import { useDebounce } from "@/hooks/useDebounce";

/** Max results to show in the dropdown — keeps it from getting unwieldy. */
const DROPDOWN_LIMIT = 5;

type Props = {
  onSelectCard: (card: CardResume) => void;
};

/**
 * Debounced card search backed by /api/tcg/cards.
 *
 * Loading state is derived from `loadedQuery !== debouncedQuery` rather than
 * a separate boolean flag, so we never call setState synchronously in an effect.
 */
export default function CardSearch({ onSelectCard }: Props) {
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query, 350);

  const [results, setResults] = useState<CardResume[]>([]);
  // which query the current results belong to — drives the loading derivation
  const [loadedQuery, setLoadedQuery] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  const abortRef = useRef<AbortController | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // in-flight when the debounced query doesn't match what we've loaded yet
  const loading = !!debouncedQuery.trim() && loadedQuery !== debouncedQuery;
  const showDropdown = open && !!debouncedQuery.trim() && results.length > 0;

  useEffect(() => {
    const q = debouncedQuery.trim();
    if (!q) {
      // abort any in-flight fetch; no setState — showDropdown derives false from empty query
      abortRef.current?.abort();
      return;
    }

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    const params = new URLSearchParams({ q, page: "1" });
    fetch(`/api/tcg/cards?${params}`, { signal: controller.signal })
      .then((res) => {
        if (!res.ok) throw new Error("search failed");
        return res.json() as Promise<CardResume[]>;
      })
      .then((data) => {
        if (!controller.signal.aborted) {
          setResults(data.slice(0, DROPDOWN_LIMIT));
          setLoadedQuery(debouncedQuery);
          if (data.length > 0) setOpen(true);
        }
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          setLoadedQuery(debouncedQuery);
        }
      });

    return () => controller.abort();
  }, [debouncedQuery]);

  // close dropdown when the user clicks outside this component
  useEffect(() => {
    function handlePointerDown(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, []);

  function handleSelect(card: CardResume) {
    onSelectCard(card);
    setQuery("");
    setResults([]);
    setLoadedQuery(null);
    setOpen(false);
  }

  return (
    <div ref={containerRef} className="relative">
      <Input
        label="Search cards"
        hideLabel
        size="sm"
        type="search"
        autoComplete="off"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => {
          if (results.length > 0 && debouncedQuery.trim()) setOpen(true);
        }}
        placeholder="Search Pokémon cards…"
      />

      {(showDropdown || loading) && (
        <ul
          role="listbox"
          className="absolute z-50 left-0 right-0 mt-1 rounded-md border border-border bg-background shadow-lg overflow-hidden max-h-64 overflow-y-auto"
        >
          {loading && (
            <li className="px-3 py-2 text-xs text-muted">Searching…</li>
          )}
          {showDropdown &&
            results.map((card) => (
              <li key={card.id} role="option" aria-selected={false}>
                <button
                  type="button"
                  className="w-full flex items-center gap-2.5 px-3 py-1.5 text-left hover:bg-surface-raised transition-colors"
                  onClick={() => handleSelect(card)}
                >
                  {card.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={`${card.image}/low.webp`}
                      alt={card.name}
                      className="h-8 w-auto rounded"
                      loading="lazy"
                    />
                  ) : (
                    <div className="h-8 w-6 rounded bg-surface-raised shrink-0" />
                  )}
                  <span className="text-sm text-foreground truncate">
                    {card.name}
                  </span>
                  <span className="ml-auto text-xs text-muted shrink-0">
                    #{card.localId}
                  </span>
                </button>
              </li>
            ))}
        </ul>
      )}
    </div>
  );
}
