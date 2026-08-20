import { describe, it, expect } from "vitest";
import { matchRateLimit } from "@/lib/rateLimitRules";

/**
 * Tests for the rate-limit rule table in proxy.ts.
 *
 * We extract the matching logic by re-declaring the rule shapes here rather
 * than importing the full proxy module, which pulls in next/server and Auth0
 * and requires a Next.js runtime. The rule predicates are the only thing worth
 * testing in isolation — the rest of proxy.ts is pure routing glue.
 */

// Exercises the REAL rule table imported from proxy's source, not a copy, so a
// change to the rules can't silently pass a stale mirror here.
const matchRule = matchRateLimit;

describe("proxy rate-limit rule matching", () => {
  describe("vitals bucket", () => {
    it("matches POST /api/vitals", () => {
      expect(matchRule("/api/vitals", "POST")?.bucket).toBe("vitals");
    });

    it("does not match GET /api/vitals (falls to api fallback)", () => {
      expect(matchRule("/api/vitals", "GET")?.bucket).toBe("api");
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
  });

  describe("first-match-wins ordering", () => {
    it("vitals rule fires before the api fallback for POST /api/vitals", () => {
      const rule = matchRule("/api/vitals", "POST");
      expect(rule?.bucket).toBe("vitals");
      expect(rule?.bucket).not.toBe("api");
    });

    it("graphql rule fires before the api fallback for POST /api/graphql", () => {
      const rule = matchRule("/api/graphql", "POST");
      expect(rule?.bucket).toBe("graphql");
      expect(rule?.bucket).not.toBe("api");
    });
  });
});
