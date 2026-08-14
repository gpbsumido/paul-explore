import { describe, it, expect, vi, beforeEach } from "vitest";
import { Suspense } from "react";
import { render, screen } from "@testing-library/react";
import { axe } from "@/test/a11y";
import DiscoverPage from "./page";
import { auth0 } from "@/lib/auth0";

vi.mock("@/lib/auth0", () => ({ auth0: { getSession: vi.fn() } }));

// The v4 pair renders for real so the axe scan has something to scan. These two
// mocks are the same ones SlotMachine's own test needs to run under jsdom.
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock("next/font/google", () => ({
  Fraunces: () => ({ className: "font-fraunces", style: {} }),
}));

// The retired versions are stubbed. What is being pinned here is which version
// the page picks and whether it says so, not how v1 to v3 draw themselves, and
// their real trees drag in framer-motion and WebGL for no benefit.
vi.mock("../LandingContent", () => ({
  default: () => <div>v1 landing</div>,
}));
vi.mock("../v2/LandingContentV2", () => ({
  default: () => <div>v2 landing</div>,
}));
vi.mock("../v3/LandingContentV3", () => ({
  default: () => <div>v3 landing</div>,
}));

const getSession = vi.mocked(auth0.getSession);

/** Awaits the async server component and renders it inside a Suspense boundary. */
const renderDiscover = async (
  params: Record<string, string | string[] | undefined> = {},
) => {
  const element = await DiscoverPage({ searchParams: Promise.resolve(params) });
  return render(<Suspense fallback={null}>{element}</Suspense>);
};

/** A session shaped the way the page reads it, with only the fields it uses. */
const sessionFor = (name: string | null, email: string | null) =>
  ({ user: { name, email } }) as unknown as Awaited<
    ReturnType<typeof auth0.getSession>
  >;

describe("/discover", () => {
  beforeEach(() => {
    getSession.mockReset();
    getSession.mockResolvedValue(null);
  });

  it("shows the current landing page to a visitor with no session", async () => {
    await renderDiscover();

    expect(
      await screen.findByText(/Spin through everything I've built/),
    ).toBeInTheDocument();
  });

  it("shows the hub greeting to a signed-in visitor", async () => {
    getSession.mockResolvedValue(sessionFor("Paul Sumido", "psumido@gmail.com"));

    await renderDiscover();

    expect(await screen.findByText(/Hey Paul/)).toBeInTheDocument();
  });

  it("opens a retired version behind a banner when asked for one", async () => {
    await renderDiscover({ version: "v2" });

    expect(await screen.findByText(/v2 landing/)).toBeInTheDocument();
    expect(screen.getByText(/You're viewing v2/)).toBeInTheDocument();
  });

  it("falls back to the current version when the param is junk", async () => {
    await renderDiscover({ version: "../../etc/passwd" });

    expect(
      await screen.findByText(/Spin through everything I've built/),
    ).toBeInTheDocument();
    expect(screen.queryByText(/You're viewing/)).not.toBeInTheDocument();
  });

  it("has no axe violations", async () => {
    const { container } = await renderDiscover();
    await screen.findByText(/Spin through everything I've built/);

    expect(await axe(container)).toHaveNoViolations();
  });
});
