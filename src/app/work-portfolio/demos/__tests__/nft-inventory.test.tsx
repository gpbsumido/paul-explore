import { describe, it, expect } from "vitest";
import { useEffect } from "react";
import { render, screen, fireEvent, within, waitFor } from "@testing-library/react";
import { WagmiProvider, createConfig, http, useConnect } from "wagmi";
import { mainnet } from "wagmi/chains";
import { mock } from "wagmi/connectors";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RainbowKitProvider } from "@rainbow-me/rainbowkit";
import type { ReactNode } from "react";
import { NftInventoryPanel, transferAsset } from "../nft-inventory";
import { FEATURES, featureIndexBySlug } from "../../_data/catalog";

const feature = FEATURES[featureIndexBySlug("nft-inventory")!];
const TEST_ADDRESS = "0x1234567890000000000000000000000000000001";

/** Connects the mock wallet on mount so children render in the connected state. */
function AutoConnect({ children }: { children: ReactNode }) {
  const { connect, connectors } = useConnect();
  useEffect(() => {
    connect({ connector: connectors[0] });
  }, [connect, connectors]);
  return <>{children}</>;
}

/** Render a panel with a mock wallet already connecting, mirroring Web3Provider. */
function renderConnected(ui: ReactNode) {
  const testConfig = createConfig({
    chains: [mainnet],
    connectors: [mock({ accounts: [TEST_ADDRESS] })],
    transports: { [mainnet.id]: http() },
  });
  const queryClient = new QueryClient();
  return render(
    <WagmiProvider config={testConfig}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>
          <AutoConnect>{ui}</AutoConnect>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>,
  );
}

describe("nft inventory demo", () => {
  it("shows the inventory grid and the connected address once a wallet connects", async () => {
    renderConnected(<NftInventoryPanel feature={feature} />);
    expect(await screen.findByLabelText("Inventory grid")).toBeInTheDocument();
    expect(screen.getByText(/0x1234…0001/)).toBeInTheDocument();
  });

  it("opens a detail modal with the clicked asset's data", async () => {
    renderConnected(<NftInventoryPanel feature={feature} />);
    await screen.findByLabelText("Inventory grid");

    const firstCard = within(screen.getByLabelText("Inventory grid")).getAllByRole("button")[0];
    const assetName = firstCard.textContent?.match(/Relic #\d+/)?.[0] ?? "";
    expect(assetName).not.toBe("");

    fireEvent.click(firstCard);

    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveTextContent(assetName);
    expect(dialog).toHaveTextContent(/Token/i);
    expect(dialog).toHaveTextContent(/Provenance/i);
  });

  it("moves an asset between wallet panes in transfer mode", async () => {
    renderConnected(<NftInventoryPanel feature={feature} />);
    await screen.findByLabelText("Inventory grid");
    fireEvent.click(screen.getByRole("button", { name: /transfer/i }));

    const you = screen.getByRole("list", { name: "You" });
    const recipient = screen.getByRole("list", { name: "Recipient" });
    const countIn = (list: HTMLElement) => within(list).queryAllByRole("listitem").length;

    const startYou = countIn(you);
    expect(startYou).toBeGreaterThan(0);
    expect(countIn(recipient)).toBe(0);

    fireEvent.click(
      within(you).getAllByRole("button", { name: /send .* to recipient/i })[0],
    );

    await waitFor(() => expect(countIn(you)).toBe(startYou - 1));
    expect(countIn(recipient)).toBe(1);
  });

  it("transferAsset only reassigns the targeted asset", () => {
    const assets = [
      { id: 1, wallet: "me" as const },
      { id: 2, wallet: "me" as const },
    ];
    const next = transferAsset(assets, 1, "them");
    expect(next[0].wallet).toBe("them");
    expect(next[1].wallet).toBe("me");
  });
});
