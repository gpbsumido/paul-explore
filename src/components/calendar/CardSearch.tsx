"use client";

import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui";
import { type CardResume } from "@/lib/tcg";
import { useDebounce } from "@/hooks/useDebounce";
import { queryKeys } from "@/lib/queryKeys";

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
  const [activeIndex, setActiveIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const listboxId = "card-search-listbox";

  const searchQuery = useQuery<CardResume[]>({
    queryKey: queryKeys.tcg.search(debouncedQuery),
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
    setActiveIndex(-1);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!showDropdown) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setActiveIndex((prev) => (prev < results.length - 1 ? prev + 1 : 0));
        break;
      case "ArrowUp":
        e.preventDefault();
        setActiveIndex((prev) => (prev > 0 ? prev - 1 : results.length - 1));
        break;
      case "Enter":
        e.preventDefault();
        if (activeIndex >= 0 && activeIndex < results.length) {
          handleSelect(results[activeIndex]);
        }
        break;
      case "Escape":
        e.preventDefault();
        setOpen(false);
        setActiveIndex(-1);
        break;
      case "Home":
        e.preventDefault();
        setActiveIndex(0);
        break;
      case "End":
        e.preventDefault();
        setActiveIndex(results.length - 1);
        break;
    }
  }

  const activeOptionId =
    activeIndex >= 0 && results[activeIndex]
      ? `card-option-${results[activeIndex].id}`
      : undefined;

  return (
    <div ref={containerRef} className="relative">
      <Input
        label="Search cards"
        hideLabel
        size="sm"
        type="search"
        role="combobox"
        autoComplete="off"
        aria-expanded={showDropdown}
        aria-controls={listboxId}
        aria-activedescendant={activeOptionId}
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setActiveIndex(-1);
          if (e.target.value.trim()) setOpen(true);
          else setOpen(false);
        }}
        onFocus={() => {
          if (results.length > 0 && debouncedQuery.trim()) setOpen(true);
        }}
        onKeyDown={handleKeyDown}
        placeholder="Search Pokémon cards…"
      />

      {(showDropdown || loading) && (
        <ul
          id={listboxId}
          role="listbox"
          aria-label="Card search results"
          className="absolute z-50 left-0 right-0 mt-1 rounded-md border border-border bg-background shadow-lg overflow-hidden max-h-64 overflow-y-auto"
        >
          {/* spinner while the fetch is in-flight */}
          {loading && (
            <li
              role="presentation"
              className="flex items-center justify-center py-3"
            >
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
              <span className="sr-only">Searching cards…</span>
            </li>
          )}
          {showDropdown &&
            results.map((card, i) => (
              <li
                key={card.id}
                id={`card-option-${card.id}`}
                role="option"
                aria-selected={i === activeIndex}
                className={[
                  "flex items-center gap-2.5 px-3 py-1.5 transition-colors cursor-pointer",
                  i === activeIndex
                    ? "bg-surface-raised"
                    : "hover:bg-surface-raised",
                ].join(" ")}
                onClick={() => handleSelect(card)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") handleSelect(card);
                }}
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
                <span className="shrink-0 px-2.5 py-0.5 rounded text-xs font-medium bg-primary-600 text-white">
                  Add
                </span>
              </li>
            ))}
        </ul>
      )}

      {/* Live region to announce result count */}
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {showDropdown
          ? `${results.length} result${results.length === 1 ? "" : "s"} available`
          : loading
            ? "Searching…"
            : ""}
      </div>
    </div>
  );
}
