"use client";

import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
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
 * useQuery handles fetching, request cancellation, and caching. The query
 * is disabled when the input is empty so no request fires until the user
 * starts typing. Results are cached for 5 minutes so searching the same
 * term again is instant. placeholderData resets the visible list to empty
 * whenever the debounced query changes, so the old results never flash
 * while the new fetch is in flight.
 */
export default function CardSearch({ onSelectCard }: Props) {
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query, 350);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const searchQuery = useQuery<CardResume[]>({
    queryKey: ["tcg", "cards", "search", debouncedQuery],
    queryFn: ({ signal }) =>
      fetch(
        `/api/tcg/cards?q=${encodeURIComponent(debouncedQuery.trim())}&page=1`,
        { signal },
      ).then((r) => {
        if (!r.ok) throw new Error("search failed");
        return r.json() as Promise<CardResume[]>;
      }),
    enabled: debouncedQuery.trim().length > 0,
    staleTime: 5 * 60_000,
    placeholderData: [],
  });

  const results = (searchQuery.data ?? []).slice(0, DROPDOWN_LIMIT);
  const loading = searchQuery.isLoading && debouncedQuery.trim().length > 0;
  const showDropdown = open && !!debouncedQuery.trim() && results.length > 0;

  // Open the dropdown automatically when results arrive
  useEffect(() => {
    if ((searchQuery.data?.length ?? 0) > 0) setOpen(true);
  }, [searchQuery.data]);

  // Close dropdown when the user clicks outside this component
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
          {/* spinner while the fetch is in-flight */}
          {loading && (
            <li className="flex items-center justify-center py-3">
              <svg
                className="animate-spin h-4 w-4 text-muted"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
            </li>
          )}
          {showDropdown &&
            results.map((card) => (
              <li
                key={card.id}
                role="option"
                aria-selected={false}
                className="flex items-center gap-2.5 px-3 py-1.5 hover:bg-surface-raised transition-colors"
              >
                {card.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={`${card.image}/low.webp`}
                    alt={card.name}
                    className="h-8 w-auto rounded shrink-0"
                    loading="lazy"
                  />
                ) : (
                  <div className="h-8 w-6 rounded bg-surface-raised shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground truncate">
                    {card.name}
                  </p>
                  <p className="text-xs text-muted">#{card.localId}</p>
                </div>
                <button
                  type="button"
                  className="shrink-0 px-2.5 py-0.5 rounded text-xs font-medium bg-primary-600 text-white hover:bg-primary-700 transition-colors"
                  onClick={() => handleSelect(card)}
                >
                  Add
                </button>
              </li>
            ))}
        </ul>
      )}
    </div>
  );
}
