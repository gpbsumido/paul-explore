"use client";

import {
  createContext,
  useContext,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import {
  createToastStore,
  type Toast,
  type AddToastInput,
} from "@/lib/operator-toast";

type ToastCtx = {
  toasts: readonly Toast[];
  addToast: (input: AddToastInput) => void;
  removeToast: (id: string) => void;
};

const ToastContext = createContext<ToastCtx>({
  toasts: [],
  addToast: () => {},
  removeToast: () => {},
});

// module-level singleton — safe because the store is pure state with no
// server-side concerns, and useSyncExternalStore is designed for this pattern
const toastStore = createToastStore();

/**
 * Provides toast state to the component tree. Uses a module-level ToastStore
 * singleton bridged to React via useSyncExternalStore so toast adds and
 * auto-dismissals trigger re-renders efficiently.
 */
export function ToastProvider({ children }: { children: ReactNode }) {
  const toasts = useSyncExternalStore(
    toastStore.subscribe,
    toastStore.getToasts,
    () => [] as readonly Toast[],
  );

  // Memoize so context consumers only re-render when the toast list changes,
  // not on every provider render (the store fns are stable module-level refs).
  const value = useMemo(
    () => ({
      toasts,
      addToast: toastStore.addToast,
      removeToast: toastStore.removeToast,
    }),
    [toasts],
  );

  return (
    <ToastContext.Provider value={value}>{children}</ToastContext.Provider>
  );
}

export function useToast(): ToastCtx {
  return useContext(ToastContext);
}
