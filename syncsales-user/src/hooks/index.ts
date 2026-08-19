import { useState, useEffect, useRef, useCallback } from "react";
import { DEBOUNCE_DELAY, DEFAULT_PAGE_SIZE } from "@/constants";
export { useApiMutation } from "./useApiMutation";
export { useChartTheme } from "./useChartTheme";


// ─── usePagination ────────────────────────────────────────────────

export function usePagination(initialPageSize = DEFAULT_PAGE_SIZE) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);

  const reset = useCallback(() => setPage(1), []);

  return { page, pageSize, setPage, setPageSize, reset };
}

// ─── useDebounce ──────────────────────────────────────────────────

export function useDebounce<T>(value: T, delay = DEBOUNCE_DELAY): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}

// ─── useSearch ────────────────────────────────────────────────────

export function useSearch() {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search);
  return { search, setSearch, debouncedSearch };
}

// ─── useClickOutside ─────────────────────────────────────────────

export function useClickOutside<T extends HTMLElement>(
  callback: () => void
): React.RefObject<T> {
  const ref = useRef<T>(null);

  useEffect(() => {
    const handler = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        callback();
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [callback]);

  return ref;
}

// ─── useLocalStorage ─────────────────────────────────────────────

export function useLocalStorage<T>(key: string, defaultValue: T) {
  const [value, setValue] = useState<T>(() => {
    try {
      const stored = localStorage.getItem(key);
      return stored ? (JSON.parse(stored) as T) : defaultValue;
    } catch {
      return defaultValue;
    }
  });

  const setStoredValue = useCallback(
    (newValue: T | ((prev: T) => T)) => {
      const resolved = typeof newValue === "function"
        ? (newValue as (prev: T) => T)(value)
        : newValue;
      setValue(resolved);
      try {
        localStorage.setItem(key, JSON.stringify(resolved));
      } catch {
        // Storage unavailable
      }
    },
    [key, value]
  );

  return [value, setStoredValue] as const;
}

// ─── useKeyPress ──────────────────────────────────────────────────

export function useKeyPress(key: string, callback: () => void) {
  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (event.key === key) callback();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [key, callback]);
}

// ─── useToggle ────────────────────────────────────────────────────

export function useToggle(initial = false) {
  const [value, setValue] = useState(initial);
  const toggle = useCallback(() => setValue((v) => !v), []);
  const setTrue = useCallback(() => setValue(true), []);
  const setFalse = useCallback(() => setValue(false), []);
  return { value, toggle, setTrue, setFalse };
}

// ─── useSelectedRows ─────────────────────────────────────────────

export function useSelectedRows<T extends { id: number | string }>() {
  const [selected, setSelected] = useState<Set<T["id"]>>(new Set());

  const toggle = useCallback((id: T["id"]) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleAll = useCallback((items: T[]) => {
    setSelected((prev) => {
      if (prev.size === items.length) return new Set();
      return new Set(items.map((i) => i.id));
    });
  }, []);

  const clear = useCallback(() => setSelected(new Set()), []);

  return { selected, toggle, toggleAll, clear, count: selected.size };
}
