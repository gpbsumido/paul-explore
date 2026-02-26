"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import ThemeToggle from "@/components/ThemeToggle";
import { Input } from "@/components/ui";
import { useDebounce } from "@/hooks/useDebounce";
import {
  buildPokemonQuery,
  fetchPokemon,
  LIST_QUERY,
  LIST_BY_TYPE_QUERY,
  POKEMON_TYPE_COLORS,
  DEFAULT_TYPE_COLOR,
} from "@/lib/graphql";
import {
  POKEMON_TYPES,
  PAGE_SIZE,
  type Pokemon,
  type PokemonListResult,
} from "@/types/graphql";
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

/**
 * The filter key for the initial empty state (no search, no type).
 * Pre-seeding loadedKey to this value tells the derived loading flag that
 * the current results are already fresh — no fetch needed on first render.
 */
const EMPTY_FILTER_KEY = "||";

interface GraphQLContentProps {
  /**
   * Page 1 results fetched server-side — when present the component skips
   * its own initial useEffect fetch and uses this data directly.
   */
  initialData?: PokemonListResult;
}

export default function GraphQLContent({ initialData }: GraphQLContentProps) {
  const [name, setName] = useState("");
  const [activeType, setActiveType] = useState("");
  const debouncedName = useDebounce(name, 350);

  const [pokemon, setPokemon] = useState<Pokemon[]>(
    initialData?.pokemon_v2_pokemon ?? [],
  );
  const [total, setTotal] = useState(
    initialData?.pokemon_v2_pokemon_aggregate.aggregate.count ?? 0,
  );
  const [offset, setOffset] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [showQuery, setShowQuery] = useState(false);

  // Pre-seed loadedKey so derived `loading` is false when server data exists.
  // Once the user types or picks a type, filterKey diverges and a real fetch fires.
  const [loadedKey, setLoadedKey] = useState<string | null>(
    initialData ? EMPTY_FILTER_KEY : null,
  );
  const filterKey = `${debouncedName}||${activeType}`;
  const loading = loadedKey !== filterKey;

  const abortRef = useRef<AbortController | null>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const onScrollRef = useRef<() => void>(() => {});

  // Skip the very first effect run when the server already fetched page 1.
  // After the user changes a filter this ref flips to false and fetches resume.
  const hasServerData = useRef(!!initialData);

  // re-fetch from scratch whenever search or type changes
  useEffect(() => {
    if (hasServerData.current) {
      hasServerData.current = false;
      return;
    }

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setOffset(0);
    setError(null);

    const { query, variables } = buildPokemonQuery(
      debouncedName,
      activeType,
      PAGE_SIZE,
      0,
    );

    fetchPokemon(query, variables, controller.signal)
      .then((data) => {
        if (controller.signal.aborted) return;
        setPokemon(data.pokemon_v2_pokemon);
        setTotal(data.pokemon_v2_pokemon_aggregate.aggregate.count);
        setLoadedKey(filterKey);
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          setError(
            "Couldn't load Pokémon — check your connection and try again.",
          );
          setLoadedKey(filterKey);
        }
      });

    return () => controller.abort();
  }, [debouncedName, activeType]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleLoadMore() {
    const nextOffset = offset + PAGE_SIZE;
    setOffset(nextOffset);
    setLoadingMore(true);
    try {
      const { query, variables } = buildPokemonQuery(
        debouncedName,
        activeType,
        PAGE_SIZE,
        nextOffset,
      );
      const data = await fetchPokemon(query, variables);
      setPokemon((prev) => [...prev, ...data.pokemon_v2_pokemon]);
    } catch {
      // silently fail — the existing results stay, user can retry
    } finally {
      setLoadingMore(false);
    }
  }

  function toggleType(type: string) {
    setActiveType((prev) => (prev === type ? "" : type));
  }

  const hasMore = pokemon.length < total;

  // always fresh — assigned in render so the observer closure is never stale
  onScrollRef.current = () => {
    if (!hasMore || loading || loadingMore || pokemon.length === 0) return;
    handleLoadMore();
  };

  // reconnect the observer after each fetch — re-fires if the sentinel is already in view
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

  // what the current query/variables look like — shown in the collapsible panel
  const { query: liveQuery, variables: liveVars } = buildPokemonQuery(
    debouncedName,
    activeType,
    PAGE_SIZE,
    offset,
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
        ) : error ? (
          <p className="text-center text-red-500 py-16 text-sm">{error}</p>
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
