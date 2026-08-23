"use client";

import { useQuery } from "@tanstack/react-query";
import PageHeader from "@/components/PageHeader";
import PageShell from "@/components/PageShell";
import { queryKeys } from "@/lib/queryKeys";
import { RARITY_META } from "@/lib/fantasy-cards";
import FantasyNav from "../../FantasyNav";

type CollectionCard = {
  id: string;
  cardId: string;
  rarity: keyof typeof RARITY_META;
  playerName: string;
  title: string;
  subtitle: string;
  imageUrl: string;
  points: number;
};

type OwnedCard = CollectionCard & { count: number };

async function getCollection(): Promise<CollectionCard[] | null> {
  const res = await fetch("/api/card-lab/collection");
  if (res.status === 401) return null; // guest
  if (!res.ok) throw new Error("Could not load your collection");
  const body = (await res.json()) as { cards: CollectionCard[] };
  return body.cards;
}

/** Group duplicate pulls of the same card into one tile with a count. */
function groupByCard(cards: CollectionCard[]): OwnedCard[] {
  const byId = new Map<string, OwnedCard>();
  for (const card of cards) {
    const existing = byId.get(card.cardId);
    if (existing) existing.count += 1;
    else byId.set(card.cardId, { ...card, count: 1 });
  }
  return [...byId.values()];
}

export default function CollectionContent() {
  const collection = useQuery({
    queryKey: queryKeys.cardLab.collection(),
    queryFn: getCollection,
  });

  const owned = collection.data ? groupByCard(collection.data) : [];

  return (
    <PageShell
      colorA="var(--color-feature-nba)"
      colorB="var(--color-feature-tcg)"
      className="font-sans"
    >
      <PageHeader
        breadcrumbs={[
          { label: "Dashboard", href: "/" },
          { label: "Fantasy NBA", href: "/fantasy/nba" },
          { label: "Card Lab", href: "/fantasy/nba/cards" },
          { label: "Collection" },
        ]}
        maxWidth="max-w-5xl"
      />
      <FantasyNav />

      <main className="mx-auto max-w-5xl px-4 sm:px-6 py-8">
        <h1 className="mb-6 text-2xl font-bold tracking-tight text-foreground">
          My Collection
        </h1>

        {collection.isLoading ? null : !collection.data ? (
          <p className="rounded-xl border border-border bg-surface px-4 py-6 text-[15px] text-muted">
            <a href="/auth/login" className="font-semibold text-foreground underline">
              Sign in
            </a>{" "}
            to see the cards you&rsquo;ve pulled.
          </p>
        ) : owned.length === 0 ? (
          <p className="rounded-xl border border-border bg-surface px-4 py-6 text-[15px] text-muted">
            No cards yet. Head to the{" "}
            <a href="/fantasy/nba/cards" className="underline">
              Card Lab
            </a>{" "}
            and rip a pack.
          </p>
        ) : (
          <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {owned.map((card) => (
              <li key={card.cardId}>
                <article
                  className="glass-card flex h-full flex-col overflow-hidden rounded-xl border-2"
                  style={{ borderColor: RARITY_META[card.rarity].color }}
                  aria-label={`${card.title}, ${RARITY_META[card.rarity].label}${card.count > 1 ? `, ${card.count} copies` : ""}`}
                >
                  <div className="aspect-[2.5/3.5] w-full overflow-hidden bg-surface">
                    {/* eslint-disable-next-line @next/next/no-img-element -- ESPN CDN base URL */}
                    <img
                      src={card.imageUrl}
                      alt={`${card.playerName} headshot`}
                      loading="lazy"
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="flex flex-1 flex-col gap-1 p-3">
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className="rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide"
                        style={{
                          color: RARITY_META[card.rarity].color,
                          borderColor: RARITY_META[card.rarity].color,
                        }}
                      >
                        {RARITY_META[card.rarity].label}
                      </span>
                      {card.count > 1 ? (
                        <span className="tabular-nums text-[11px] font-semibold text-muted">
                          ×{card.count}
                        </span>
                      ) : null}
                    </div>
                    <h2 className="mt-0.5 text-[13px] font-semibold leading-snug text-foreground">
                      {card.playerName}
                    </h2>
                    <p className="text-[11px] text-muted">{card.subtitle}</p>
                  </div>
                </article>
              </li>
            ))}
          </ul>
        )}
      </main>
    </PageShell>
  );
}
