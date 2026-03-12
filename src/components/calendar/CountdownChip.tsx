"use client";

import { memo } from "react";
import type { MouseEvent } from "react";
import type { Countdown } from "@/types/calendar";
import { Tooltip } from "@/components/ui";

interface CountdownChipProps {
  countdown: Countdown;
  onClick: () => void;
}

/**
 * Visually identical to EventChip's default (non-block) variant — same left
 * border stripe, translucent fill, text size, and padding — so events and
 * countdowns look consistent in the month/day/week grids. A small red dot on
 * the far right is the only visual differentiator.
 */
function CountdownChip({ countdown, onClick }: CountdownChipProps) {
  return (
    <Tooltip content={countdown.title} delay={500}>
      <button
        type="button"
        onClick={(e: MouseEvent<HTMLButtonElement>) => {
          e.stopPropagation();
          onClick();
        }}
        className="w-full flex items-center text-left text-xs font-medium px-2 py-0.5 text-foreground border-l-[3px] rounded-r-sm rounded-l-none mb-0.5 hover:opacity-75 transition-opacity overflow-hidden"
        style={{
          borderLeftColor: countdown.color,
          backgroundColor: `${countdown.color}18`,
        }}
      >
        <span className="flex-1 truncate">{countdown.title}</span>
        <span className="ml-1 h-1.5 w-1.5 rounded-full bg-red-500 shrink-0" />
      </button>
    </Tooltip>
  );
}

export default memo(CountdownChip);
