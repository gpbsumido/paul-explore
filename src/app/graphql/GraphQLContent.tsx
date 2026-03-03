"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import Link from "next/link";
import ThemeToggle from "@/components/ThemeToggle";
import { Input } from "@/components/ui";
import { useDebounce } from "@/hooks/useDebounce";
import { useInfiniteQuery } from "@tanstack/react-query";
import {
  buildPokemonQuery,
  fetchPokemonPage,
  LIST_QUERY,
  LIST_BY_TYPE_QUERY,
  POKEMON_TYPE_COLORS,
  DEFAULT_TYPE_COLOR,
} from "@/lib/graphql";
import {
  POKEMON_TYPES,
  PAGE_SIZE,
  type PokemonListResult,
  type PokemonPage,
} from "@/types/graphql";
import { queryKeys } from "@/lib/queryKeys";
import PokemonCard from "./PokemonCard";

/**
 * Formats the query + variables into a readable snippet for the "Query" panel.
 * Just for display — not executed.
 */
function formatQuerySnippet(
  query: string,
  variables: Record<string, unknown>,
): string {
  return `${query.trim()}\n\n# variables\n${JSON.stringify(variables, null, 2)}`;
}

interface GraphQLContentProps {
  /**
   * Page 1 results fetched server-side — seeds the query cache so the grid
   * renders without a loading state on the initial unfiltered visit.
   * When the user types or picks a type the query key changes and a fresh
   * fetch fires on the new key; the seeded data stays cached for the
   * no-filter key.
   */
  initialData?: PokemonListResult;
}

