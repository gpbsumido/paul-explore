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

  const fetchCards = useCallback(
    async (pg: number, append: boolean) => {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams({
          setId,
          page: pg.toString(),
        });
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
          setCards(
            data.filter((c) =>
              seen.has(c.id) ? false : seen.add(c.id) && true
            )
          );
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

  function handleLoadMore() {
    pageRef.current += 1;
    fetchCards(pageRef.current, true);
  }

  if (loading && cards.length === 0) {
    return (
      <div className="px-4 py-4 grid grid-cols-3 gap-2">
        {Array.from({ length: 12 }).map((_, i) => (
          <div
            key={i}
            className="rounded-lg bg-surface animate-pulse"
            style={{ aspectRatio: "2.5/3.5" }}
          />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center gap-3 py-12 text-center text-muted text-[15px] px-4">
        <span>{error}</span>
        <button
          onClick={() => {
            pageRef.current = 1;
            fetchCards(1, false);
          }}
          className="px-5 py-2 rounded-full text-sm border border-border text-foreground hover:bg-surface transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  if (cards.length === 0) {
    return (
      <div className="flex items-center justify-center py-12 text-muted text-[15px]">
        No cards available
      </div>
    );
  }

  return (
    <div className="px-4 py-4 flex flex-col gap-4">
      <div className="grid grid-cols-3 gap-2">
        {cards.map((card) => (
          <Link
            key={card.id}
            href={`/tcg/pokemon/card/${card.id}`}
            className="group rounded-lg overflow-hidden border border-border hover:border-primary-400 hover:shadow-md transition-all"
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
              <div
                className="w-full bg-surface-raised"
                style={{ aspectRatio: "2.5/3.5" }}
              />
            )}
          </Link>
        ))}
      </div>

      {hasMore && (
        <div className="flex justify-center">
          <button
            onClick={handleLoadMore}
            disabled={loading}
            className="px-6 py-2 rounded-full text-sm font-medium border border-border text-foreground hover:bg-surface disabled:opacity-50 transition-colors"
          >
            {loading ? "Loading…" : "Load more"}
          </button>
        </div>
      )}
    </div>
  );
}
