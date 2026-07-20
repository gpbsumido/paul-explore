"use client";

import { type ComponentProps } from "react";
import { IconButton as PaulIconButton } from "@paul-portfolio/react";

type IconButtonProps = ComponentProps<typeof PaulIconButton>;

/**
 * App-level IconButton backed by @paul-portfolio/react. Kept as a thin wrapper
 * so every existing call site (import IconButton from "@/components/ui") keeps
 * working while the styling now comes from the design system's .icon-btn class
 * instead of hand-rolled Tailwind.
 */
export default function IconButton(props: IconButtonProps) {
  return <PaulIconButton {...props} />;
}
