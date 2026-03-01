"use client";

import { useEffect, useRef, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useInfiniteQuery } from "@tanstack/react-query";
import Link from "next/link";
import Button from "@/components/ui/Button";
import { type CardResume, type CardPage } from "@/lib/tcg";
import { queryKeys } from "@/lib/queryKeys";

const PER_PAGE = 20;

export default function SetCardsGrid({ setId }: { setId: string }) {
  const searchParams = useSearchParams();
  const router = useRouter();

  const rawPage = parseInt(searchParams.get("page") ?? "1", 10);
  const initialPageParam = Number.isNaN(rawPage) ? 1 : rawPage;

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    refetch,
  } = useInfiniteQuery<CardPage>({
    queryKey: queryKeys.tcg.cards({ setId }),
    queryFn: async ({ pageParam, signal }): Promise<CardPage> => {
      const params = new URLSearchParams({ setId, page: String(pageParam) });
      const res = await fetch(`/api/tcg/cards?${params}`, { signal });
      if (!res.ok) throw new Error("Failed to fetch cards");
      const data: CardResume[] = await res.json();
      return { cards: data, hasMore: data.length >= PER_PAGE };
    },
    initialPageParam,
    getNextPageParam: (lastPage, _allPages, lastPageParam) =>
      lastPage.hasMore ? (lastPageParam as number) + 1 : undefined,
    staleTime: 10 * 60_000,
  });

  const cards = useMemo(
    () => data?.pages.flatMap((p) => p.cards) ?? [],
    [data?.pages],
  );

  const latestPage = (data?.pageParams.at(-1) as number | undefined) ?? 1;

  useEffect(() => {
    const params = new URLSearchParams();
    if (latestPage > 1) params.set("page", String(latestPage));
    const qs = params.toString();
    router.replace(`/tcg/pokemon/sets/${setId}${qs ? `?${qs}` : ""}`, { scroll: false });
  }, [latestPage, setId, router]);

  const sentinelRef = useRef<HTMLDivElement>(null);

  const onScrollRef = useRef<() => void>(() => {});

  useEffect(() => {
    onScrollRef.current = () => {
      if (hasNextPage && !isFetchingNextPage) fetchNextPage();
    };
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) onScrollRef.current(); },
      { rootMargin: "200px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [cards.length]);

  return (
    <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-8 flex flex-col gap-4">
      {isLoading && cards.length === 0 ? (
        <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-2">
          {Array.from({ length: 20 }).map((_, i) => (
            <div
              key={i}
              className="rounded-lg bg-surface animate-pulse"
              style={{ aspectRatio: "2.5/3.5" }}
            />
          ))}
        </div>
      ) : isError ? (
        <div className="flex flex-col items-center gap-3 py-20 text-center text-muted text-sm">
          <span>Failed to load cards.</span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
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
              className="group rounded-lg overflow-hidden border border-border hover:border-red-400/50 hover:shadow-lg hover:shadow-red-500/10 transition-[border-color,box-shadow]"
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
          {isFetchingNextPage && Array.from({ length: PER_PAGE }).map((_, i) => (
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
