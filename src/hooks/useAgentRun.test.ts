import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { createMockStream } from "@/lib/agent/mock-stream";
import { useAgentRun } from "./useAgentRun";

// The real scripts, unless a test hands the hook a stream of its own.
vi.mock("@/lib/agent/mock-stream", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/agent/mock-stream")>();
  return { ...actual, createMockStream: vi.fn(actual.createMockStream) };
});

/** A stream that delivers the given SSE frames at once, then closes. */
function streamOf(...frames: string[]) {
  return {
    stream: new ReadableStream<string>({
      start(controller) {
        frames.forEach((frame) => controller.enqueue(frame));
        controller.close();
      },
    }),
    resume: () => {},
  };
}

const frame = (event: string, data: unknown) =>
  `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;

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

  it("start('error_recovery') ends in error, keeping the text streamed before the failure", async () => {
    const { result } = renderHook(() => useAgentRun());

    await act(async () => {
      result.current.start("error_recovery");
      await advanceInSteps(5000);
    });

    // The recovery text that follows the error is ignored: the reducer only
    // takes text while running, so the run stays in the error state.
    expect(result.current.state.status).toBe("error");
    if (result.current.state.status === "error") {
      expect(result.current.state.steps).toMatchObject([
        { kind: "text", content: "Starting the analysis now..." },
      ]);
    }
  });

  it("ignores start() while a run is in progress instead of mixing in a second stream", async () => {
    const { result } = renderHook(() => useAgentRun());

    await act(async () => {
      result.current.start("simple");
      await vi.advanceTimersByTimeAsync(50);
    });
    expect(result.current.state.status).toBe("running");

    await act(async () => {
      result.current.start("tool_calls");
      await advanceInSteps(5000);
    });

    expect(result.current.state.status).toBe("completed");
    if (result.current.state.status === "completed") {
      const kinds = result.current.state.steps.map((s) => s.kind);
      expect(kinds).not.toContain("tool_call");
      const answer = result.current.state.steps.flatMap((s) =>
        s.kind === "text" ? [s.content] : [],
      );
      expect(answer.join("")).toBe("Based on my analysis, the answer is **42**.");
    }
  });

  it("start('tool_calls') records the tool call and its result", async () => {
    const { result } = renderHook(() => useAgentRun());

    await act(async () => {
      result.current.start("tool_calls");
      await advanceInSteps(5000);
    });

    expect(result.current.state.status).toBe("completed");
    if (result.current.state.status === "completed") {
      expect(result.current.state.steps).toContainEqual({
        kind: "tool_call",
        id: "call_abc123",
        name: "search_db",
        input: { query: "Q4 revenue" },
        status: "done",
        result: "Q4 revenue: $4.2M, up 12% YoY",
      });
    }
  });

  it("marks a tool call as failed when its result is flagged as an error", async () => {
    vi.mocked(createMockStream).mockReturnValueOnce(
      streamOf(
        frame("tool_use_start", { id: "t1", name: "fetch_page", input: {} }),
        frame("tool_result", { id: "t1", output: "404 not found", is_error: true }),
        frame("done", {}),
      ),
    );
    const { result } = renderHook(() => useAgentRun());

    await act(async () => {
      result.current.start("tool_calls");
      await advanceInSteps(100);
    });

    expect(result.current.state.status).toBe("completed");
    if (result.current.state.status === "completed") {
      expect(result.current.state.steps).toContainEqual({
        kind: "tool_call",
        id: "t1",
        name: "fetch_page",
        input: {},
        status: "error",
        error: "404 not found",
      });
    }
  });

  it("start('error_recovery') shows the error message the stream sent", async () => {
    const { result } = renderHook(() => useAgentRun());

    await act(async () => {
      result.current.start("error_recovery");
      await advanceInSteps(5000);
    });

    expect(result.current.state).toMatchObject({
      status: "error",
      error: "Stream interrupted: connection reset",
    });
  });

  it("stop() cuts the old stream off so a later run doesn't pick up its events", async () => {
    const { result } = renderHook(() => useAgentRun());

    await act(async () => {
      result.current.start("simple");
      await vi.advanceTimersByTimeAsync(100);
    });
    await act(async () => {
      result.current.stop();
    });
    await act(async () => {
      result.current.start("tool_calls");
      await advanceInSteps(5000);
    });

    expect(result.current.state.status).toBe("completed");
    if (result.current.state.status === "completed") {
      const text = result.current.state.steps
        .flatMap((s) => (s.kind === "text" ? [s.content] : []))
        .join("");
      expect(text).toBe("Let me search the database.The Q4 revenue was **$4.2M**, up 12% year-over-year.");
    }
  });

  it("reset() returns to idle and cuts the old stream off", async () => {
    const { result } = renderHook(() => useAgentRun());

    await act(async () => {
      result.current.start("simple");
      await vi.advanceTimersByTimeAsync(100);
    });
    await act(async () => {
      result.current.reset();
    });
    expect(result.current.state).toEqual({ status: "idle" });

    await act(async () => {
      result.current.start("tool_calls");
      await advanceInSteps(5000);
    });

    expect(result.current.state.status).toBe("completed");
    if (result.current.state.status === "completed") {
      const text = result.current.state.steps
        .flatMap((s) => (s.kind === "text" ? [s.content] : []))
        .join("");
      expect(text).not.toContain("Based on");
    }
  });
});
