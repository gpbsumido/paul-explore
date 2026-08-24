"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import PageHeader from "@/components/PageHeader";
import PageShell from "@/components/PageShell";
import { queryKeys } from "@/lib/queryKeys";
import type { Rarity } from "@/lib/fantasy-cards";
import { sortCards, type CardSort, type RarityFilter } from "@/lib/card-view";
import FantasyNav from "../../FantasyNav";
import FantasyCard from "../FantasyCard";
import CardControls from "../CardControls";

type CollectionCard = {
  id: string;
  cardId: string;
  rarity: Rarity;
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
  const [filter, setFilter] = useState<RarityFilter>("all");
  const [sort, setSort] = useState<CardSort>("rarity");

  const collection = useQuery({
    queryKey: queryKeys.cardLab.collection(),
    queryFn: getCollection,
  });

  const owned = collection.data ? groupByCard(collection.data) : [];
  const filtered = filter === "all" ? owned : owned.filter((c) => c.rarity === filter);
  const shown = sortCards(filtered, sort);

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
          <>
            <CardControls
              cards={owned}
              filter={filter}
              onFilter={setFilter}
              sort={sort}
              onSort={setSort}
            />
            <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {shown.map((card) => (
                <li key={card.cardId}>
                  <FantasyCard card={card} />
                </li>
              ))}
            </ul>
          </>
        )}
      </main>
    </PageShell>
  );
}
