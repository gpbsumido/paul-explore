import { describe, it, expect, vi, afterEach } from "vitest";
import { act } from "react";
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
 * Each side of the round trip gets a fresh module graph. framer-motion is an
 * external dependency, which resetModules doesn't reset, and it caches the
 * preference on first read, so the server pass mocks its hook instead of
 * calling it: the server simply cannot see the preference.
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
async function freshApp(side: "server" | "client") {
  vi.resetModules();
  if (side === "server") {
    vi.doMock("framer-motion", async (importOriginal) => ({
      ...(await importOriginal<typeof import("framer-motion")>()),
      useReducedMotion: () => null,
    }));
  } else {
    vi.doUnmock("framer-motion");
  }
  const { Providers, useHubReducedMotion } = await import("./providers");
  const { default: Template } = await import("./template");
  function Probe() {
    return <p data-testid="probe">{useHubReducedMotion() ? "reduced" : "full"}</p>;
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

afterEach(() => {
  vi.unstubAllGlobals();
  document.body.innerHTML = "";
});

describe("reduced motion across hydration", () => {
  it("hydrates a reduced-motion visitor's page without a mismatch", async () => {
    stubPreference(false);
    const ServerApp = await freshApp("server");
    const html = renderToString(<ServerApp />);

    stubPreference(true);
    const ClientApp = await freshApp("client");
    const container = document.createElement("div");
    container.innerHTML = html;
    document.body.appendChild(container);
    const onRecoverableError = vi.fn();

    await act(async () => {
      hydrateRoot(container, <ClientApp />, { onRecoverableError });
    });

    expect(onRecoverableError).not.toHaveBeenCalled();
  });

  it("still tells components about reduced motion once hydrated", async () => {
    stubPreference(false);
    const ServerApp = await freshApp("server");
    const html = renderToString(<ServerApp />);

    stubPreference(true);
    const ClientApp = await freshApp("client");
    const container = document.createElement("div");
    container.innerHTML = html;
    document.body.appendChild(container);

    await act(async () => {
      hydrateRoot(container, <ClientApp />, { onRecoverableError: () => {} });
    });

    expect(container.querySelector("[data-testid=probe]")?.textContent).toBe(
      "reduced",
    );
  });
});
