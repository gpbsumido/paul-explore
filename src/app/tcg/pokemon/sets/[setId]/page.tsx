import TCGdex from "@tcgdex/sdk";
import Link from "next/link";
import { notFound } from "next/navigation";
import ThemeToggle from "@/components/ThemeToggle";
import SetCardsGrid from "./SetCardsGrid";

const tcgdex = new TCGdex("en");

export default async function SetDetailPage({
  params,
}: {
  params: Promise<{ setId: string }>;
}) {
  const { setId } = await params;
  const set = await tcgdex.set.get(setId);
  if (!set) notFound();

  const releaseYear = set.releaseDate?.split("-")[0];

  return (
    <div className="flex flex-col min-h-dvh max-w-[480px] mx-auto font-sans bg-background">
      {/* Top bar */}
      <div className="sticky top-0 z-20 flex items-center justify-center px-4 py-3 bg-background border-b border-border backdrop-blur-xl">
        <Link
          href="/tcg/pokemon/sets"
          className="absolute left-4 text-[#007aff] text-sm flex items-center gap-0.5"
        >
          <svg width="10" height="16" viewBox="0 0 10 16" fill="none">
            <path
              d="M9 1L2 8l7 7"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          &nbsp;Back
        </Link>
        <div className="flex flex-col items-center gap-0.5">
          <span className="text-base font-semibold text-foreground truncate max-w-[180px]">
            {set.name}
          </span>
          <span className="text-[11px] text-muted">{set.serie.name}</span>
        </div>
        <div className="absolute right-4">
          <ThemeToggle />
        </div>
      </div>

      {/* Set header */}
      <div className="px-4 py-5 border-b border-border flex flex-col items-center gap-3">
        {set.logo && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={`${set.logo}.webp`}
            alt={set.name}
            className="h-14 object-contain"
          />
        )}
        <div className="flex items-center gap-4 text-[12px] text-muted">
          {releaseYear && <span>{releaseYear}</span>}
          <span>{set.cardCount.official} cards</span>
          {set.symbol && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={`${set.symbol}.webp`}
              alt="set symbol"
              className="h-4 object-contain"
            />
          )}
        </div>
        <div className="flex gap-3 text-[11px]">
          <LegalBadge label="Standard" legal={set.legal.standard} />
          <LegalBadge label="Expanded" legal={set.legal.expanded} />
        </div>
      </div>

      {/* Card grid — paginated client component */}
      <SetCardsGrid setId={setId} />
    </div>
  );
}

function LegalBadge({ label, legal }: { label: string; legal: boolean }) {
  return (
    <span
      className={`px-2.5 py-0.5 rounded-full text-[11px] font-medium border ${
        legal
          ? "bg-green-500/15 text-green-400 border-green-500/20"
          : "bg-surface text-muted border-border"
      }`}
    >
      {label}: {legal ? "✓" : "✗"}
    </span>
  );
}
