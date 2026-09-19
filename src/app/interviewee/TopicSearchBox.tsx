"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { Interview } from "@/lib/interviewee/types";
import { searchInterviewTopics } from "@/lib/interviewee/search";

const LISTBOX_ID = "interviewee-search-listbox";
const MAX_VISIBLE = 8;

/**
 * A search combobox over every interview and topic. Typing filters across all
 * the text — titles, summaries, questions, points, and the expandable detail —
 * and the dropdown lists the matching topics by title (ranked so title matches
 * come first), each labelled with its interview. Arrow keys move the active
 * option, Enter opens it, Escape closes; a hit links straight to its topic page.
 */
export default function TopicSearchBox({
  interviews,
}: {
  interviews: Interview[];
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);

  const hits = useMemo(
    () => searchInterviewTopics(interviews, query).slice(0, MAX_VISIBLE),
    [interviews, query],
  );
  const total = useMemo(
    () => searchInterviewTopics(interviews, query).length,
    [interviews, query],
  );

  const trimmed = query.trim();
  const showList = open && trimmed !== "" && hits.length > 0;
  const showEmpty = open && trimmed !== "" && hits.length === 0;

  const hrefOf = (index: number) =>
    `/interviewee/${hits[index].interviewId}/${hits[index].topic.id}`;

  const go = (index: number) => {
    if (hits[index]) router.push(hrefOf(index));
  };

  const onChange = (value: string) => {
    setQuery(value);
    setOpen(true);
    setActive(0);
  };

  const onKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setOpen(true);
      setActive((i) => Math.min(i + 1, hits.length - 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (event.key === "Enter") {
      if (showList) {
        event.preventDefault();
        go(active);
      }
    } else if (event.key === "Escape") {
      event.preventDefault();
      if (open) setOpen(false);
      else setQuery("");
    }
  };

  return (
    <div className="relative">
      <label htmlFor="interviewee-search" className="sr-only">
        Search topics
      </label>
      <input
        id="interviewee-search"
        type="text"
        role="combobox"
        aria-expanded={showList}
        aria-controls={showList ? LISTBOX_ID : undefined}
        aria-autocomplete="list"
        aria-activedescendant={showList ? `interviewee-option-${active}` : undefined}
        value={query}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={onKeyDown}
        onFocus={() => setOpen(true)}
        placeholder="Search topics — titles and everything inside…"
        autoComplete="off"
        className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-[15px] text-foreground placeholder:text-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500"
      />

      {showList ? (
        <ul
          id={LISTBOX_ID}
          role="listbox"
          aria-label="Matching topics"
          className="absolute z-20 mt-1 max-h-80 w-full overflow-auto rounded-xl border border-border bg-surface p-1 shadow-lg"
        >
          {hits.map((hit, index) => (
            // Keyboard selection lives on the input via aria-activedescendant
            // (the ARIA combobox pattern); the click is a mouse convenience, so
            // the option itself carries no key handler.
            // eslint-disable-next-line jsx-a11y/click-events-have-key-events
            <li
              key={`${hit.interviewId}/${hit.topic.id}`}
              id={`interviewee-option-${index}`}
              role="option"
              aria-selected={index === active}
              onMouseEnter={() => setActive(index)}
              // Keep focus in the input on click so blur doesn't close first.
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => go(index)}
              className={`cursor-pointer rounded-lg px-3 py-2 ${
                index === active ? "bg-surface-raised" : ""
              }`}
            >
              <span className="block font-semibold text-foreground">
                {hit.topic.title}
              </span>
              <span className="mt-0.5 block text-xs text-muted">
                {hit.interviewTitle} · {hit.topic.summary}
              </span>
            </li>
          ))}
          {total > hits.length ? (
            <li
              role="option"
              aria-disabled="true"
              aria-selected={false}
              className="px-3 py-2 text-xs text-muted"
            >
              …and {total - hits.length} more — keep typing to narrow.
            </li>
          ) : null}
        </ul>
      ) : null}

      {showEmpty ? (
        <p
          role="status"
          className="absolute z-20 mt-1 w-full rounded-xl border border-border bg-surface p-3 text-sm text-muted shadow-lg"
        >
          No topics match &ldquo;{trimmed}&rdquo;. Try a shorter or different word.
        </p>
      ) : null}
    </div>
  );
}
