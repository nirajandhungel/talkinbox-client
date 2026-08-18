/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  apiClient — Production-ready centralized HTTP client
 * ─────────────────────────────────────────────────────────────────────────────
 *
 *  Enterprise-grade HTTP client with:
 *   - Global error normalization (status → user-friendly messages)
 *   - Network offline detection
 *   - 401 → token refresh → retry flow (with infinite-loop guard)
 *   - Structured ApiError with field-level validation errors
 *   - Session expiry event for auto-logout
 * ─────────────────────────────────────────────────────────────────────────────
 */

// ─── Public error interface ───────────────────────────────────────────────────

/** Shape that all callers should catch and read from */
export interface ApiError {
    status: number;
    message: string;
    /** Field-level validation errors returned by NestJS ValidationPipe */
    fieldErrors?: Record<string, string[]>;
}

// ─── Type guard ───────────────────────────────────────────────────────────────

export function isApiError(err: unknown): err is ApiError {
    return (
        typeof err === "object" &&
        err !== null &&
        "status" in err &&
        "message" in err
    );
}

// ─── Token storage helpers ────────────────────────────────────────────────────

const TOKEN_KEY = "ss_access_token";
const REFRESH_KEY = "ss_refresh_token";

export const tokenStore = {
    getAccess: (): string | null => localStorage.getItem(TOKEN_KEY),
    getRefresh: (): string | null => localStorage.getItem(REFRESH_KEY),
    set: (access: string, refresh?: string): void => {
        localStorage.setItem(TOKEN_KEY, access);
        if (refresh) localStorage.setItem(REFRESH_KEY, refresh);
    },
    clear: (): void => {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(REFRESH_KEY);
    },
};

// ─── Base URL ─────────────────────────────────────────────────────────────────

/**
 * All backend calls go to /api/* — resolved via the dev-proxy (vite.config.ts)
 * or the Nginx reverse proxy in production.
 * Override with VITE_API_URL if you need a different host.
 */
const BASE_URL = (import.meta.env.VITE_API_URL as string | undefined) ?? "";
const API_PREFIX = `${BASE_URL}/api/v1`;

// ─── Error parser ─────────────────────────────────────────────────────────────

/**
 * Safely converts any backend response body or JS error into a clean ApiError.
 *
 * Backend error format (from HttpExceptionFilter):
 * {
 *   success: false,
 *   statusCode: number,
 *   message: string | string[],
 *   errors: unknown,
 *   timestamp: string,
 *   path: string
 * }
 */
function parseError(status: number, body: unknown): ApiError {
    const USER_MESSAGES: Record<number, string> = {
        400: "Invalid request. Please check your input and try again.",
        401: "Session expired. Please log in again.",
        403: "You don't have permission to perform this action.",
        404: "Requested resource not found.",
        409: "This action conflicts with existing data. Please refresh and try again.",
        422: "The submitted data is invalid.",
        429: "Too many requests. Please slow down and try again.",
        500: "Something went wrong on our end. Please try again later.",
        502: "Service temporarily unavailable. Please try again shortly.",
        503: "Service temporarily unavailable. Please try again shortly.",
    };

    let message = USER_MESSAGES[status] ?? `Unexpected error (${status})`;
    let fieldErrors: Record<string, string[]> | undefined;

    if (body && typeof body === "object") {
        const b = body as Record<string, unknown>;

        // Extract field-level errors
        if (b.errors && typeof b.errors === "object") {
            fieldErrors = b.errors as Record<string, string[]>;
        }

        // Use backend message when it's informative (not raw internal errors)
        if (b.message) {
            if (Array.isArray(b.message)) {
                // NestJS ValidationPipe returns string[]
                const msgs = (b.message as unknown[])
                    .filter((m) => typeof m === "string")
                    .map((m) => capitalizeFirst(m as string));
                if (msgs.length > 0) {
                    message = msgs.join(". ");
                }
            } else if (typeof b.message === "string") {
                let raw = b.message;
                // Only use backend message if it is user-safe (not a stack trace / SQL dump)
                if (raw && !looksLikeInternalError(raw)) {
                    if (raw.startsWith("ACCOUNT_PENDING:")) raw = raw.replace("ACCOUNT_PENDING:", "").trim();
                    else if (raw.startsWith("ACCOUNT_REJECTED:")) raw = raw.replace("ACCOUNT_REJECTED:", "").trim();
                    else if (raw.startsWith("ACCOUNT_INACTIVE:")) raw = raw.replace("ACCOUNT_INACTIVE:", "").trim();

                    message = capitalizeFirst(raw);
                }
            }
        }
    }

    return { status, message, fieldErrors };
}

function capitalizeFirst(s: string): string {
    if (!s) return s;
    return s.charAt(0).toUpperCase() + s.slice(1);
}

function looksLikeInternalError(msg: string): boolean {
    const dangerous = [
        "stack",
        "at Object.",
        "at Module.",
        "QueryFailedError",
        "ERROR:  ",
        "PrismaClientKnownRequestError",
        "syntax error",
        "column",
        "relation",
        "ECONNREFUSED",
        "Cannot read propert",
    ];
    return dangerous.some((d) => msg.includes(d));
}

// ─── Refresh lock ─────────────────────────────────────────────────────────────

