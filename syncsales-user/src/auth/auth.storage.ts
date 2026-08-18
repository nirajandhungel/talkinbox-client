import type { Session } from "./auth.types";

// ─── Storage Keys ─────────────────────────────────────────────────

const KEYS = {
    SESSION: "syncsales_session",
} as const;

// ─── Generic Helpers ──────────────────────────────────────────────

function getItem<T>(key: string): T | null {
    try {
        const raw = localStorage.getItem(key);
        return raw ? (JSON.parse(raw) as T) : null;
    } catch {
        return null;
    }
}

function setItem<T>(key: string, value: T): void {
    localStorage.setItem(key, JSON.stringify(value));
}

function removeItem(key: string): void {
    localStorage.removeItem(key);
}

// ─── Session ──────────────────────────────────────────────────────

export const sessionStorage = {
    get: (): Session | null => getItem<Session>(KEYS.SESSION),
    set: (session: Session): void => setItem(KEYS.SESSION, session),
    clear: (): void => removeItem(KEYS.SESSION),
};

// ─── Full Reset ───────────────────────────────────────────────────

export function clearAllAuthStorage(): void {
    Object.values(KEYS).forEach(removeItem);
}
