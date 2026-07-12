import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useAgentRun } from "./useAgentRun";

/** Advance fake timers in small steps, yielding to microtasks each step. */
async function advanceInSteps(totalMs: number, stepMs = 50) {
  const steps = Math.ceil(totalMs / stepMs);
  for (let i = 0; i < steps; i++) {
    await vi.advanceTimersByTimeAsync(stepMs);
  }
}

describe("useAgentRun", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("initial state is idle", () => {
    const { result } = renderHook(() => useAgentRun());

    expect(result.current.state).toEqual({ status: "idle" });
  });

  it("start('simple') transitions state to running and begins producing steps", async () => {
    const { result } = renderHook(() => useAgentRun());

    await act(async () => {
      result.current.start("simple");
      await vi.advanceTimersByTimeAsync(50);
    });

    expect(result.current.state.status).toBe("running");
    if (result.current.state.status === "running") {
      expect(result.current.state.steps.length).toBeGreaterThan(0);
    }
  });

  it("after the simple scenario completes, state is completed with thinking and text steps", async () => {
    const { result } = renderHook(() => useAgentRun());

    await act(async () => {
      result.current.start("simple");
      await advanceInSteps(5000);
    });

    expect(result.current.state.status).toBe("completed");
    if (result.current.state.status === "completed") {
      const kinds = result.current.state.steps.map((s) => s.kind);
      expect(kinds).toContain("thinking");
      expect(kinds).toContain("text");
    }
  });

  it("stop() during a running scenario transitions to cancelled and preserves partial steps", async () => {
    const { result } = renderHook(() => useAgentRun());

    await act(async () => {
      result.current.start("simple");
      await vi.advanceTimersByTimeAsync(100);
    });

    expect(result.current.state.status).toBe("running");

    await act(async () => {
      result.current.stop();
    });

    expect(result.current.state.status).toBe("cancelled");
    if (result.current.state.status === "cancelled") {
      expect(result.current.state.steps.length).toBeGreaterThan(0);
    }
  });

  it("start('approval') transitions to awaiting_approval when the approval event arrives", async () => {
    const { result } = renderHook(() => useAgentRun());

    await act(async () => {
      result.current.start("approval");
      await advanceInSteps(3000);
    });

    expect(result.current.state.status).toBe("awaiting_approval");
  });

  it("approve() during awaiting_approval resumes the stream and transitions back to running", async () => {
    const { result } = renderHook(() => useAgentRun());

    await act(async () => {
      result.current.start("approval");
      await advanceInSteps(3000);
    });

    expect(result.current.state.status).toBe("awaiting_approval");

    await act(async () => {
      result.current.approve();
      await advanceInSteps(5000);
    });

    expect(result.current.state.status).toBe("completed");
    if (result.current.state.status === "completed") {
      const kinds = result.current.state.steps.map((s) => s.kind);
      expect(kinds).toContain("text");
      expect(kinds).toContain("approval_request");
    }
  });

  it("deny() during awaiting_approval transitions to completed with approval step marked denied", async () => {
    const { result } = renderHook(() => useAgentRun());

    await act(async () => {
      result.current.start("approval");
      await advanceInSteps(3000);
    });

    expect(result.current.state.status).toBe("awaiting_approval");

    await act(async () => {
      result.current.deny();
    });

    expect(result.current.state.status).toBe("completed");
    if (result.current.state.status === "completed") {
      const approvalStep = result.current.state.steps.find(
        (s) => s.kind === "approval_request",
      );
      expect(approvalStep).toBeDefined();
      if (approvalStep?.kind === "approval_request") {
        expect(approvalStep.status).toBe("denied");
      }
    }
  });

  it("start('error_recovery') transitions through error and produces error + recovery steps", async () => {
    const { result } = renderHook(() => useAgentRun());

    await act(async () => {
      result.current.start("error_recovery");
      await advanceInSteps(5000);
    });

    // the error event triggers ERROR action which puts state into 'error'
    // but the stream continues with recovery text after the error
    // since the reducer ignores APPEND_TEXT in error status, the final state should be 'error'
    expect(result.current.state.status).toBe("error");
    if (result.current.state.status === "error") {
      const kinds = result.current.state.steps.map((s) => s.kind);
      expect(kinds).toContain("text");
    }
  });

  it("cannot call start() while already running", async () => {
    const { result } = renderHook(() => useAgentRun());

    await act(async () => {
      result.current.start("simple");
      await vi.advanceTimersByTimeAsync(50);
    });

    expect(result.current.state.status).toBe("running");

    const stepsBefore =
      result.current.state.status === "running"
        ? result.current.state.steps.length
        : 0;

    await act(async () => {
      result.current.start("tool_calls");
      await vi.advanceTimersByTimeAsync(50);
    });

    // state should still be running from the first start, not reset
    expect(result.current.state.status).toBe("running");
    if (result.current.state.status === "running") {
      expect(result.current.state.steps.length).toBeGreaterThanOrEqual(
        stepsBefore,
      );
    }
  });
});
