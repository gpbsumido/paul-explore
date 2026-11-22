import { describe, it, expect, vi, afterEach } from "vitest";
import { act, useEffect } from "react";
import { renderToString } from "react-dom/server";
import { hydrateRoot } from "react-dom/client";

/**
 * A server can't know a visitor prefers reduced motion; the browser can, from
 * its very first render. When the app's reduced-motion flag read the browser
 * during hydration, a reduced-motion visitor's first client render disagreed
 * with the server HTML, and template.tsx (which drops its fade wrapper under
 * reduced motion) turned that into a hydration error on every route:
 *
 *   Hydration failed because the server rendered HTML didn't match the client.
 *   … <Template> … + <Suspense> - <div style={{opacity:"1"}}>
 *
 * Each side of the round trip gets a fresh module graph. renderToString reads
 * the hook's server snapshot, so the server pass cannot see the preference,
 * the same as a real server.
 */

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

/** Imports the providers and template as a fresh app, the way each side would. */
async function freshApp() {
  vi.resetModules();
  const { Providers } = await import("./providers");
  const { usePrefersReducedMotion } = await import("@/hooks/usePrefersReducedMotion");
  const { default: Template } = await import("./template");
  function Probe() {
    return <p data-testid="probe">{usePrefersReducedMotion() ? "reduced" : "full"}</p>;
  }
  return function App() {
    return (
      <Providers>
        <Template>
          <Probe />
        </Template>
      </Providers>
    );
  };
}

/**
 * LazyMotion starts loading its features in an effect, which flushes when the
 * hydrating act() ends, and the update that follows lands after it. Left alone,
 * that update is outside act on some test orderings. A second act waits for the
 * import it started.
 */
const settleLazyFeatures = () =>
  act(async () => {
    await vi.dynamicImportSettled();
  });

afterEach(() => {
  vi.unstubAllGlobals();
  document.body.innerHTML = "";
});

describe("reduced motion across hydration", () => {
  it("hydrates a reduced-motion visitor's page without a mismatch", async () => {
    stubPreference(false);
    const ServerApp = await freshApp();
    const html = renderToString(<ServerApp />);

    stubPreference(true);
    const ClientApp = await freshApp();
    const container = document.createElement("div");
    container.innerHTML = html;
    document.body.appendChild(container);
    const onRecoverableError = vi.fn();

    await act(async () => {
      hydrateRoot(container, <ClientApp />, { onRecoverableError });
    });
    await settleLazyFeatures();

    expect(onRecoverableError).not.toHaveBeenCalled();
  });

  it("still tells components about reduced motion once hydrated", async () => {
    stubPreference(false);
    const ServerApp = await freshApp();
    const html = renderToString(<ServerApp />);

    stubPreference(true);
    const ClientApp = await freshApp();
    const container = document.createElement("div");
    container.innerHTML = html;
    document.body.appendChild(container);

    await act(async () => {
      hydrateRoot(container, <ClientApp />, { onRecoverableError: () => {} });
    });
    await settleLazyFeatures();

    expect(container.querySelector("[data-testid=probe]")?.textContent).toBe(
      "reduced",
    );
  });
});

describe("the page under the template", () => {
  /**
   * The flag above can only flip to "reduced" after hydration. template.tsx
   * used to render a fragment for reduced motion and an m.div otherwise, so
   * that flip swapped the element above every page and React threw the whole
   * page away and mounted it again: effects ran twice, fetches fired twice,
   * and any state set in between was lost.
   */
  it("mounts once for a reduced-motion visitor", async () => {
    const mounts = { count: 0 };

    stubPreference(false);
    vi.resetModules();
    const server = await import("./template");
    const serverProviders = await import("./providers");
    function Page() {
      useEffect(() => {
        mounts.count += 1;
      }, []);
      return <p>page</p>;
    }
    const html = renderToString(
      <serverProviders.Providers>
        <server.default>
          <Page />
        </server.default>
      </serverProviders.Providers>,
    );

    stubPreference(true);
    vi.resetModules();
    const client = await import("./template");
    const clientProviders = await import("./providers");
    const container = document.createElement("div");
    container.innerHTML = html;
    document.body.appendChild(container);

    await act(async () => {
      hydrateRoot(
        container,
        <clientProviders.Providers>
          <client.default>
            <Page />
          </client.default>
        </clientProviders.Providers>,
        { onRecoverableError: () => {} },
      );
    });
    await settleLazyFeatures();

    expect(mounts.count).toBe(1);
  });
});
