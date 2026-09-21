"use client";

import IconButton from "@/components/ui/IconButton";

/** One arrow button beside the demo stage. Two of these flank it. */
export default function StageArrow({
  dir,
  onClick,
}: {
  dir: "prev" | "next";
  onClick: () => void;
}) {
  const path = dir === "prev" ? "M10 3L5 8l5 5" : "M6 3l5 5-5 5";
  // On a narrow screen the two arrows flanking the stage squeeze it thin and
  // crowd the edges. Below sm, lift them out of the row and float them over the
  // stage edges instead, so the demo itself gets the full width.
  const mobile =
    dir === "prev"
      ? "max-sm:absolute max-sm:left-1 max-sm:top-1/2 max-sm:z-10 max-sm:-translate-y-1/2 max-sm:bg-surface/85 max-sm:backdrop-blur-sm"
      : "max-sm:absolute max-sm:right-1 max-sm:top-1/2 max-sm:z-10 max-sm:-translate-y-1/2 max-sm:bg-surface/85 max-sm:backdrop-blur-sm";
  return (
    <IconButton
      aria-label={dir === "prev" ? "Previous feature" : "Next feature"}
      onClick={onClick}
      className={`shrink-0 border border-border ${mobile}`}
    >
      <svg aria-hidden width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path
          d={path}
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </IconButton>
  );
}
