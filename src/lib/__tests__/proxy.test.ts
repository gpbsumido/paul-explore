import { describe, it, expect } from "vitest";
import { matchRateLimit } from "@/lib/rateLimitRules";

/**
 * Tests for the rate-limit rule table the proxy consults. The table lives in
 * rateLimitRules.ts rather than proxy.ts so it can be imported here without
 * pulling in next/server and Auth0; the rest of proxy.ts is routing glue.
 */
const matchRule = matchRateLimit;

describe("proxy rate-limit rule matching", () => {
  describe("vitals bucket", () => {
    it("matches POST /api/vitals", () => {
      expect(matchRule("/api/vitals", "POST")?.bucket).toBe("vitals");
    });

    it("does not match GET /api/vitals (falls to api fallback)", () => {
      expect(matchRule("/api/vitals", "GET")?.bucket).toBe("api");
    });

    it("does not match a POST to a nested path under /api/vitals", () => {
      expect(matchRule("/api/vitals/extra", "POST")?.bucket).toBe("api");
    });

    it("applies a limit of 20", () => {
      expect(matchRule("/api/vitals", "POST")?.limit).toBe(20);
    });
  });

  describe("geo bucket", () => {
    it("matches GET /api/geo", () => {
      expect(matchRule("/api/geo", "GET")?.bucket).toBe("geo");
    });

    it("does not match POST /api/geo (falls to api fallback)", () => {
      expect(matchRule("/api/geo", "POST")?.bucket).toBe("api");
    });

    it("applies a limit of 30", () => {
      expect(matchRule("/api/geo", "GET")?.limit).toBe(30);
    });
  });

  describe("graphql bucket", () => {
    it("matches POST /api/graphql", () => {
      expect(matchRule("/api/graphql", "POST")?.bucket).toBe("graphql");
    });

    it("applies a limit of 60", () => {
      expect(matchRule("/api/graphql", "POST")?.limit).toBe(60);
    });

    it("does not match GET /api/graphql (falls to api fallback)", () => {
      expect(matchRule("/api/graphql", "GET")?.bucket).toBe("api");
    });
  });

  describe("operator-write bucket", () => {
    it("caps a POST operator write at 40", () => {
      const rule = matchRule("/api/operator/stores/abc/restock", "POST");
      expect(rule?.bucket).toBe("operator-write");
      expect(rule?.limit).toBe(40);
    });

    it("caps a PATCH operator write too", () => {
      expect(
        matchRule("/api/operator/alerts/a1/dismiss", "PATCH")?.bucket,
      ).toBe("operator-write");
    });

    it.each(["POST", "PUT", "PATCH", "DELETE"])("caps a %s on any operator route", (method) => {
      expect(matchRule("/api/operator/stores/abc", method)?.bucket).toBe("operator-write");
    });

    it("doesn't treat a route that only starts with the same letters as an operator write", () => {
      expect(matchRule("/api/operators", "POST")?.bucket).toBe("api");
    });

    it("lets operator reads fall through to the api backstop", () => {
      expect(
        matchRule("/api/operator/stores/abc/inventory", "GET")?.bucket,
      ).toBe("api");
    });
  });

  describe("api fallback bucket", () => {
    it("matches any other /api/ route", () => {
      expect(matchRule("/api/calendar/events", "GET")?.bucket).toBe("api");
    });

    it("applies a generous limit of 300", () => {
      expect(matchRule("/api/calendar/events", "GET")?.limit).toBe(300);
    });

    it("matches nested API paths", () => {
      expect(matchRule("/api/calendar/events/abc-123", "DELETE")?.bucket).toBe(
        "api",
      );
    });
  });

  describe("non-API routes", () => {
    it("returns null for the root page", () => {
      expect(matchRule("/", "GET")).toBeNull();
    });

    it("returns null for a page route", () => {
      expect(matchRule("/calendar", "GET")).toBeNull();
    });

    it("returns null for a path that only looks like the api prefix", () => {
      expect(matchRule("/api", "GET")).toBeNull();
      expect(matchRule("/apiary", "GET")).toBeNull();
    });
  });
});
