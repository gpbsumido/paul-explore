"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { POKEMON_TYPES, typeStyle, type CardResume } from "@/lib/tcg";
import { useDebounce } from "@/hooks/useDebounce";

const PER_PAGE = 20;

interface BrowseContentProps {
  /**
   * First page of unfiltered cards fetched server-side — skips the initial
   * client fetch when the user lands on the page with no active filters.
   * If the URL has ?q= or ?type= on load, this data is stale and gets replaced.
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

  // Capture initial page from URL (only meaningful on first mount)
  const rawPage = parseInt(searchParams.get("page") ?? "1", 10);
  const initialPageRef = useRef(Number.isNaN(rawPage) ? 1 : rawPage);
  const isFirstMountRef = useRef(true);
  const [loadedPages, setLoadedPages] = useState(initialPageRef.current);

  useEffect(() => {
    const params = new URLSearchParams();
    if (debouncedSearch) params.set("q", debouncedSearch);
    if (type) params.set("type", type);
    if (loadedPages > 1) params.set("page", loadedPages.toString());
    const qs = params.toString();
    router.replace(`/tcg/pokemon${qs ? `?${qs}` : ""}`, { scroll: false });
  }, [debouncedSearch, type, loadedPages, router]);

  // Initialise from server data when available.
  // hasMore is true when the server returned a full page — there are likely more.
  const [cards, setCards] = useState<CardResume[]>(initialCards ?? []);
  const [hasMore, setHasMore] = useState((initialCards?.length ?? 0) >= PER_PAGE);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Skip the initial client fetch when the server gave us unfiltered page 1
  // AND the URL confirms no filters are active. If filters are in the URL
  // (shared link, back-nav) the server data is stale and we fetch fresh.
  const hasServerData = useRef(
    !!initialCards?.length && !urlQ && !urlType,
  );

  const fetchCards = useCallback(
    async (q: string, t: string, pg: number, append: boolean) => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams({ page: pg.toString() });
        if (q) params.set("q", q);
        if (t) params.set("type", t);
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
          setCards(data.filter((c) => (seen.has(c.id) ? false : seen.add(c.id) && true)));
        }
        setHasMore(data.length >= PER_PAGE);
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") return;
        setError("Failed to load cards. Try again.");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    if (isFirstMountRef.current) {
      isFirstMountRef.current = false;
      const targetPage = initialPageRef.current;

      if (hasServerData.current) {
        hasServerData.current = false;
        // Server gave us page 1 — skip re-fetching it.
        // If the URL has page > 1, load pages 2–N to restore scroll position.
        if (targetPage > 1) {
          const restore = async () => {
            for (let p = 2; p <= targetPage; p++) {
              await fetchCards(debouncedSearch, type, p, true);
            }
          };
          restore();
        }
        return;
      }

      if (targetPage > 1) {
        // No server data — restore full scroll state: pages 1–N
        const restore = async () => {
          for (let p = 1; p <= targetPage; p++) {
            await fetchCards(debouncedSearch, type, p, p > 1);
          }
        };
        restore();
        return;
      }
    }
    // Normal reset: filter changed or first mount at page 1 without server data
    setLoadedPages(1);
    fetchCards(debouncedSearch, type, 1, false);
  }, [debouncedSearch, type, fetchCards]);

  // always fresh — assigned in render, not in an effect
  const onScrollRef = useRef<() => void>(() => {});
  onScrollRef.current = () => {
    if (!hasMore || loading || cards.length === 0) return;
    const nextPage = loadedPages + 1;
    setLoadedPages(nextPage);
    fetchCards(debouncedSearch, type, nextPage, true);
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
      {loading && cards.length === 0 ? (
        <SkeletonGrid />
      ) : error ? (
        <div className="flex flex-col items-center gap-3 py-20 text-center text-muted text-sm">
          <span>{error}</span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchCards(debouncedSearch, type, 1, false)}
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
          {loading && Array.from({ length: PER_PAGE }).map((_, i) => (
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
