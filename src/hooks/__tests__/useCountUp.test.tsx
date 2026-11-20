import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { act } from "react";
import { renderToString } from "react-dom/server";
import { hydrateRoot } from "react-dom/client";
import { renderHook, waitFor } from "@testing-library/react";

const stubPreference = (reduce: boolean) =>
  vi.stubGlobal(
    "matchMedia",
    vi.fn().mockImplementation((query: string) => ({
      matches: reduce && query.includes("reduce"),
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  );

/** A fresh copy of the hook, the way the server and the browser each load it. */
async function freshHook() {
  vi.resetModules();
  return (await import("../useCountUp")).useCountUp;
}

beforeEach(() => {
  vi.stubGlobal("requestAnimationFrame", (tick: FrameRequestCallback) =>
    setTimeout(() => tick(performance.now()), 16),
  );
  vi.stubGlobal("cancelAnimationFrame", (id: number) => clearTimeout(id));
});

afterEach(() => {
  vi.unstubAllGlobals();
  document.body.innerHTML = "";
});

describe("useCountUp", () => {
  it("counts up to a new target after the first one has landed", async () => {
    // A refetch or a filter change hands the hook a new number. It used to
    // return early once it had animated, and stayed on the old one.
    stubPreference(false);
    const useCountUp = await freshHook();
    const { result, rerender } = renderHook(
      ({ target }) => useCountUp(target, 50),
      { initialProps: { target: 10 } },
    );
    await waitFor(() => expect(result.current).toBe(10));

    rerender({ target: 20 });

    await waitFor(() => expect(result.current).toBe(20));
  });

  it("goes straight to the target for a reduced-motion visitor", async () => {
    stubPreference(true);
    const useCountUp = await freshHook();
    const { result, rerender } = renderHook(
      ({ target }) => useCountUp(target, 50),
      { initialProps: { target: 10 } },
    );
    expect(result.current).toBe(10);

    rerender({ target: 20 });
    expect(result.current).toBe(20);
  });

  it("hydrates a reduced-motion visitor's count without a mismatch", async () => {
    // The server can't see the preference, so it renders 0. The hook read it
    // at module load and started the browser on the target instead.
    stubPreference(false);
    const serverHook = await freshHook();
    function ServerCount() {
      return <span>{serverHook(42, 50)}</span>;
    }
    const html = renderToString(<ServerCount />);

    stubPreference(true);
    const clientHook = await freshHook();
    function ClientCount() {
      return <span>{clientHook(42, 50)}</span>;
    }
    const container = document.createElement("div");
    container.innerHTML = html;
    document.body.appendChild(container);
    const onRecoverableError = vi.fn();

    await act(async () => {
      hydrateRoot(container, <ClientCount />, { onRecoverableError });
    });

    expect(onRecoverableError).not.toHaveBeenCalled();
    expect(container.textContent).toBe("42");
  });
});
