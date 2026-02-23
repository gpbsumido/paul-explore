"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { POKEMON_TYPES, typeStyle } from "@/lib/tcg";

const PER_PAGE = 20;

type CardResume = {
  id: string;
  name: string;
  image?: string;
  localId: string;
};

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

export default function BrowseContent() {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 350);
  const [type, setType] = useState("");
  const [cards, setCards] = useState<CardResume[]>([]);
  const pageRef = useRef(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCards = useCallback(
    async (q: string, t: string, pg: number, append: boolean) => {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams({ page: pg.toString() });
        if (q) params.set("q", q);
        if (t) params.set("type", t);
        const res = await fetch(`/api/tcg/cards?${params}`);
        if (!res.ok) throw new Error("Failed to fetch cards");
        const data: CardResume[] = await res.json();
        if (append) {
          setCards((prev) => {
            const seen = new Set(prev.map((c) => c.id));
            return [...prev, ...data.filter((c) => !seen.has(c.id))];
          });
        } else {
          // dedupe within a single page response too
          const seen = new Set<string>();
          setCards(data.filter((c) => (seen.has(c.id) ? false : seen.add(c.id) && true)));
        }
        setHasMore(data.length === PER_PAGE);
      } catch {
        setError("Failed to load cards. Try again.");
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Reset + fetch whenever search or type changes
  useEffect(() => {
    pageRef.current = 1;
    fetchCards(debouncedSearch, type, 1, false);
  }, [debouncedSearch, type, fetchCards]);

  function handleLoadMore() {
    pageRef.current += 1;
    fetchCards(debouncedSearch, type, pageRef.current, true);
  }

  function handleTypeClick(t: string) {
    setType((prev) => (prev === t ? "" : t));
  }

  return (
    <>
      {/* Search */}
      <div className="px-4 py-2.5 border-b border-border">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search cards…"
          className="w-full h-9 rounded-[10px] bg-surface border border-border px-3 text-[15px] text-foreground outline-none focus:border-[#007aff] placeholder:text-muted transition-colors"
        />
      </div>

      {/* Type filters */}
      <div
        className="flex gap-2 px-4 py-2.5 border-b border-border overflow-x-auto"
        style={{ scrollbarWidth: "none" }}
      >
        <TypePill
          label="All"
          active={type === ""}
          onClick={() => setType("")}
        />
        {POKEMON_TYPES.map((t) => (
          <TypePill
            key={t}
            label={t}
            active={type === t}
            onClick={() => handleTypeClick(t)}
            typeColor={typeStyle(t)}
          />
        ))}
      </div>

      {/* Results */}
      <div className="flex-1 px-4 py-4">
        {loading && cards.length === 0 ? (
          <SkeletonGrid />
        ) : error ? (
          <div className="flex flex-col items-center gap-3 py-16 text-center text-muted text-[15px]">
            <span>{error}</span>
            <button
              onClick={() => fetchCards(debouncedSearch, type, 0, false)}
              className="px-5 py-2 rounded-full text-sm border border-border text-foreground hover:bg-surface transition-colors"
            >
              Retry
            </button>
          </div>
        ) : cards.length === 0 ? (
          <div className="flex items-center justify-center py-16 text-muted text-[15px]">
            No cards found
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {cards.map((card) => (
                <CardTile key={card.id} card={card} />
              ))}
            </div>

            {hasMore && (
              <div className="mt-5 flex justify-center">
                <button
                  onClick={handleLoadMore}
                  disabled={loading}
                  className="px-6 py-2 rounded-full text-sm font-medium border border-border text-foreground hover:bg-surface disabled:opacity-50 transition-colors"
                >
                  {loading ? "Loading…" : "Load more"}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}

function CardTile({ card }: { card: CardResume }) {
  return (
    <Link
      href={`/tcg/pokemon/card/${card.id}`}
      className="group rounded-xl overflow-hidden border border-border bg-surface hover:border-primary-400 hover:shadow-lg transition-all"
    >
      {card.image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={`${card.image}/low.webp`}
          alt={card.name}
          className="w-full group-hover:scale-[1.02] transition-transform duration-200"
          loading="lazy"
        />
      ) : (
        <div
          className="w-full bg-surface-raised"
          style={{ aspectRatio: "2.5/3.5" }}
        />
      )}
      <div className="px-2 py-1.5">
        <p className="text-[12px] font-medium text-foreground truncate">
          {card.name}
        </p>
      </div>
    </Link>
  );
}

function TypePill({
  label,
  active,
  onClick,
  typeColor,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  typeColor?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`shrink-0 px-3 py-1 rounded-full text-[11px] font-semibold border transition-colors ${
        active
          ? `${typeColor ?? "bg-foreground text-background"} border-transparent`
          : "bg-transparent text-muted border-border hover:border-foreground/50"
      }`}
    >
      {label}
    </button>
  );
}

function SkeletonGrid() {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {Array.from({ length: 12 }).map((_, i) => (
        <div
          key={i}
          className="rounded-xl bg-surface animate-pulse"
          style={{ aspectRatio: "2.5/3.5" }}
        />
      ))}
    </div>
  );
}
