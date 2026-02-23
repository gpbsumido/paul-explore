"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import Button from "@/components/ui/Button";

const PER_PAGE = 20;

type CardResume = {
  id: string;
  name: string;
  image?: string;
  localId: string;
};

export default function SetCardsGrid({ setId }: { setId: string }) {
  const searchParams = useSearchParams();
  const router = useRouter();

  const rawPage = parseInt(searchParams.get("page") ?? "1", 10);
  const initialPageRef = useRef(Number.isNaN(rawPage) ? 1 : rawPage);
  const isFirstMountRef = useRef(true);
  const [loadedPages, setLoadedPages] = useState(initialPageRef.current);

  const [cards, setCards] = useState<CardResume[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const params = new URLSearchParams();
    if (loadedPages > 1) params.set("page", loadedPages.toString());
    const qs = params.toString();
    router.replace(`/tcg/pokemon/sets/${setId}${qs ? `?${qs}` : ""}`, { scroll: false });
  }, [loadedPages, setId, router]);

  const fetchCards = useCallback(
    async (pg: number, append: boolean) => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams({ setId, page: pg.toString() });
        const res = await fetch(`/api/tcg/cards?${params}`, { signal: controller.signal });
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
        setHasMore(data.length >= PER_PAGE);
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") return;
        setError("Failed to load cards.");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    },
    [setId]
  );

  useEffect(() => {
    if (isFirstMountRef.current) {
      isFirstMountRef.current = false;
      const targetPage = initialPageRef.current;
      if (targetPage > 1) {
        const restore = async () => {
          for (let p = 1; p <= targetPage; p++) {
            await fetchCards(p, p > 1);
          }
        };
        restore();
        return;
      }
    }
    fetchCards(1, false);
  }, [fetchCards]);

  // always fresh — assigned in render, not in an effect
  const onScrollRef = useRef<() => void>(() => {});
  onScrollRef.current = () => {
    if (!hasMore || loading || cards.length === 0) return;
    const nextPage = loadedPages + 1;
    setLoadedPages(nextPage);
    fetchCards(nextPage, true);
  };

  // cards.length dep forces reconnect after each fetch — needed so the
  // observer re-fires if the sentinel is already in the viewport
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) onScrollRef.current(); },
      { rootMargin: "200px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [cards.length]);

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
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchCards(1, false)}
          >
            Retry
          </Button>
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
          {loading && Array.from({ length: PER_PAGE }).map((_, i) => (
            <div
              key={`sk-${i}`}
              className="rounded-lg bg-surface animate-pulse"
              style={{ aspectRatio: "2.5/3.5" }}
            />
          ))}
        </div>
      )}

      {/* Sentinel — always in the DOM so IntersectionObserver can attach on mount */}
      <div ref={sentinelRef} className="h-8" />
    </div>
  );
}
