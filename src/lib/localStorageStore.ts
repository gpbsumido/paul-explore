/**
 * An external store over one localStorage key, for useSyncExternalStore.
 *
 * The snapshot has to be referentially stable between reads or
 * useSyncExternalStore re-renders forever, so the parsed value is cached
 * against the raw string and only rebuilt when that string changes. Keying on
 * the raw string means storage cleared or written elsewhere shows up on the
 * next read, and the `storage` event tells subscribers when another tab wrote
 * the key. The server snapshot is `empty`, which the first client paint
 * matches too.
 *
 * @param key - The localStorage key.
 * @param parse - Turns the stored string (or null when unset) into a value.
 *   How a corrupt value is handled is the caller's call.
 * @param empty - The value before anything is stored, and on the server.
 */
export function createLocalStorageStore<T>({
  key,
  parse,
  empty,
}: {
  key: string;
  parse: (raw: string | null) => T;
  empty: T;
}) {
  let cachedRaw: string | null | undefined;
  let cachedValue = empty;
  const listeners = new Set<() => void>();

  function getSnapshot(): T {
    const raw = window.localStorage.getItem(key);
    if (raw !== cachedRaw) {
      cachedRaw = raw;
      cachedValue = parse(raw);
    }
    return cachedValue;
  }

  function subscribe(listener: () => void): () => void {
    // A null key means another tab cleared storage outright.
    const onStorage = (event: StorageEvent) => {
      if (event.key === key || event.key === null) listener();
    };
    listeners.add(listener);
    window.addEventListener("storage", onStorage);
    return () => {
      listeners.delete(listener);
      window.removeEventListener("storage", onStorage);
    };
  }

  function write(next: T): void {
    try {
      window.localStorage.setItem(key, JSON.stringify(next));
    } catch {
      // Full or blocked storage keeps the new value for this page only, which
      // beats breaking whatever the visitor was doing.
    }
    cachedRaw = window.localStorage.getItem(key);
    cachedValue = next;
    listeners.forEach((listener) => listener());
  }

  return { getSnapshot, getServerSnapshot: () => empty, subscribe, write };
}
