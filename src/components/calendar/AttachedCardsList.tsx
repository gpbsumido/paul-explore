"use client";

import { IconButton } from "@/components/ui";
import type { EventCard } from "@/types/calendar";

type Props = {
  cards: EventCard[];
  onQuantityChange: (entryId: string, quantity: number) => void;
  onNotesChange: (entryId: string, notes: string) => void;
  onRemove: (entryId: string) => void;
};

/**
 * Renders the list of cards attached to an event.
 * Edits (quantity/notes) are handled locally — the parent flushes them to the
 * API on save so everything goes out in a single batch.
 *
 * Shows an empty-state hint when the list is empty so the user knows the
 * search box above is what populates this section.
 */
export default function AttachedCardsList({
  cards,
  onQuantityChange,
  onNotesChange,
  onRemove,
}: Props) {
  if (cards.length === 0) {
    return (
      <p className="text-xs text-muted/50 text-center py-4 border border-dashed border-border rounded-lg">
        Search for a Pokémon card above to attach it to this event
      </p>
    );
  }

  return (
    <ul className="space-y-2">
      {cards.map((card) => (
        <li
          key={card.id}
          className="flex items-start gap-2.5 rounded-lg border border-border bg-surface p-2"
        >
          {/* thumbnail */}
          {card.cardImageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={`${card.cardImageUrl}/low.webp`}
              alt={card.cardName}
              className="h-12 w-auto rounded shrink-0"
              loading="lazy"
            />
          ) : (
            <div
              className="h-12 w-8 rounded bg-surface-raised shrink-0"
              aria-hidden="true"
            />
          )}

          {/* details */}
          <div className="flex-1 min-w-0 space-y-1.5">
            <p className="text-sm font-medium text-foreground leading-tight truncate">
              {card.cardName}
            </p>
            {card.cardSetName && (
              <p className="text-xs text-muted truncate">{card.cardSetName}</p>
            )}

            {/* +/- stepper + notes */}
            <div className="flex items-center gap-2 flex-wrap">
              <div className="inline-flex items-center rounded border border-border overflow-hidden">
                <button
                  type="button"
                  onClick={() =>
                    onQuantityChange(card.id, Math.max(1, card.quantity - 1))
                  }
                  className="h-5 w-5 flex items-center justify-center text-muted hover:bg-surface-raised hover:text-foreground transition-colors"
                  aria-label="Decrease quantity"
                >
                  <span className="text-sm leading-none select-none">−</span>
                </button>
                <span className="w-6 text-center text-xs text-foreground tabular-nums">
                  {card.quantity}
                </span>
                <button
                  type="button"
                  onClick={() => onQuantityChange(card.id, card.quantity + 1)}
                  className="h-5 w-5 flex items-center justify-center text-muted hover:bg-surface-raised hover:text-foreground transition-colors"
                  aria-label="Increase quantity"
                >
                  <span className="text-sm leading-none select-none">+</span>
                </button>
              </div>

              <input
                type="text"
                placeholder="Notes…"
                value={card.notes ?? ""}
                onChange={(e) => onNotesChange(card.id, e.target.value)}
                className="flex-1 min-w-0 rounded border border-border bg-background px-1.5 py-0.5 text-xs text-foreground placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-accent"
              />
            </div>
          </div>

          {/* remove */}
          <IconButton
            aria-label={`Remove ${card.cardName}`}
            size="sm"
            onClick={() => onRemove(card.id)}
            className="shrink-0 mt-0.5"
          >
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
              <path
                d="M1 1l8 8M9 1L1 9"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </IconButton>
        </li>
      ))}
    </ul>
  );
}
