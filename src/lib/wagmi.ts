import { getDefaultConfig } from "@rainbow-me/rainbowkit";
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

export const wagmiConfig = getDefaultConfig({
  appName: "paul-explore",
  projectId,
  chains: [mainnet, sepolia],
  ssr: true,
});
