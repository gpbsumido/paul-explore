import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { http, HttpResponse } from "msw";
import { server } from "@/test/server";
import { buildFlag } from "@/test/factories/flags";
import FlagsConsole from "./FlagsConsole";

function renderConsole(source: "api" | "seed") {
  server.use(
    http.get("/api/flags", () =>
      HttpResponse.json({
        flags: [buildFlag({ key: "new-checkout" })],
        environments: ["production"],
        source,
      }),
    ),
    http.get("/api/flags/audit", () => HttpResponse.json({ audit: [], source })),
  );
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <FlagsConsole />
    </QueryClientProvider>,
  );
}

/**
 * The flags BFF falls back to the built-in fleet whenever the API doesn't
 * answer, which is right for gating a page but meant the console showed demo
 * configs as if they were the live ones. It now says so.
 */
describe("FlagsConsole", () => {
  it("says it is showing the demo flags when the API didn't answer", async () => {
    renderConsole("seed");

    expect(await screen.findByRole("status")).toHaveTextContent(
      /demo flags/i,
    );
  });

  it("says nothing extra when the flags are live", async () => {
    renderConsole("api");

    await screen.findByText(/1 flags in production/);
    expect(screen.queryByText(/demo flags/i)).not.toBeInTheDocument();
  });
});
