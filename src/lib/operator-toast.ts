// ---------------------------------------------------------------------------
// Toast store — framework-agnostic state management for toast notifications.
// Works with useSyncExternalStore in React or standalone in tests.
// ---------------------------------------------------------------------------

export type ToastVariant = "success" | "error" | "info";

export type Toast = {
  id: string;
  message: string;
  variant: ToastVariant;
};

export type AddToastInput = {
  message: string;
  variant?: ToastVariant;
};

export type ToastStore = {
  getToasts: () => readonly Toast[];
  addToast: (input: AddToastInput) => void;
  removeToast: (id: string) => void;
  subscribe: (listener: () => void) => () => void;
  destroy: () => void;
};

const AUTO_DISMISS_MS = 3_000;

let nextId = 0;

/**
 * Creates a standalone toast store. Each toast auto-dismisses after 3 seconds.
 * Designed to work with React's useSyncExternalStore or in plain tests.
 */
export function createToastStore(): ToastStore {
  let toasts: Toast[] = [];
  const listeners = new Set<() => void>();
  const timers = new Map<string, ReturnType<typeof setTimeout>>();

  function notify() {
    for (const fn of listeners) fn();
  }

  function removeToast(id: string) {
    const timer = timers.get(id);
    if (timer) {
      clearTimeout(timer);
      timers.delete(id);
    }
    toasts = toasts.filter((t) => t.id !== id);
    notify();
  }

  function addToast({ message, variant = "success" }: AddToastInput) {
    nextId += 1;
    const id = `toast-${nextId}`;
    const toast: Toast = { id, message, variant };
    toasts = [...toasts, toast];

    const timer = setTimeout(() => removeToast(id), AUTO_DISMISS_MS);
    timers.set(id, timer);

    notify();
  }

  function subscribe(listener: () => void) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  }

  function destroy() {
    for (const timer of timers.values()) clearTimeout(timer);
    timers.clear();
    listeners.clear();
  }

  return {
    getToasts: () => toasts,
    addToast,
    removeToast,
    subscribe,
    destroy,
  };
}
