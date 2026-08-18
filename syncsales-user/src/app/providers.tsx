import { QueryClient, QueryClientProvider, MutationCache, QueryCache } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import type { ReactNode } from "react";
import { AuthProvider } from "@/auth/AuthProvider";
import { getErrorMessage, isApiError } from "@/api/client";
import { useToastStore } from "@/store";

// ─── Global error handler (runs outside React tree, use store directly) ───────

function handleGlobalError(error: unknown) {
    const { addToast } = useToastStore.getState();

    // Don't double-toast 401 — the auth flow handles it
    if (isApiError(error) && error.status === 401) return;

    // Don't toast 404 on background queries — they show EmptyState instead
    if (isApiError(error) && error.status === 404) return;

    addToast(getErrorMessage(error), "error");
}

// ─── QueryClient singleton ────────────────────────────────────────────────────

const queryClient = new QueryClient({
    queryCache: new QueryCache({
        onError: (error) => handleGlobalError(error),
    }),
    mutationCache: new MutationCache({
        onError: (error) => handleGlobalError(error),
    }),
    defaultOptions: {
        queries: {
            staleTime: 1000 * 60 * 2,    // 2 minutes
            gcTime: 1000 * 60 * 10,      // 10 minutes
            retry: (failureCount, error) => {
                // Never retry auth errors or "not found" — retrying won't help
                if (isApiError(error) && (error.status === 401 || error.status === 403 || error.status === 404)) {
                    return false;
                }
                // Network errors: retry up to 2 times
                if (isApiError(error) && error.status === 0) {
                    return failureCount < 2;
                }
                // Server errors: retry once
                return failureCount < 1;
            },
            refetchOnWindowFocus: false,
        },
        mutations: {
            // Mutations don't retry by default — data mutating operations should not auto-retry
            retry: false,
        },
    },
});

// ─── Providers component ──────────────────────────────────────────────────────

export function Providers({ children }: { children: ReactNode }) {
    return (
        <QueryClientProvider client={queryClient}>
            <AuthProvider>
                {children}
            </AuthProvider>
            <ReactQueryDevtools initialIsOpen={false} />
        </QueryClientProvider>
    );
}