let _isRefreshing = false;
let _pendingQueue: Array<{
    resolve: (token: string) => void;
    reject: (err: unknown) => void;
}> = [];

async function runRefresh(): Promise<string> {
    const refreshToken = tokenStore.getRefresh();
    if (!refreshToken) throw parseError(401, null);

    const res = await fetch(`${API_PREFIX}/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
    });

    if (!res.ok) {
        tokenStore.clear();
        localStorage.removeItem("ss_session");
        window.dispatchEvent(new Event("ss:session-expired"));
        throw parseError(401, null);
    }

    const json = (await res.json()) as {
        data?: { accessToken: string; refreshToken?: string };
        accessToken?: string;
        refreshToken?: string;
    };
    const payload = json.data ?? json;
    const accessToken = payload.accessToken;
    const newRefresh = payload.refreshToken;
    if (!accessToken) throw parseError(401, null);
    tokenStore.set(accessToken, newRefresh);
    return accessToken;
}

// ─── Core fetch wrapper ───────────────────────────────────────────────────────

async function request<T>(
    method: string,
    path: string,
    body?: unknown,
    extraHeaders?: Record<string, string>,
    isRetry = false
): Promise<T> {
    // ─── Network / offline check ──────────────────────────────────────────────
    if (!navigator.onLine) {
        const offlineErr: ApiError = {
            status: 0,
            message: "Cannot connect to server. Check your internet connection.",
        };
        throw offlineErr;
    }

    const isFormData = body instanceof FormData;
    const token = tokenStore.getAccess();
    const headers: Record<string, string> = {
        ...(isFormData ? {} : { "Content-Type": "application/json" }),
        ...extraHeaders,
    };

    if (token) {
        headers["Authorization"] = `Bearer ${token}`;
    }

    const url = `${API_PREFIX}${path}`;

    let res: Response;
    try {
        res = await fetch(url, {
            method,
            headers,
            body: body !== undefined ? (isFormData ? body : JSON.stringify(body)) : undefined,
        });
    } catch {
        // fetch() itself threw — network error
        const err: ApiError = {
            status: 0,
            message: "Cannot connect to server. Check your internet connection.",
        };
        throw err;
    }

    // ─── 401: attempt token refresh once ─────────────────────────────────────
    if (res.status === 401 && !isRetry && !path.includes("/auth/login") && !path.includes("/auth/refresh")) {
        if (_isRefreshing) {
            // Wait for the in-progress refresh before retrying
            return new Promise<T>((resolve, reject) => {
                _pendingQueue.push({
                    resolve: (newToken) => {
                        request<T>(method, path, body, { ...extraHeaders, Authorization: `Bearer ${newToken}` }, true)
                            .then(resolve)
                            .catch(reject);
                    },
                    reject,
                });
            });
        }

        _isRefreshing = true;
        try {
            const newToken = await runRefresh();
            _pendingQueue.forEach((p) => p.resolve(newToken));
            _pendingQueue = [];
            _isRefreshing = false;
            return request<T>(method, path, body, extraHeaders, true);
        } catch (err) {
            _pendingQueue.forEach((p) => p.reject(err));
            _pendingQueue = [];
            _isRefreshing = false;
            throw err;
        }
    }

    // ─── 204 No Content ───────────────────────────────────────────────────────
    if (res.status === 204) return undefined as T;

    // ─── Parse JSON body ──────────────────────────────────────────────────────
    let json: unknown;
    try {
        json = await res.json();
    } catch {
        if (!res.ok) {
            throw parseError(res.status, null);
        }
        return undefined as T;
    }

    // ─── Error response ───────────────────────────────────────────────────────
    if (!res.ok) {
        throw parseError(res.status, json);
    }

    // ─── Unwrap backend envelope: { data: T } ─────────────────────────────────
    const jsonObj = json as Record<string, unknown>;
    return (jsonObj.data ?? json) as T;
}

// ─── Public API ───────────────────────────────────────────────────────────────

export const apiClient = {
    get: <T>(path: string, headers?: Record<string, string>) =>
        request<T>("GET", path, undefined, headers),

    post: <T>(path: string, body?: unknown, headers?: Record<string, string>) =>
        request<T>("POST", path, body, headers),

    put: <T>(path: string, body?: unknown, headers?: Record<string, string>) =>
        request<T>("PUT", path, body, headers),

    patch: <T>(path: string, body?: unknown, headers?: Record<string, string>) =>
        request<T>("PATCH", path, body, headers),

    del: <T>(path: string, headers?: Record<string, string>) =>
        request<T>("DELETE", path, undefined, headers),
};

/**
 * Extract a human-readable message from any caught value.
 * Safe to use in catch blocks: getErrorMessage(err)
 */
export function getErrorMessage(err: unknown): string {
    if (isApiError(err)) return err.message;
    if (err instanceof Error) return err.message;
    if (typeof err === "string") return err;
    return "An unexpected error occurred. Please try again.";
}

/**
 * Extract field-level validation errors from a caught ApiError.
 * Returns an empty object if not present.
 */
export function getFieldErrors(err: unknown): Record<string, string[]> {
    if (isApiError(err) && err.fieldErrors) return err.fieldErrors;
    return {};
}

export default apiClient;
