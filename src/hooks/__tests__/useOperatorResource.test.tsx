import { describe, it, expect } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { http, HttpResponse } from "msw";
import { server } from "@/test/server";
import { z } from "zod";
import { useOperatorResource } from "../useOperatorResource";
import type { ReactNode } from "react";

const widgetSchema = z.object({ id: z.string() });
type Widget = z.infer<typeof widgetSchema>;

const URL = "/api/operator/_widgets";

function makeWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };
}

function renderWidgets() {
  return renderHook(
    () =>
      useOperatorResource<Widget>({
        queryKey: ["operator", "widgets"],
        url: URL,
        select: (json) =>
          z.array(widgetSchema).parse((json as { widgets: unknown }).widgets),
        fetchError: "Failed to fetch widgets",
        loadError: "Failed to load widgets.",
      }),
    { wrapper: makeWrapper() },
  );
}

describe("useOperatorResource", () => {
  it("parses and returns the selected payload", async () => {
    server.use(
      http.get(URL, () => HttpResponse.json({ widgets: [{ id: "a" }] })),
    );
    const { result } = renderWidgets();
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.data).toEqual([{ id: "a" }]);
    expect(result.current.error).toBeNull();
  });

  it("surfaces the fetch error message when the response is not ok", async () => {
    server.use(
      http.get(URL, () => new HttpResponse(null, { status: 500 })),
    );
    const { result } = renderWidgets();
    await waitFor(() => expect(result.current.error).not.toBeNull());
    expect(result.current.error).toBe("Failed to fetch widgets");
  });

  it("surfaces an error when the payload fails schema validation", async () => {
    server.use(
      http.get(URL, () => HttpResponse.json({ widgets: [{ id: 1 }] })),
    );
    const { result } = renderWidgets();
    await waitFor(() => expect(result.current.error).not.toBeNull());
    expect(result.current.data).toBeUndefined();
  });
});
