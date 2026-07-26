"use client";

import {
  useEffect,
  useMemo,
  useReducer,
  useRef,
  type KeyboardEvent,
} from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, m, useReducedMotion } from "framer-motion";
import { rankCommands, groupRankedCommands } from "@/lib/command-palette/filter";
import { paletteReducer, initialPaletteState } from "@/lib/command-palette/state";
import type {
  Command,
  MatchRange,
  RankedCommand,
} from "@/lib/command-palette/types";

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
  /** Called with the chosen command. The parent runs navigation or the action. */
  onSelect: (command: Command) => void;
  commands: readonly Command[];
}

const LISTBOX_ID = "command-palette-listbox";
const optionId = (index: number) => `command-palette-option-${index}`;

/** Splits a title into plain and highlighted spans based on match ranges. */
function renderTitle(title: string, ranges: MatchRange[]) {
  if (ranges.length === 0) return title;

  const parts: React.ReactNode[] = [];
  let cursor = 0;
  ranges.forEach((range, i) => {
    if (range.start > cursor) {
      parts.push(<span key={`t${i}`}>{title.slice(cursor, range.start)}</span>);
    }
    parts.push(
      <mark
        key={`m${i}`}
        data-testid="cmdk-highlight"
        className="bg-transparent font-semibold text-primary-600 dark:text-primary-400"
      >
        {title.slice(range.start, range.end)}
      </mark>,
    );
    cursor = range.end;
  });
  if (cursor < title.length) {
    parts.push(<span key="tail">{title.slice(cursor)}</span>);
  }
  return parts;
}

/**
 * The ARIA combobox overlay. Pure logic (ranking, grouping, cursor state) lives
 * in @/lib/command-palette; this component is the keyboard-driven shell that
 * renders it. Keyboard activation lives on the input via aria-activedescendant,
 * so the option rows themselves only need a click handler for mouse users.
 */
export default function CommandPalette({
  open,
  onClose,
  onSelect,
  commands,
}: CommandPaletteProps) {
  const [state, dispatch] = useReducer(paletteReducer, initialPaletteState);
  const inputRef = useRef<HTMLInputElement>(null);
  const prefersReduced = useReducedMotion();

  const grouped = useMemo(
    () => groupRankedCommands(rankCommands(commands, state.query)),
    [commands, state.query],
  );

  // Flat list in display order so the cursor index maps to a single command.
  const flat: RankedCommand[] = useMemo(
    () => grouped.flatMap((g) => g.commands),
    [grouped],
  );

  const activeIndex = flat.length === 0 ? -1 : state.activeIndex % flat.length;
  const activeCommand = activeIndex >= 0 ? flat[activeIndex].command : null;

  // Reset the query and cursor each time the palette opens.
  useEffect(() => {
    if (open) dispatch({ type: "RESET" });
  }, [open]);

  // Focus the input and lock body scroll while open.
  useEffect(() => {
    if (!open) return;
    inputRef.current?.focus();

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [open]);

  // Keep the highlighted row scrolled into view as the cursor moves.
  useEffect(() => {
    if (activeIndex < 0) return;
    const el = document.getElementById(optionId(activeIndex));
    el?.scrollIntoView?.({ block: "nearest" });
  }, [activeIndex]);

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      dispatch({ type: "MOVE", delta: 1, count: flat.length });
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      dispatch({ type: "MOVE", delta: -1, count: flat.length });
    } else if (event.key === "Enter") {
      event.preventDefault();
      if (activeCommand) {
        onSelect(activeCommand);
        onClose();
      }
    } else if (event.key === "Escape") {
      event.preventDefault();
      onClose();
    }
  }

  if (typeof document === "undefined") return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <m.div
          data-testid="command-palette-backdrop"
          className="fixed inset-0 flex items-start justify-center px-4 pt-[12vh]"
          style={{
            zIndex: "var(--z-modal)",
            background: "var(--modal-backdrop)",
            backdropFilter: "blur(4px)",
            WebkitBackdropFilter: "blur(4px)",
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: prefersReduced ? 0 : 0.15 }}
          onClick={(e) => {
            if (e.target === e.currentTarget) onClose();
          }}
        >
          <m.div
            className="w-full max-w-xl overflow-hidden rounded-2xl shadow-xl"
            style={{
              background: "var(--modal-bg)",
              backdropFilter: "blur(24px)",
              WebkitBackdropFilter: "blur(24px)",
              border: "1px solid var(--modal-border)",
            }}
            initial={
              prefersReduced ? undefined : { opacity: 0, scale: 0.98, y: -8 }
            }
            animate={prefersReduced ? undefined : { opacity: 1, scale: 1, y: 0 }}
            exit={prefersReduced ? undefined : { opacity: 0, scale: 0.98, y: -8 }}
            transition={{ duration: 0.15 }}
          >
            <div className="flex items-center gap-2 border-b border-border px-4">
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden
                className="shrink-0 text-muted"
              >
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.3-4.3" />
              </svg>
              <input
                ref={inputRef}
                type="text"
                role="combobox"
                aria-label="Search pages, dev notes, and actions"
                aria-expanded={flat.length > 0}
                aria-controls={flat.length > 0 ? LISTBOX_ID : undefined}
                aria-activedescendant={
                  activeIndex >= 0 ? optionId(activeIndex) : undefined
                }
                autoComplete="off"
                spellCheck={false}
                placeholder="Search pages, dev notes, and actions..."
                value={state.query}
                onChange={(e) =>
                  dispatch({ type: "SET_QUERY", query: e.target.value })
                }
                onKeyDown={handleKeyDown}
                className="w-full bg-transparent py-3.5 text-[15px] text-foreground placeholder:text-muted focus:outline-none"
              />
            </div>

            {flat.length === 0 ? (
              <p className="px-3 py-8 text-center text-[13px] text-muted">
                No results for &ldquo;{state.query}&rdquo;
              </p>
            ) : (
              <div
                id={LISTBOX_ID}
                role="listbox"
                aria-label="Commands"
                className="max-h-[52vh] overflow-y-auto p-2"
              >
                {grouped.map((group) => (
                  <div key={group.group} role="group" aria-label={group.group}>
                    <p
                      aria-hidden
                      className="px-2 pb-1 pt-2 text-[10px] font-bold uppercase tracking-[0.12em] text-muted"
                    >
                      {group.group}
                    </p>
                    {group.commands.map((ranked) => {
                      const index = flat.indexOf(ranked);
                      const isActive = index === activeIndex;
                      return (
                        <div
                          key={ranked.command.id}
                          id={optionId(index)}
                          role="option"
                          aria-selected={isActive}
                          onClick={() => {
                            onSelect(ranked.command);
                            onClose();
                          }}
                          onMouseMove={() =>
                            dispatch({
                              type: "MOVE",
                              delta: index - activeIndex,
                              count: flat.length,
                            })
                          }
                          className={`flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 ${
                            isActive ? "bg-foreground/10" : ""
                          }`}
                        >
                          <span
                            aria-hidden
                            className="h-1.5 w-1.5 shrink-0 rounded-full"
                            style={{
                              backgroundColor:
                                ranked.command.color ??
                                "var(--color-muted, #888)",
                            }}
                          />
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-[14px] text-foreground">
                              {renderTitle(ranked.command.title, ranked.ranges)}
                            </span>
                            {ranked.command.subtitle && (
                              <span className="block truncate text-[12px] text-muted">
                                {ranked.command.subtitle}
                              </span>
                            )}
                          </span>
                          {ranked.command.external && (
                            <span className="shrink-0 text-[11px] text-muted">
                              ↗
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            )}
          </m.div>
        </m.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
