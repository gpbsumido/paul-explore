import { describe, it, expect, afterEach, vi } from "vitest";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe("API_URL", () => {
  it("uses NEXT_PUBLIC_API_URL when it is set", async () => {
    vi.stubEnv("NEXT_PUBLIC_API_URL", "https://api.example.com");
    vi.resetModules();
    const { API_URL } = await import("./apiUrl");
    expect(API_URL).toBe("https://api.example.com");
  });

  it("falls back to localhost when the env var is unset", async () => {
    vi.stubEnv("NEXT_PUBLIC_API_URL", undefined);
    vi.resetModules();
    const { API_URL } = await import("./apiUrl");
    expect(API_URL).toBe("http://localhost:3001");
  });
});
