import { describe, it, expect, vi } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useMutation } from "@tanstack/react-query";
import { Providers } from "./providers";
import { notifyMutationError } from "@/lib/mutationErrorToast";

vi.mock("@/lib/mutationErrorToast", () => ({ notifyMutationError: vi.fn() }));

/**
 * The design-system Toaster portals to document.body on its first client render.
 * Imported statically it renders during SSR/hydration, so the server tree (no
 * portal yet) and the first client tree (portal) disagree -- a hydration error
 * that showed up on the old homepage too. It has to load client-only so the
 * portal is created after hydration rather than during it. This pins that so a
 * future edit can't quietly turn it back into a static import.
 */
describe("app providers", () => {
  const source = readFileSync(
    join(process.cwd(), "src", "app", "providers.tsx"),
    "utf-8",
  );

  it("mounts the toaster client-only so its portal can't break hydration", () => {
    // No static import — that would render (and portal) during hydration.
    expect(source).not.toMatch(
      /import\s*\{[^}]*\bToaster\b[^}]*\}\s*from\s*["']@paul-portfolio\/react["']/,
    );
    // Loaded through a dynamic import with server rendering off.
    expect(source).toMatch(/Toaster\s*=\s*dynamic\([\s\S]*?ssr:\s*false/);
  });
});

describe("app providers, failed writes", () => {
  function SaveButton({ meta }: { meta?: Record<string, unknown> }) {
    const save = useMutation({
      mutationFn: async () => {
        throw new Error("You already have an active season wallet");
      },
      meta,
    });
    return <button onClick={() => save.mutate()}>Save</button>;
  }

  it("reports any failed mutation, with the error and the mutation's own meta", async () => {
    const user = userEvent.setup();
    render(
      <Providers>
        <SaveButton meta={{ silent: true }} />
      </Providers>,
    );
    await user.click(screen.getByRole("button", { name: "Save" }));
    await vi.waitFor(() => expect(notifyMutationError).toHaveBeenCalledTimes(1));
    const [error, meta] = vi.mocked(notifyMutationError).mock.calls[0];
    expect(error).toEqual(new Error("You already have an active season wallet"));
    expect(meta).toEqual({ silent: true });
  });
});
