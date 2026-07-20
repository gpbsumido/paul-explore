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
  return (
    <IconButton
      aria-label={dir === "prev" ? "Previous feature" : "Next feature"}
      onClick={onClick}
      className="shrink-0 border border-border"
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
