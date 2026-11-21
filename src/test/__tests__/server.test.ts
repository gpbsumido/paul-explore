import { describe, expect, it } from "vitest";
import { http, HttpResponse } from "msw";
import { server } from "../server";

/**
 * Every other suite leans on this server, so it gets checked directly: the
 * app-wide defaults answer the way the real routes do, and a request nobody
 * mocked fails loudly instead of quietly reaching the network.
 */
describe("the shared MSW server", () => {
  it("answers the session probe as signed out by default", async () => {
    const response = await fetch("/api/me");

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ name: null, email: null, sub: null, isFlagAdmin: false });
  });

  it("answers the geo lookup with a Toronto visitor", async () => {
    const response = await fetch("/api/geo");

    expect(await response.json()).toEqual({
      city: "Toronto",
      region: "Ontario",
      country: "CA",
      timezone: "America/Toronto",
    });
  });

  it("answers the feature-flag call on any origin, since the BFF calls the API absolutely", async () => {
    const relative = await fetch("/api/feature-flags");
    const absolute = await fetch("http://localhost:3001/api/feature-flags");

    expect(await relative.json()).toEqual({ flags: [] });
    expect(await absolute.json()).toEqual({ flags: [] });
  });

  it("fails a request nothing mocked, rather than letting it through", async () => {
    // MSW's own refusal, not a DNS failure on a made-up host: the request never leaves.
    await expect(fetch("http://unmocked.invalid/anything")).rejects.toThrow(
      /Cannot bypass a request when using the "error" strategy/,
    );
  });

  it("lets a test override a default for itself", async () => {
    server.use(http.get("/api/me", () => HttpResponse.json({ name: "Paul", email: "p@example.com", sub: "s" })));

    const response = await fetch("/api/me");

    expect(await response.json()).toMatchObject({ name: "Paul" });
  });
});
