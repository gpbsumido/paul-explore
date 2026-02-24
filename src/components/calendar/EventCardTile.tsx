import type { EventCard } from "@/types/calendar";

/** Single card tile in the event detail card grid — image, name, set, qty badge, notes. */
export default function EventCardTile({ card }: { card: EventCard }) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="relative rounded-md overflow-hidden border border-border bg-surface">
        {card.cardImageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={`${card.cardImageUrl}/low.webp`}
            alt={card.cardName}
            className="w-full"
            loading="lazy"
          />
        ) : (
          <div className="w-full bg-surface-raised" style={{ aspectRatio: "2.5/3.5" }} />
        )}
        {card.quantity > 1 && (
          <span className="absolute bottom-1 right-1 rounded bg-black/60 px-1 py-0.5 text-[10px] font-semibold text-white tabular-nums">
            ×{card.quantity}
          </span>
        )}
      </div>
      <div>
        <p className="text-xs font-medium text-foreground leading-tight truncate">
          {card.cardName}
        </p>
        {card.cardSetName && (
          <p className="text-[10px] text-muted truncate">{card.cardSetName}</p>
        )}
        {card.notes && (
          <p className="text-[10px] text-muted/70 truncate italic">{card.notes}</p>
        )}
      </div>
    </div>
  );
}
