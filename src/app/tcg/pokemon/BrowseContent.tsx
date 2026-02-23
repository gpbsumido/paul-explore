"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
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
  const searchParams = useSearchParams();
  const router = useRouter();
  const urlQ = searchParams.get("q") ?? "";
  const urlType = searchParams.get("type") ?? "";

  const [search, setSearch] = useState(urlQ);
  const [type, setType] = useState(urlType);
  const debouncedSearch = useDebounce(search, 350);

  useEffect(() => { setSearch(urlQ); }, [urlQ]);
  useEffect(() => { setType(urlType); }, [urlType]);

  useEffect(() => {
    const params = new URLSearchParams();
    if (debouncedSearch) params.set("q", debouncedSearch);
    if (type) params.set("type", type);
    const qs = params.toString();
    router.replace(`/tcg/pokemon${qs ? `?${qs}` : ""}`, { scroll: false });
  }, [debouncedSearch, type, router]);

  const [cards, setCards] = useState<CardResume[]>([]);
  const pageRef = useRef(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const hasMoreRef = useRef(hasMore);
  const loadingRef = useRef(loading);
  const cardsLengthRef = useRef(0);
  useEffect(() => { hasMoreRef.current = hasMore; }, [hasMore]);
  useEffect(() => { loadingRef.current = loading; }, [loading]);
  useEffect(() => { cardsLengthRef.current = cards.length; }, [cards]);

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

  useEffect(() => {
    pageRef.current = 1;
    fetchCards(debouncedSearch, type, 1, false);
  }, [debouncedSearch, type, fetchCards]);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (
          entry.isIntersecting &&
          hasMoreRef.current &&
          !loadingRef.current &&
          cardsLengthRef.current > 0
        ) {
          pageRef.current += 1;
          fetchCards(debouncedSearch, type, pageRef.current, true);
        }
      },
      { rootMargin: "200px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [debouncedSearch, type, fetchCards, cards.length]);

  function handleTypeClick(t: string) {
    setType((prev) => (prev === t ? "" : t));
  }

  return (
    <>
      {/* Sticky filter bar — sits directly below the nav (top-14 = 56px) */}
      <div className="sticky top-14 z-10 border-b border-border bg-background/95 backdrop-blur-xl">
        <div
          className="max-w-[1400px] mx-auto px-4 sm:px-6 h-14 flex items-center gap-3"
        >
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search cards…"
            className="w-40 sm:w-56 shrink-0 h-8 rounded-lg bg-surface border border-border px-3 text-sm text-foreground outline-none focus:border-red-400/60 placeholder:text-muted transition-colors"
          />
          <div className="h-4 w-px bg-border shrink-0" />
          <div
            className="flex gap-2 overflow-x-auto"
            style={{ scrollbarWidth: "none" }}
          >
            <TypePill label="All" active={type === ""} onClick={() => setType("")} />
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
        </div>
      </div>

    <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-6 flex flex-col gap-4">
      {/* Results */}
      {loading && cards.length === 0 ? (
        <SkeletonGrid />
      ) : error ? (
        <div className="flex flex-col items-center gap-3 py-20 text-center text-muted text-sm">
          <span>{error}</span>
          <button
            onClick={() => fetchCards(debouncedSearch, type, 1, false)}
            className="px-5 py-2 rounded-lg text-sm border border-border text-foreground hover:bg-surface transition-colors"
          >
            Retry
          </button>
        </div>
      ) : cards.length === 0 ? (
        <div className="flex items-center justify-center py-20 text-muted text-sm">
          No cards found
        </div>
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-3">
          {cards.map((card) => (
            <CardTile key={card.id} card={card} />
          ))}
        </div>
      )}

      {/* Sentinel — always in the DOM so IntersectionObserver can attach on mount */}
      <div ref={sentinelRef} className="flex justify-center h-8">
        {loading && cards.length > 0 && (
          <span className="text-muted text-sm">Loading…</span>
        )}
      </div>
    </div>
    </>
  );
}

function CardTile({ card }: { card: CardResume }) {
  return (
    <Link
      href={`/tcg/pokemon/card/${card.id}`}
      className="group rounded-lg overflow-hidden border border-border bg-surface hover:border-red-400/50 hover:shadow-lg hover:shadow-red-500/10 transition-all"
    >
      {card.image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={`${card.image}/low.webp`}
          alt={card.name}
          className="w-full group-hover:scale-[1.03] transition-transform duration-200"
          loading="lazy"
        />
      ) : (
        <div className="w-full bg-surface-raised" style={{ aspectRatio: "2.5/3.5" }} />
      )}
      <div className="px-2 py-1.5">
        <p className="text-[11px] font-semibold text-muted truncate">{card.name}</p>
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
      className={`shrink-0 px-3 py-1 rounded-md text-[11px] font-bold uppercase tracking-wide border transition-colors ${
        active
          ? `${typeColor ?? "bg-red-500/20 text-red-300"} border-transparent`
          : "bg-transparent text-muted border-border hover:border-foreground/40"
      }`}
    >
      {label}
    </button>
  );
}

function SkeletonGrid() {
  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-3">
      {Array.from({ length: 21 }).map((_, i) => (
        <div
          key={i}
          className="rounded-lg bg-surface animate-pulse"
          style={{ aspectRatio: "2.5/3.5" }}
        />
      ))}
    </div>
  );
}
