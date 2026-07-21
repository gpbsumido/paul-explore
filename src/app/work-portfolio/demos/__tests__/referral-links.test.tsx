import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import ReferralLinksDemo from "../referral-links";
import { FEATURES, featureIndexBySlug } from "../../_data/catalog";

const feature = FEATURES[featureIndexBySlug("referral-links")!];

function mockFetch(status: number, body: unknown) {
  const fn = vi.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(body),
  });
  vi.stubGlobal("fetch", fn);
  return fn;
}

afterEach(() => vi.unstubAllGlobals());

function renderWithClient(ui: ReactNode) {
  const client = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>);
}

const CREATED = {
  slug: "abc123",
  targetPath: "/work-portfolio",
  label: null,
  url: "https://paulsumido.com/r/abc123",
  clicks: 0,
  createdAt: "2026-07-20T00:00:00.000Z",
};

describe("referral links demo", () => {
  it("creates a real referral link and renders the returned url", async () => {
    const fetchMock = mockFetch(201, CREATED);
    renderWithClient(<ReferralLinksDemo feature={feature} />);

    fireEvent.click(screen.getByRole("button", { name: /create link/i }));

    expect(await screen.findByText(/paulsumido\.com\/r\/abc123/)).toBeInTheDocument();
    const [url, init] = fetchMock.mock.calls[0];
    expect(String(url)).toMatch(/\/api\/referrals$/);
    expect(init.method).toBe("POST");
  });

  it("surfaces a taken slug as a friendly error", async () => {
    mockFetch(409, { error: "ConflictError" });
    renderWithClient(<ReferralLinksDemo feature={feature} />);

    fireEvent.change(screen.getByLabelText(/custom slug/i), {
      target: { value: "taken" },
    });
    fireEvent.click(screen.getByRole("button", { name: /create link/i }));

    expect(await screen.findByText(/already taken/i)).toBeInTheDocument();
  });
});
