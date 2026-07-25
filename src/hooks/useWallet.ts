"use client";

import { useAccount, useBalance, useDisconnect, useEnsName } from "wagmi";

export interface WalletState {
  /** Connected address, or undefined when disconnected. */
  address: `0x${string}` | undefined;
  /** Reverse-resolved ENS name, when the address has one. */
  ensName: string | null;
  /** Human-readable native balance, e.g. "1.2345 ETH". */
  balanceLabel: string | null;
  isConnected: boolean;
  isConnecting: boolean;
  chainId: number | undefined;
  disconnect: () => void;
}

/**
 * Thin read layer over wagmi for the connected wallet. Reusable anywhere under
 * the app's Web3Provider so demos and future features can show the address,
 * ENS, and balance without wiring wagmi hooks each time.
 */
export function useWallet(): WalletState {
  const { address, isConnected, isConnecting, chainId } = useAccount();
  const { data: ensName } = useEnsName({ address });
  const { data: balance } = useBalance({ address });
  const { disconnect } = useDisconnect();

  const balanceLabel = balance
    ? `${Number(balance.formatted).toFixed(4)} ${balance.symbol}`
    : null;

  return {
    address,
    ensName: ensName ?? null,
    balanceLabel,
    isConnected,
    isConnecting,
    chainId,
    disconnect,
  };
}
