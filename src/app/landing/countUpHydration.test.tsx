import { describe, it, expect, vi, afterEach } from "vitest";
import { act, type ComponentType } from "react";
import { renderToString } from "react-dom/server";
import { hydrateRoot } from "react-dom/client";
import { forgiveUnexpectedOutput } from "@/test/unexpectedOutput";

/**
 * The landing's stat count-ups rendered a plain span with "—" for a
 * reduced-motion visitor and an animated span with the spring's 0 otherwise.
 * The server can't see the preference, so a reduced-motion browser hydrated
 * a different element over the server's markup. Same lesson as the template
 * fix: pick the behaviour inside one element, never swap the element.
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

async function freshSection(
  path: "./VitalsSection" | "./NbaSection",
  side: "server" | "client",
): Promise<ComponentType> {
  vi.resetModules();
  if (side === "server") {
    vi.doMock("framer-motion", async (importOriginal) => ({
      ...(await importOriginal<typeof import("framer-motion")>()),
      useReducedMotion: () => null,
    }));
  } else {
    vi.doUnmock("framer-motion");
  }
  return (await import(path)).default;
}

afterEach(() => {
  vi.unstubAllGlobals();
  document.body.innerHTML = "";
});

describe.each(["./VitalsSection", "./NbaSection"] as const)(
  "%s count-ups",
  (path) => {
    it("hydrate for a reduced-motion visitor without a mismatch", async () => {
      stubPreference(false);
      const Server = await freshSection(path, "server");
      const html = renderToString(<Server />);

      stubPreference(true);
      const Client = await freshSection(path, "client");
      const container = document.createElement("div");
      container.innerHTML = html;
      document.body.appendChild(container);
      const onRecoverableError = vi.fn();

      await act(async () => {
        hydrateRoot(container, <Client />, { onRecoverableError });
      });

      expect(onRecoverableError).not.toHaveBeenCalled();
      // The animation library tells a developer when it sees reduced motion
      // switched on, which is the state this test sets up on purpose. Nothing
      // else may be logged.
      const otherOutput = forgiveUnexpectedOutput().filter(
        (line) => !line.includes("You have Reduced Motion enabled on your device"),
      );
      expect(otherOutput).toEqual([]);
    });
  },
);
