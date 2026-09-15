"use client";

import { type ReactNode } from "react";
import { Modal as PaulModal } from "@paul-portfolio/react";

interface ModalProps {
  /** Whether the modal is open */
  open: boolean;
  /** Called when the modal should close */
  onClose: () => void;
  /** Optional accessible label (if no aria-labelledby) */
  "aria-label"?: string;
  /** ID of the element that labels the modal */
  "aria-labelledby"?: string;
  /** ID of the element that describes the modal */
  "aria-describedby"?: string;
  children: ReactNode;
  className?: string;
}

/**
 * App-level Modal backed by @paul-portfolio/react.
 *
 * This was a local implementation (framer-motion panel, hand-rolled focus trap,
 * scroll lock). The design-system Modal has the same public API — open/onClose,
 * the aria-* trio, className passthrough to the panel, and children rendered
 * directly when no title is given — plus its own focus trap, scroll lock, and
 * the dvh mobile-fit fix. So this now delegates, and every existing call site
 * keeps working unchanged.
 */
export default function Modal(props: ModalProps) {
  return <PaulModal {...props} />;
}
