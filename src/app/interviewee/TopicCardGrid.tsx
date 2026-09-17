"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";

/** One navigable card. `number` opts the card into digit quick-jump and a badge. */
export type TopicCard = {
  id: string;
  href: string;
  title: string;
  summary: string;
  /** 1-9: the key that jumps straight here, and the badge shown on the card. */
  number?: number;
  /** Optional control pinned to the card corner (e.g. a mark-answered button). */
  corner?: ReactNode;
};

/** True when focus is in a field, so the shortcuts don't fight what I'm typing. */
function isTyping(): boolean {
  const el = document.activeElement;
  if (!el) return false;
  const tag = el.tagName;
  return (
    tag === "INPUT" ||
    tag === "TEXTAREA" ||
    tag === "SELECT" ||
    (el as HTMLElement).isContentEditable
  );
}

/**
 * A keyboard-navigable grid of topic cards, shared by the deck and the
 * related-topics strip on a topic page.
 *
 * Two ways in, matching how I actually use it mid-interview: press a card's
 * number to jump straight to it from anywhere on the page, or tab onto a card
 * and walk the grid with the arrow keys (roving tabindex, so the grid is a
 * single tab stop). Enter opens the focused card — that's just the link.
 */
export default function TopicCardGrid({
  cards,
  ariaLabel,
}: {
  cards: TopicCard[];
  ariaLabel: string;
}) {
  const router = useRouter();
  const linkRefs = useRef<(HTMLAnchorElement | null)[]>([]);
  const [focusedIndex, setFocusedIndex] = useState(0);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.defaultPrevented) return;
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      if (isTyping()) return;

      if (/^[1-9]$/.test(event.key)) {
        const target = cards.find((card) => card.number === Number(event.key));
        if (target) {
          event.preventDefault();
          router.push(target.href);
        }
        return;
      }

      const current = linkRefs.current.findIndex(
        (ref) => ref === document.activeElement,
      );
      if (current === -1 || cards.length === 0) return;

      let next = current;
      if (event.key === "ArrowRight" || event.key === "ArrowDown") {
        next = (current + 1) % cards.length;
      } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
        next = (current - 1 + cards.length) % cards.length;
      } else {
        return;
      }
      event.preventDefault();
      setFocusedIndex(next);
      linkRefs.current[next]?.focus();
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [cards, router]);

  // The single tab stop, clamped so a shrinking list (marking one answered)
  // never strands the 0-tabindex on a card that no longer exists.
  const tabStop = Math.min(focusedIndex, Math.max(cards.length - 1, 0));

  return (
    <ul aria-label={ariaLabel} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {cards.map((card, index) => (
        <li key={card.id} className="relative">
          <Link
            ref={(el) => {
              linkRefs.current[index] = el;
            }}
            href={card.href}
            tabIndex={index === tabStop ? 0 : -1}
            onFocus={() => setFocusedIndex(index)}
            aria-keyshortcuts={card.number ? String(card.number) : undefined}
            className="glass-card flex h-full items-start gap-3 rounded-xl p-4 pr-14 transition-[border-color,box-shadow] hover:border-foreground/20 hover:shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500"
          >
            {card.number ? (
              <span
                aria-hidden="true"
                className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-surface-raised text-xs font-bold tabular-nums text-muted"
              >
                {card.number}
              </span>
            ) : null}
            <span className="min-w-0">
              <span className="block font-semibold text-foreground">
                {card.title}
              </span>
              <span className="mt-1 block text-sm text-muted">{card.summary}</span>
            </span>
          </Link>
          {card.corner ? (
            <div className="absolute right-2 top-2">{card.corner}</div>
          ) : null}
        </li>
      ))}
    </ul>
  );
}
