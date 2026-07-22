"use client";

import { m } from "framer-motion";
import { staggerContainer, fadeInUp } from "@/lib/animations";
import { StreamingMarkdown } from "./StreamingMarkdown";
import { ToolCallCard } from "./ToolCallCard";
import { ApprovalGate } from "./ApprovalGate";
import type { AgentStep } from "@/lib/agent/types";

type AgentTimelineProps = {
  readonly steps: readonly AgentStep[];
  readonly onApprove?: () => void;
  readonly onDeny?: () => void;
};

function StepRenderer({
  step,
  onApprove,
  onDeny,
}: {
  step: AgentStep;
  onApprove?: () => void;
  onDeny?: () => void;
}) {
  switch (step.kind) {
    case "thinking":
      return (
        <div className="flex items-start gap-2 text-foreground-secondary italic text-sm">
          <span className="inline-block w-2 h-2 mt-1.5 rounded-full bg-current animate-pulse" />
          <span>{step.text}</span>
        </div>
      );
    case "text":
      return (
        <StreamingMarkdown
          content={step.content}
          isStreaming={step.isStreaming}
        />
      );
    case "tool_call":
      return <ToolCallCard step={step} />;
    case "approval_request":
      return (
        <ApprovalGate
          action={step.action}
          description={step.description}
          status={step.status}
          onApprove={onApprove ?? (() => {})}
          onDeny={onDeny ?? (() => {})}
        />
      );
    case "error":
      return (
        <div
          data-error-banner=""
          className="bg-red-500/5 border border-red-500/20 rounded-lg p-3 text-red-500 text-sm"
        >
          {step.message}
        </div>
      );
  }
}

/**
 * Vertical timeline rendering a sequence of agent steps.
 * Each step type maps to its corresponding component with
 * staggered entrance animations.
 */
export function AgentTimeline({
  steps,
  onApprove,
  onDeny,
}: AgentTimelineProps) {
  return (
    <m.div
      variants={staggerContainer()}
      initial="hidden"
      animate="visible"
      className="space-y-3"
    >
      {steps.map((step, i) => (
        <m.div key={i} variants={fadeInUp} data-step="">
          <StepRenderer step={step} onApprove={onApprove} onDeny={onDeny} />
        </m.div>
      ))}
    </m.div>
  );
}
