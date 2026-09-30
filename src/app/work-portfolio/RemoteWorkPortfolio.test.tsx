import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import {
  CONTRACT_VERSION,
  type HostContext,
  type RemoteModule,
} from "@paul-portfolio/work-portfolio-contract";

// Capture the context the island hands the remote, without loading anything.
const mounted: HostContext[] = [];
const remote: RemoteModule = {
  contractVersion: CONTRACT_VERSION,
  version: "1.4.0",
  mount: (el, ctx) => {
    mounted.push(ctx);
    el.textContent = "remote content";
    return { update: () => {}, unmount: () => {} };
  },
};
vi.mock("@/lib/mfe/federation", () => ({
  loadRemoteModule: () => Promise.resolve(remote),
}));

import RemoteWorkPortfolio from "./RemoteWorkPortfolio";
import RemoteReleaseChip from "./RemoteReleaseChip";

const REMOTE = {
  name: "workPortfolio",
  manifestUrl: "https://mfe.example/mf-manifest.json",
  origin: "https://mfe.example",
};

beforeEach(() => {
  mounted.length = 0;
  window.history.replaceState(null, "", "/work-portfolio");
});

const mountedContext = async () => {
  await screen.findByText("remote content");
  return mounted[0];
};

describe("RemoteWorkPortfolio (the host side of the boundary)", () => {
  it("hands the remote the slug from ?feature=", async () => {
    window.history.replaceState(null, "", "/work-portfolio?feature=chart-library");
    render(<RemoteWorkPortfolio remote={REMOTE} />);
    expect((await mountedContext()).initialFeature).toBe("chart-library");
  });

  it("writes the remote's selection back to ?feature= without adding history", async () => {
    render(<RemoteWorkPortfolio remote={REMOTE} />);
    const ctx = await mountedContext();
    const before = window.history.length;

    ctx.onFeatureChange("wallet-lookup");

    expect(window.location.search).toBe("?feature=wallet-lookup");
    expect(window.history.length).toBe(before);
  });

  it("drops ?feature= when the remote goes back to the intro", async () => {
    window.history.replaceState(null, "", "/work-portfolio?feature=chart-library");
    render(<RemoteWorkPortfolio remote={REMOTE} />);
    (await mountedContext()).onFeatureChange(null);
    expect(window.location.search).toBe("");
  });

  it("lends the remote the host's referral service", async () => {
    render(<RemoteWorkPortfolio remote={REMOTE} />);
    const { services } = await mountedContext();
    expect(typeof services.referrals.create).toBe("function");
  });

  it("shows which remote release is on the page, in the header, once it has mounted", async () => {
    render(
      <>
        <RemoteReleaseChip />
        <RemoteWorkPortfolio remote={REMOTE} />
      </>,
    );
    const chip = await screen.findByRole("link", { name: /remote v1\.4\.0/i });
    expect(chip).toHaveAttribute("href", "/thoughts/micro-frontends");
  });
});
