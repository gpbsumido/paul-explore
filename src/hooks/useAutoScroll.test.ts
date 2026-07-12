import { describe, it, expect, vi, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useAutoScroll } from "./useAutoScroll";

/** Create a minimal mock element with controllable scroll geometry. */
function createMockElement(
  geometry: {
    scrollTop?: number;
    scrollHeight?: number;
    clientHeight?: number;
  } = {},
) {
  let scrollListener: EventListener | null = null;
  let listenerOptions: AddEventListenerOptions | undefined;

  const el = {
    scrollTop: geometry.scrollTop ?? 0,
    scrollHeight: geometry.scrollHeight ?? 1000,
    clientHeight: geometry.clientHeight ?? 400,
    scrollTo: vi.fn(),
    addEventListener: vi.fn(
      (
        _type: string,
        handler: EventListener,
        options?: AddEventListenerOptions,
      ) => {
        scrollListener = handler;
        listenerOptions = options;
      },
    ),
    removeEventListener: vi.fn(),
  };

  return {
    el: el as unknown as HTMLDivElement,
    fireScroll() {
      scrollListener?.(new Event("scroll"));
    },
    getListenerOptions() {
      return listenerOptions;
    },
  };
}

/**
 * Render the hook and attach a mock element to the containerRef.
 * The ref assignment + re-render triggers the useEffect that attaches
 * the scroll listener.
 */
function setupHook(geometry?: Parameters<typeof createMockElement>[0]) {
  const mock = createMockElement(geometry);
  const { result, rerender } = renderHook(() => useAutoScroll());

  // assign the mock element to the ref and re-render so the effect fires
  (result.current.containerRef as { current: HTMLDivElement | null }).current =
    mock.el;
  rerender();

  return { result, mock, rerender };
}

describe("useAutoScroll", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns containerRef and isAtBottom (initially true)", () => {
    const { result } = renderHook(() => useAutoScroll());

    expect(result.current.containerRef).toBeDefined();
    expect(result.current.isAtBottom).toBe(true);
    expect(typeof result.current.scrollToBottom).toBe("function");
  });

  it("scrollToBottom calls scrollTo on the container element", () => {
    const { result, mock } = setupHook({ scrollHeight: 2000 });

    act(() => {
      result.current.scrollToBottom();
    });

    expect(mock.el.scrollTo).toHaveBeenCalledWith({
      top: 2000,
      behavior: "smooth",
    });
  });

  it("isAtBottom is true when scroll position is within 100px of the bottom", () => {
    // scrollTop(510) + clientHeight(400) = 910, bottom distance = 1000 - 910 = 90 < 100
    const { result, mock } = setupHook({
      scrollTop: 510,
      scrollHeight: 1000,
      clientHeight: 400,
    });

    act(() => {
      mock.fireScroll();
    });

    expect(result.current.isAtBottom).toBe(true);
  });

  it("isAtBottom is false when user has scrolled up beyond the threshold", () => {
    // scrollTop(100) + clientHeight(400) = 500, bottom distance = 1000 - 500 = 500 > 100
    const { result, mock } = setupHook({
      scrollTop: 100,
      scrollHeight: 1000,
      clientHeight: 400,
    });

    act(() => {
      mock.fireScroll();
    });

    expect(result.current.isAtBottom).toBe(false);
  });

  it("uses a passive scroll event listener", () => {
    const { mock } = setupHook();

    expect(mock.el.addEventListener).toHaveBeenCalledWith(
      "scroll",
      expect.any(Function),
      expect.objectContaining({ passive: true }),
    );
  });
});
