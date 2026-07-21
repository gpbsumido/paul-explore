import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { http } from "wagmi";
import { mainnet, sepolia } from "wagmi/chains";

/**
 * Shared wagmi config for the app's wallet-connect support. Built with
 * RainbowKit's getDefaultConfig so the connect modal gets the curated wallet
 * list (injected/browser wallets, Coinbase, WalletConnect).
 *
 * The WalletConnect project id comes from NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID.
 * Until a real id is set, browser-injected wallets (MetaMask, Rabbit, etc.)
 * still work; the WalletConnect option needs the real id to function.
 */
const projectId =
  process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID ?? "PLACEHOLDER_PROJECT_ID";

// Pin the RPC endpoints instead of using viem's rotating chain defaults, so the
// hosts we allow in the CSP connect-src stay in sync with what actually gets
// called. publicnode has open CORS and is stable across viem versions.
export const RPC_URLS = {
  mainnet: "https://ethereum-rpc.publicnode.com",
  sepolia: "https://ethereum-sepolia-rpc.publicnode.com",
} as const;

export const wagmiConfig = getDefaultConfig({
  appName: "paul-explore",
  projectId,
  chains: [mainnet, sepolia],
  transports: {
    [mainnet.id]: http(RPC_URLS.mainnet),
    [sepolia.id]: http(RPC_URLS.sepolia),
  },
  ssr: true,
});