export default function GraphQLContent({ initialData }: GraphQLContentProps) {
  const [name, setName] = useState("");
  const [activeType, setActiveType] = useState("");
  const debouncedName = useDebounce(name, 350);
  const [showQuery, setShowQuery] = useState(false);

  // Convert the raw GraphQL shape into the PokemonPage shape once so the
  // initialData option below stays tidy.
  const seedPage: PokemonPage | undefined = initialData
    ? {
        pokemon: initialData.pokemon_v2_pokemon,
        total: initialData.pokemon_v2_pokemon_aggregate.aggregate.count,
      }
    : undefined;

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    error: queryError,
  } = useInfiniteQuery<PokemonPage>({
    queryKey: queryKeys.graphql.pokemon({ name: debouncedName, type: activeType }),
    queryFn: ({ pageParam, signal }) =>
      fetchPokemonPage({
        name: debouncedName,
        type: activeType,
        offset: pageParam as number,
        signal,
      }),
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) =>
      lastPage.pokemon.length === PAGE_SIZE
        ? allPages.length * PAGE_SIZE
        : undefined,
    initialData: seedPage
      ? { pages: [seedPage], pageParams: [0] }
      : undefined,
    // SSR-seeded data is recent; background refetch after 30s. Without seed
    // data, Pokémon rarely changes so cache for 10 minutes.
    staleTime: seedPage ? 30_000 : 10 * 60_000,
  });

  const pokemon = useMemo(
    () => data?.pages.flatMap((p) => p.pokemon) ?? [],
    [data?.pages],
  );
  const total = data?.pages[0]?.total ?? 0;
  const loading = isLoading;
  const loadingMore = isFetchingNextPage;

  function toggleType(type: string) {
    setActiveType((prev) => (prev === type ? "" : type));
  }

  const sentinelRef = useRef<HTMLDivElement>(null);
  const onScrollRef = useRef<() => void>(() => {});

  // Keep the ref current whenever the pagination state changes. Updating it
  // in an effect (not during render) satisfies React 19's ref-access rules
  // while still giving the observer callback a fresh closure on every render.
  useEffect(() => {
    onScrollRef.current = () => {
      if (hasNextPage && !isFetchingNextPage) fetchNextPage();
    };
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Reconnect after each fetch so the observer fires even if the sentinel is
  // already in the viewport after new cards render.
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) onScrollRef.current();
      },
      { rootMargin: "200px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [pokemon.length]);

  // Offset of the last fetched page — drives the live query display so the
  // panel reflects what was actually sent most recently.
  const displayOffset = (data?.pageParams.at(-1) as number | undefined) ?? 0;

  // what the current query/variables look like — shown in the collapsible panel
  const { query: liveQuery, variables: liveVars } = buildPokemonQuery(
    debouncedName,
    activeType,
    PAGE_SIZE,
    displayOffset,
  );

  return (
    <div className="min-h-dvh bg-background font-sans">
      {/* ── header ── */}
      <div className="sticky top-0 z-20 border-b border-border bg-background/95 backdrop-blur-xl">
        <div className="mx-auto max-w-5xl px-4 py-3 flex items-center gap-3">
          <Link
            href="/protected"
            className="flex items-center gap-1.5 text-sm text-muted hover:text-foreground transition-colors shrink-0"
          >
            <svg width="7" height="12" viewBox="0 0 7 12" fill="none">
              <path
                d="M6 1L1 6l5 5"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Back
          </Link>
          <div className="flex-1">
            <h1 className="text-sm font-semibold text-foreground leading-tight">
              GraphQL Pokédex
            </h1>
            <p className="text-[11px] text-muted">
              PokeAPI · Hasura · plain fetch
            </p>
          </div>
          <ThemeToggle />
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-4 py-6 space-y-5">
        {/* ── search ── */}
        <Input
          label="Search"
          hideLabel
          type="search"
          autoComplete="off"
          placeholder="Search Pokémon…"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        {/* ── type filter pills ── */}
        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => setActiveType("")}
            className={[
              "px-3 py-1 rounded-full text-xs font-semibold border transition-colors",
              activeType === ""
                ? "bg-foreground text-background border-foreground"
                : "border-border text-muted hover:text-foreground hover:border-muted/60",
            ].join(" ")}
          >
            All
          </button>
          {POKEMON_TYPES.map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => toggleType(type)}
              className={[
                "px-3 py-1 rounded-full text-xs font-semibold border capitalize transition-colors",
                activeType === type
                  ? `${POKEMON_TYPE_COLORS[type] ?? DEFAULT_TYPE_COLOR}`
                  : "border-border text-muted hover:text-foreground hover:border-muted/60",
              ].join(" ")}
            >
              {type}
            </button>
          ))}
        </div>

        {/* ── results meta + query toggle ── */}
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted">
            {loading ? (
              <span className="animate-pulse">Loading…</span>
            ) : (
              <>
                Showing{" "}
                <span className="font-medium text-foreground">
                  {pokemon.length}
                </span>{" "}
                of <span className="font-medium text-foreground">{total}</span>{" "}
                Pokémon
                {activeType && (
                  <>
                    {" "}
                    — <span className="capitalize">{activeType}</span> type
                  </>
                )}
              </>
            )}
          </p>
          <button
            type="button"
            onClick={() => setShowQuery((v) => !v)}
            className="text-xs text-muted hover:text-foreground transition-colors flex items-center gap-1"
          >
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
              <path
                d="M3 2L1 5l2 3M7 2l2 3-2 3"
                stroke="currentColor"
                strokeWidth="1.3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            {showQuery ? "Hide query" : "Show query"}
          </button>
        </div>

        {/* ── live query panel ── */}
        {showQuery && (
          <div className="rounded-lg border border-border bg-surface overflow-hidden">
            <div className="px-3 py-2 border-b border-border flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted/50">
                Live GraphQL Query
              </span>
              <span className="text-[10px] text-muted/40">
                — updates as you search or filter
              </span>
            </div>
            <pre className="overflow-x-auto px-4 py-3 text-[11px] leading-relaxed text-foreground/80 font-mono whitespace-pre">
              {formatQuerySnippet(
                liveQuery === LIST_QUERY ? LIST_QUERY : LIST_BY_TYPE_QUERY,
                liveVars,
              )}
            </pre>
          </div>
        )}

        {/* ── grid ── */}
        {loading && pokemon.length === 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {Array.from({ length: 12 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : isError ? (
          <p className="text-center text-red-500 py-16 text-sm">
            {queryError?.message ?? "Couldn't load Pokémon — check your connection and try again."}
          </p>
        ) : pokemon.length === 0 ? (
          <p className="text-center text-muted py-16 text-sm">
            No Pokémon matched your search.
          </p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {pokemon.map((p) => (
              <PokemonCard key={p.id} pokemon={p} />
            ))}
            {loadingMore &&
              Array.from({ length: PAGE_SIZE }).map((_, i) => (
                <SkeletonCard key={`sk-${i}`} />
              ))}
          </div>
        )}

        {/* Sentinel — always in the DOM so IntersectionObserver can attach on mount */}
        <div ref={sentinelRef} className="h-8" />
      </div>
    </div>
  );
}

/** Placeholder card shown while loading — matches PokemonCard dimensions. */
function SkeletonCard() {
  return (
    <div className="rounded-xl border border-border bg-surface p-3 h-44 animate-pulse" />
  );
}
