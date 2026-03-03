"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useInfiniteQuery } from "@tanstack/react-query";
import Link from "next/link";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { POKEMON_TYPES, typeStyle, type CardResume, type CardPage } from "@/lib/tcg";
import { useDebounce } from "@/hooks/useDebounce";
import { queryKeys } from "@/lib/queryKeys";

const PER_PAGE = 20;

interface BrowseContentProps {
  /**
   * First page of unfiltered cards fetched server-side — seeds the query cache
   * so the grid renders without a loading state on the initial unfiltered visit.
   * Ignored when the URL has active search or type filters since the key will
   * differ from the no-filter key where initialData is registered.
   */
  initialCards?: CardResume[];
}

export default function BrowseContent({ initialCards }: BrowseContentProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const urlQ = searchParams.get("q") ?? "";
  const urlType = searchParams.get("type") ?? "";

  const [search, setSearch] = useState(urlQ);
  const [type, setType] = useState(urlType);
  const debouncedSearch = useDebounce(search, 350);

  useEffect(() => { setSearch(urlQ); }, [urlQ]);
  useEffect(() => { setType(urlType); }, [urlType]);

  // When server data is available start from page 1 so initialData and
  // initialPageParam agree. Otherwise read ?page=N from the URL to resume
  // approximately where the previous session left off.
  const rawPage = parseInt(searchParams.get("page") ?? "1", 10);
  const initialPageParam = initialCards ? 1 : (Number.isNaN(rawPage) ? 1 : rawPage);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    refetch,
  } = useInfiniteQuery<CardPage>({
    queryKey: queryKeys.tcg.cards({ q: debouncedSearch, type }),
    queryFn: async ({ pageParam, signal }): Promise<CardPage> => {
      const params = new URLSearchParams({ page: String(pageParam) });
      if (debouncedSearch) params.set("q", debouncedSearch);
      if (type) params.set("type", type);
      const res = await fetch(`/api/tcg/cards?${params}`, { signal });
      if (!res.ok) throw new Error("Failed to fetch cards");
      const cards: CardResume[] = await res.json();
      return { cards, hasMore: cards.length >= PER_PAGE };
    },
    initialPageParam,
    getNextPageParam: (lastPage, _allPages, lastPageParam) =>
      lastPage.hasMore ? (lastPageParam as number) + 1 : undefined,
    initialData: initialCards
      ? {
          pages: [{ cards: initialCards, hasMore: initialCards.length >= PER_PAGE }],
          pageParams: [1],
        }
      : undefined,
    // SSR-seeded data is recent but may go stale quickly; background refetch
    // after 30s. Without initialData, card catalogs rarely change so cache
    // them for 10 minutes.
    staleTime: initialCards ? 30_000 : 10 * 60_000,
  });

  const cards = useMemo(
    () => data?.pages.flatMap((p) => p.cards) ?? [],
    [data?.pages],
  );

  // The page number of the last fetched page — drives URL sync
  const latestPage = (data?.pageParams.at(-1) as number | undefined) ?? 1;

  // Sync filters and current page depth to the URL for shareability and
  // back-navigation. router.replace with scroll:false keeps the viewport still.
  useEffect(() => {
    const params = new URLSearchParams();
    if (debouncedSearch) params.set("q", debouncedSearch);
    if (type) params.set("type", type);
    if (latestPage > 1) params.set("page", String(latestPage));
    const qs = params.toString();
    router.replace(`/tcg/pokemon${qs ? `?${qs}` : ""}`, { scroll: false });
  }, [debouncedSearch, type, latestPage, router]);

  const sentinelRef = useRef<HTMLDivElement>(null);
  const onScrollRef = useRef<() => void>(() => {});

  // Keep the ref current whenever pagination state changes. Updating in an
  // effect (not during render) satisfies React 19's ref-access rules while
  // still giving the observer callback a fresh closure on every render.
  useEffect(() => {
    onScrollRef.current = () => {
      if (hasNextPage && !isFetchingNextPage) fetchNextPage();
    };
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Reconnect after each fetch so the observer fires even if the sentinel is
  // already in the viewport — the reconnect forces observe() to immediately
  // report current intersection state.
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
          <Input
            type="search"
            label="Search cards"
            hideLabel
            size="sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search cards…"
            className="w-40 sm:w-56 shrink-0"
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
      {isLoading && cards.length === 0 ? (
        <SkeletonGrid />
      ) : isError ? (
        <div className="flex flex-col items-center gap-3 py-20 text-center text-muted text-sm">
          <span>Failed to load cards. Try again.</span>
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
          No cards found
        </div>
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-3">
          {cards.map((card) => (
            <CardTile key={card.id} card={card} />
          ))}
          {isFetchingNextPage && Array.from({ length: PER_PAGE }).map((_, i) => (
            <SkeletonCard key={`sk-${i}`} />
          ))}
        </div>
      )}

      {/* Sentinel — always in the DOM so IntersectionObserver can attach on mount */}
      <div ref={sentinelRef} className="h-8" />
    </div>
    </>
  );
}

function CardTile({ card }: { card: CardResume }) {
  return (
    <Link
      href={`/tcg/pokemon/card/${card.id}`}
      className="group rounded-lg overflow-hidden border border-border bg-surface hover:border-red-400/50 hover:shadow-lg hover:shadow-red-500/10 transition-[border-color,box-shadow]"
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
    <Button
      variant="ghost"
      size="xs"
      onClick={onClick}
      className={`shrink-0 font-bold uppercase tracking-wide border ${
        active
          ? `${typeColor ?? "bg-red-500/20 text-red-300"} border-transparent`
          : "text-muted border-border hover:border-foreground/40"
      }`}
    >
      {label}
    </Button>
  );
}

function SkeletonCard() {
  return (
    <div className="rounded-lg overflow-hidden border border-border bg-surface animate-pulse">
      <div className="w-full bg-surface-raised" style={{ aspectRatio: "2.5/3.5" }} />
      <div className="px-2 py-1.5">
        <div className="h-2 w-2/3 rounded bg-surface-raised" />
      </div>
    </div>
  );
}

function SkeletonGrid() {
  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-3">
      {Array.from({ length: 21 }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}
