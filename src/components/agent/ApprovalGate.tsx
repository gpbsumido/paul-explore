"use client";

import { useId } from "react";
import { motion } from "framer-motion";
import { scaleIn } from "@/lib/animations";
import Button from "@/components/ui/Button";

type ApprovalGateProps = {
  readonly action: string;
  readonly description: string;
  readonly status: "pending" | "approved" | "denied";
  readonly onApprove: () => void;
  readonly onDeny: () => void;
};

/**
 * Human-in-the-loop approval gate. Displays the action and description
 * with Approve/Deny buttons when pending, or a status label when resolved.
 */
export function ApprovalGate({
  action,
  description,
  status,
  onApprove,
  onDeny,
}: ApprovalGateProps) {
  const id = useId();
  const titleId = `${id}-title`;
  const descId = `${id}-desc`;

  return (
    <motion.div
      role="alertdialog"
      aria-labelledby={titleId}
      aria-describedby={descId}
      variants={scaleIn}
      initial="hidden"
      animate="visible"
      className="border-l-4 border-warning-500 bg-warning-500/5 rounded-r-lg p-4 space-y-3"
    >
      <h3 id={titleId} className="font-semibold text-foreground">
        {action}
      </h3>
      <p id={descId} className="text-sm text-foreground-secondary">
        {description}
      </p>

      {status === "pending" ? (
        <div className="flex gap-2">
          <Button variant="primary" size="sm" onClick={onApprove}>
            Approve
          </Button>
          <Button variant="outline" size="sm" onClick={onDeny}>
            Deny
          </Button>
        </div>
      ) : (
        <p className="text-sm font-medium">
          {status === "approved" ? "Approved" : "Denied"}
        </p>
      )}
    </motion.div>
  );
}
