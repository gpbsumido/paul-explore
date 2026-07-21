import { describe, it, expect } from "vitest";
import { renderHook } from "@testing-library/react";
import { WagmiProvider, createConfig, http } from "wagmi";
import { mainnet } from "wagmi/chains";
import { mock } from "wagmi/connectors";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { useWallet } from "../useWallet";

const config = createConfig({
  chains: [mainnet],
  connectors: [
    mock({ accounts: ["0x0000000000000000000000000000000000000001"] }),
  ],
  transports: { [mainnet.id]: http() },
});

function wrapper({ children }: { children: ReactNode }) {
  const queryClient = new QueryClient();
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WagmiProvider>
  );
}

describe("useWallet", () => {
  it("reports a disconnected state by default", () => {
    const { result } = renderHook(() => useWallet(), { wrapper });
    expect(result.current.isConnected).toBe(false);
    expect(result.current.address).toBeUndefined();
    expect(result.current.balanceLabel).toBeNull();
    expect(result.current.ensName).toBeNull();
  });
});
