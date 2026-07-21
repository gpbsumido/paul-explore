"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";
import Button from "@/components/ui/Button";

/**
 * Design-system-styled wallet connect control, reusable anywhere under
 * Web3Provider. Wraps RainbowKit's headless ConnectButton so the trigger uses
 * the app's Button while the connect/account modals stay RainbowKit's.
 */
// ts-prune-ignore-next -- public wallet control, wired into the gamer-hub demo in a later phase of the work-portfolio update
export default function ConnectWallet() {
  return (
    <ConnectButton.Custom>
      {({
        account,
        chain,
        openConnectModal,
        openAccountModal,
        openChainModal,
        mounted,
      }) => {
        const connected = mounted && account && chain;

        if (!mounted) {
          return (
            <Button size="sm" disabled>
              Connect wallet
            </Button>
          );
        }
        if (!connected) {
          return (
            <Button size="sm" onClick={openConnectModal}>
              Connect wallet
            </Button>
          );
        }
        if (chain.unsupported) {
          return (
            <Button size="sm" variant="danger" onClick={openChainModal}>
              Wrong network
            </Button>
          );
        }
        return (
          <Button size="sm" variant="outline" onClick={openAccountModal}>
            {account.displayName}
            {account.displayBalance ? ` · ${account.displayBalance}` : ""}
          </Button>
        );
      }}
    </ConnectButton.Custom>
  );
}
