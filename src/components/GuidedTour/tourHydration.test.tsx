import { describe, it, expect, vi, afterEach } from "vitest";
import { act } from "react";
import { renderToString } from "react-dom/server";
import { hydrateRoot } from "react-dom/client";
import FeatureTour from "./FeatureTour";

/**
 * A first-time visitor's tour opens by itself, but the server can't know it is
 * a first visit. The hook used to decide that in its initial state
 * (`typeof window !== "undefined" && !seen`), so the server rendered no
 * overlay and the browser's first render did, and every page with a tour
 * threw on hydration for new visitors:
 *
 *   Hydration failed because the server rendered HTML didn't match the client.
 *   + <div className="tour" role="presentation">
 */

const KEY = "hydration-test-tour-seen";
const STEPS = [{ title: "Take a quick tour?", body: "Consent card." }];

const tour = () => (
  <FeatureTour label="Test" storageKey={KEY} steps={STEPS} />
);

/** Renders the way the server does: no window, so no storage and no preference. */
function serverHtml(): string {
  const realWindow = globalThis.window;
  vi.stubGlobal("window", undefined);
  try {
    return renderToString(tour());
  } finally {
    vi.stubGlobal("window", realWindow);
  }
}

afterEach(() => {
  vi.unstubAllGlobals();
  window.localStorage.clear();
  document.body.innerHTML = "";
});

describe("guided tour across hydration", () => {
  it("hydrates a first-time visitor's page without a mismatch", async () => {
    const html = serverHtml();
    const container = document.createElement("div");
    container.innerHTML = html;
    document.body.appendChild(container);
    const onRecoverableError = vi.fn();

    await act(async () => {
      hydrateRoot(container, tour(), { onRecoverableError });
    });

    expect(onRecoverableError).not.toHaveBeenCalled();
  });

  it("still opens itself for a first-time visitor once hydrated", async () => {
    const html = serverHtml();
    const container = document.createElement("div");
    container.innerHTML = html;
    document.body.appendChild(container);

    await act(async () => {
      hydrateRoot(container, tour(), { onRecoverableError: () => {} });
    });

    expect(document.querySelector('[role="dialog"]')).not.toBeNull();
  });

  it("stays closed after hydration for a visitor who has seen it", async () => {
    const html = serverHtml();
    window.localStorage.setItem(KEY, "true");
    const container = document.createElement("div");
    container.innerHTML = html;
    document.body.appendChild(container);

    await act(async () => {
      hydrateRoot(container, tour(), { onRecoverableError: () => {} });
    });

    expect(document.querySelector('[role="dialog"]')).toBeNull();
  });
});
