"use client";

import "@rainbow-me/rainbowkit/styles.css";
import { WagmiProvider } from "wagmi";
import {
  RainbowKitProvider,
  lightTheme,
  darkTheme,
} from "@rainbow-me/rainbowkit";
import { wagmiConfig } from "@/lib/wagmi";
import { useTheme } from "@/components/ThemeProvider";

/**
 * App-wide wallet-connect provider. Wraps the tree in wagmi + RainbowKit so
 * any page can read the connected account or drop in a connect button.
 *
 * Sits inside the existing QueryClientProvider (wagmi uses TanStack Query) and
 * inside ThemeProvider, so the RainbowKit modal follows the app's light/dark
 * theme.
 */
export default function Web3Provider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { theme } = useTheme();
  return (
    <WagmiProvider config={wagmiConfig}>
      <RainbowKitProvider
        theme={theme === "dark" ? darkTheme() : lightTheme()}
        modalSize="compact"
      >
        {children}
      </RainbowKitProvider>
    </WagmiProvider>
  );
}
