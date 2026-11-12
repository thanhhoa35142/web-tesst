"use client";

import { useSyncExternalStore } from "react";

// Minimal external store backed by localStorage. useSyncExternalStore gives
// hydration-safe reads: server snapshot = initial value, client re-reads
// after hydration — no setState-in-effect, no hydration mismatch.

const listeners = new Map<string, Set<() => void>>();

function emit(key: string) {
  listeners.get(key)?.forEach((cb) => cb());
}

function subscribe(key: string) {
  return (callback: () => void) => {
    let set = listeners.get(key);
    if (!set) listeners.set(key, (set = new Set()));
    set.add(callback);
    // Cross-tab sync via native storage event.
    const onStorage = (e: StorageEvent) => {
      if (e.key === key) callback();
    };
    window.addEventListener("storage", onStorage);
    return () => {
      set.delete(callback);
      window.removeEventListener("storage", onStorage);
    };
  };
}

/**
 * Persisted state in localStorage.
 * @param parse   raw string -> value (return `initial` for unknown/missing)
 * @param serialize value -> string stored
 */
export function usePersistentState<T>(
  key: string,
  initial: T,
  parse: (raw: string | null) => T,
  serialize: (value: T) => string,
): readonly [T, (next: T | ((prev: T) => T)) => void] {
  const value = useSyncExternalStore(
    subscribe(key),
    () => {
      const raw = localStorage.getItem(key);
      return raw === null ? initial : parse(raw);
    },
    () => initial,
  );

  const set = (next: T | ((prev: T) => T)) => {
    const resolved = typeof next === "function" ? (next as (p: T) => T)(value) : next;
    localStorage.setItem(key, serialize(resolved));
    emit(key);
  };

  return [value, set] as const;
}
