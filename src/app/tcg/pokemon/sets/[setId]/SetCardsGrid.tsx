"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";

const PER_PAGE = 20;

type CardResume = {
  id: string;
  name: string;
  image?: string;
  localId: string;
};

export default function SetCardsGrid({ setId }: { setId: string }) {
  const [cards, setCards] = useState<CardResume[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pageRef = useRef(1);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const hasMoreRef = useRef(hasMore);
  const loadingRef = useRef(loading);
  const cardsLengthRef = useRef(0);
  useEffect(() => { hasMoreRef.current = hasMore; }, [hasMore]);
  useEffect(() => { loadingRef.current = loading; }, [loading]);
  useEffect(() => { cardsLengthRef.current = cards.length; }, [cards]);

  const fetchCards = useCallback(
    async (pg: number, append: boolean) => {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams({ setId, page: pg.toString() });
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
          setCards(data.filter((c) => seen.has(c.id) ? false : seen.add(c.id) && true));
        }
        setHasMore(data.length === PER_PAGE);
      } catch {
        setError("Failed to load cards.");
      } finally {
        setLoading(false);
      }
    },
    [setId]
  );

  useEffect(() => {
    pageRef.current = 1;
    fetchCards(1, false);
  }, [fetchCards]);

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
          fetchCards(pageRef.current, true);
        }
      },
      { rootMargin: "200px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [fetchCards, cards.length]);

  return (
    <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-8 flex flex-col gap-4">
      {loading && cards.length === 0 ? (
        <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-2">
          {Array.from({ length: 20 }).map((_, i) => (
            <div
              key={i}
              className="rounded-lg bg-surface animate-pulse"
              style={{ aspectRatio: "2.5/3.5" }}
            />
          ))}
        </div>
      ) : error ? (
        <div className="flex flex-col items-center gap-3 py-20 text-center text-muted text-sm">
          <span>{error}</span>
          <button
            onClick={() => { pageRef.current = 1; fetchCards(1, false); }}
            className="px-5 py-2 rounded-lg text-sm border border-border text-foreground hover:bg-surface transition-colors"
          >
            Retry
          </button>
        </div>
      ) : cards.length === 0 ? (
        <div className="flex items-center justify-center py-20 text-muted text-sm">
          No cards available
        </div>
      ) : (
        <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-2">
          {cards.map((card) => (
            <Link
              key={card.id}
              href={`/tcg/pokemon/card/${card.id}`}
              className="group rounded-lg overflow-hidden border border-border hover:border-red-400/50 hover:shadow-lg hover:shadow-red-500/10 transition-all"
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
            </Link>
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
  );
}
