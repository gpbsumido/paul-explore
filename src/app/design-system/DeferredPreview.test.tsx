import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import { DeferredPreview } from "./GalleryDemos";

/**
 * The gallery opens on every card at once, and the effect previews each run a
 * requestAnimationFrame or canvas loop. DeferredPreview is what keeps that from
 * turning page load into two dozen concurrent animation loops: the heavy child
 * stays unmounted behind a skeleton until its card scrolls near the viewport.
 * These tests are the guard that the deferral — the thing protecting the page's
 * INP and CPU — actually happens.
 */
describe("DeferredPreview", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("holds a skeleton until the card scrolls into view, then mounts the child", () => {
    let fire: ((entries: { isIntersecting: boolean }[]) => void) | null = null;
    const observe = vi.fn();
    const disconnect = vi.fn();
    vi.stubGlobal(
      "IntersectionObserver",
      class {
        constructor(cb: (entries: { isIntersecting: boolean }[]) => void) {
          fire = cb;
        }
        observe = observe;
        disconnect = disconnect;
        unobserve = vi.fn();
      },
    );

    render(
      <DeferredPreview>
        <p>Heavy preview</p>
      </DeferredPreview>,
    );

    // On first paint the heavy child is not in the DOM — only the skeleton.
    expect(screen.queryByText("Heavy preview")).not.toBeInTheDocument();
    expect(observe).toHaveBeenCalledTimes(1);

    // Once the card intersects, the child mounts and we stop observing.
    act(() => fire?.([{ isIntersecting: true }]));
    expect(screen.getByText("Heavy preview")).toBeInTheDocument();
    expect(disconnect).toHaveBeenCalled();
  });

  it("mounts immediately when the browser has no IntersectionObserver", () => {
    vi.stubGlobal("IntersectionObserver", undefined);
    render(
      <DeferredPreview>
        <p>No observer here</p>
      </DeferredPreview>,
    );
    expect(screen.getByText("No observer here")).toBeInTheDocument();
  });
});
