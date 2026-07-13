"use client";

import Button from "@/components/ui/Button";

type StopButtonProps = {
  readonly onStop: () => void;
  readonly disabled?: boolean;
};

/**
 * Cancel/stop button for an in-progress agent run.
 */
export function StopButton({ onStop, disabled }: StopButtonProps) {
  return (
    <Button
      variant="danger"
      size="sm"
      onClick={onStop}
      disabled={disabled}
      aria-label="Stop generation"
    >
      <span className="w-3 h-3 bg-current rounded-sm" aria-hidden="true" />
      Stop
    </Button>
  );
}
