import { describe, it, expect } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { http, HttpResponse } from "msw";
import type { ReactNode } from "react";
import { server } from "@/test/server";
import { useMe } from "../useMe";

function wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

const meAnswers = (response: () => Response) => {
  server.use(http.get("/api/me", response));
  return renderHook(() => useMe(), { wrapper });
};

/**
 * Eleven components each declared their own /api/me query under one shared
 * key, and they disagreed on what a failure meant: one turned it into "signed
 * out", the rest threw. Whichever ran first decided for all of them.
 */
describe("useMe", () => {
  it("reads a signed-in session", async () => {
    const { result } = meAnswers(() =>
      HttpResponse.json({ name: "Paul", email: "p@example.com", sub: "auth0|p", isFlagAdmin: false }),
    );

    await waitFor(() => expect(result.current.data?.sub).toBe("auth0|p"));
  });

  it("reads signed out as a session with no sub", async () => {
    const { result } = meAnswers(() =>
      HttpResponse.json({ name: null, email: null, sub: null, isFlagAdmin: false }),
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.sub).toBeNull();
  });

  it("reports a failed check as an error, never as signed out", async () => {
    const { result } = meAnswers(() =>
      HttpResponse.json({ error: "boom" }, { status: 500 }),
    );

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.data).toBeUndefined();
  });

  it("fills in the optional fields an older /api/me leaves out", async () => {
    const { result } = meAnswers(() => HttpResponse.json({ sub: "auth0|p" }));

    await waitFor(() =>
      expect(result.current.data).toEqual({
        name: null,
        email: null,
        sub: "auth0|p",
        isFlagAdmin: false,
      }),
    );
  });

  it.each([
    ["a body with no sub", { name: "Paul" }],
    ["a sub that isn't a string", { sub: 42 }],
    ["a flag that isn't a boolean", { sub: null, isFlagAdmin: "yes" }],
    ["something that isn't an object", ["auth0|p"]],
  ])("rejects %s rather than guessing", async (_label, body) => {
    const { result } = meAnswers(() => HttpResponse.json(body));

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});
