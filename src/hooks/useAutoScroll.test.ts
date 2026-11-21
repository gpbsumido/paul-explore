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
    removeEventListener: vi.fn((_type: string, handler: EventListener) => {
      if (scrollListener === handler) scrollListener = null;
    }),
  };

  return {
    el: el as unknown as HTMLDivElement,
    /** Move the viewport, the way the user scrolling would. */
    scrollTo(scrollTop: number) {
      el.scrollTop = scrollTop;
    },
    hasScrollListener() {
      return scrollListener !== null;
    },
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
function setupHook(
  geometry?: Parameters<typeof createMockElement>[0],
  threshold?: number,
) {
  const mock = createMockElement(geometry);
  const { result, rerender, unmount } = renderHook(() => useAutoScroll(threshold));

  // Hand the element to the callback ref, the way React does on commit, so the
  // effect attaches the scroll listener.
  act(() => {
    result.current.containerRef(mock.el);
  });

  return { result, mock, rerender, unmount };
}

describe("useAutoScroll", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("starts out at the bottom, before any scrolling", () => {
    const { result } = renderHook(() => useAutoScroll());

    expect(result.current.isAtBottom).toBe(true);
  });

  it("scrollToBottom does nothing, and doesn't throw, before a container is attached", () => {
    const { result } = renderHook(() => useAutoScroll());

    expect(() => act(() => result.current.scrollToBottom())).not.toThrow();
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

  it("goes false when the user scrolls up and true again when they come back down", () => {
    const { result, mock } = setupHook({ scrollTop: 600, scrollHeight: 1000, clientHeight: 400 });

    act(() => {
      mock.scrollTo(100);
      mock.fireScroll();
    });
    expect(result.current.isAtBottom).toBe(false);

    act(() => {
      mock.scrollTo(600);
      mock.fireScroll();
    });
    expect(result.current.isAtBottom).toBe(true);
  });

  it("counts exactly 100px from the bottom as at the bottom, and 101px as not", () => {
    // 1000 - 500 - 400 = 100 from the bottom
    const { result, mock } = setupHook({ scrollTop: 500, scrollHeight: 1000, clientHeight: 400 });

    act(() => {
      mock.fireScroll();
    });
    expect(result.current.isAtBottom).toBe(true);

    act(() => {
      mock.scrollTo(499);
      mock.fireScroll();
    });
    expect(result.current.isAtBottom).toBe(false);
  });

  it("uses the threshold it is given instead of 100px", () => {
    // 500px from the bottom, but the caller allows 600
    const { result, mock } = setupHook(
      { scrollTop: 100, scrollHeight: 1000, clientHeight: 400 },
      600,
    );

    act(() => {
      mock.fireScroll();
    });

    expect(result.current.isAtBottom).toBe(true);
  });

  it("applies a threshold that changes after the container is attached", () => {
    // 500px from the bottom
    const mock = createMockElement({ scrollTop: 100, scrollHeight: 1000, clientHeight: 400 });
    const { result, rerender } = renderHook(
      ({ threshold }) => useAutoScroll(threshold),
      { initialProps: { threshold: 100 } },
    );
    act(() => {
      result.current.containerRef(mock.el);
    });
    act(() => {
      mock.fireScroll();
    });
    expect(result.current.isAtBottom).toBe(false);

    rerender({ threshold: 600 });
    act(() => {
      mock.fireScroll();
    });

    expect(result.current.isAtBottom).toBe(true);
  });

  it("stops listening to the container when the component unmounts", () => {
    const { mock, unmount } = setupHook();
    expect(mock.hasScrollListener()).toBe(true);

    unmount();

    expect(mock.hasScrollListener()).toBe(false);
  });

  it("uses a passive scroll event listener", () => {
    const { mock } = setupHook();

    expect(mock.el.addEventListener).toHaveBeenCalledWith(
      "scroll",
      expect.any(Function),
      expect.objectContaining({ passive: true }),
    );
  });

  it("attaches the listener once, not again on every re-render", () => {
    const { mock, rerender } = setupHook();

    rerender();
    rerender();
    rerender();

    expect(mock.el.addEventListener).toHaveBeenCalledTimes(1);
  });
});
