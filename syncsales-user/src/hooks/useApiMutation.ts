/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  useApiMutation — Wraps useMutation with production-grade error handling
 * ─────────────────────────────────────────────────────────────────────────────
 *
 *  Automatically:
 *  - Shows a toast for API errors
 *  - Shows a custom success toast on success
 *  - Avoids re-throwing unless the caller needs it
 *
 *  Usage:
 *    const { mutate, isPending } = useApiMutation(ordersApi.cancel, {
 *      onSuccess: () => success("Order cancelled"),
 *      errorMessage: "Failed to cancel order",  // fallback if error has no message
 *    });
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { useMutation, useQueryClient, type UseMutationResult } from "@tanstack/react-query";
import { getErrorMessage, getFieldErrors, isApiError } from "@/api/client";
import { useToast } from "@/components/feedback/Toast";
import { useNavigate } from "react-router-dom";

interface UseApiMutationOptions<TData, TVariables> {
    /** Called when the mutation succeeds */
    onSuccess?: (data: TData, variables: TVariables) => void | Promise<void>;
    /** Called when the mutation fails (after toast is shown) */
    onError?: (error: unknown) => void;
    /** Optional query keys to invalidate on success */
    invalidate?: unknown[][];
    /** Fallback error message if the API doesn't return one */
    errorMessage?: string;
    /** Toast shown on success (optional) */
    successMessage?: string | ((data: TData) => string);
}

export function useApiMutation<TData, TVariables>(
    mutationFn: (vars: TVariables) => Promise<TData>,
    options: UseApiMutationOptions<TData, TVariables> = {}
): UseMutationResult<TData, unknown, TVariables> & {
    fieldErrors: Record<string, string[]>;
} {
    const { success, error: showError } = useToast();
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const result = useMutation<TData, unknown, TVariables>({
        mutationFn,
        onSuccess: async (data, variables) => {
            // Invalidate provided query keys
            if (options.invalidate) {
                await Promise.all(
                    options.invalidate.map((key) =>
                        queryClient.invalidateQueries({ queryKey: key })
                    )
                );
            }

            // Show success toast
            if (options.successMessage) {
                const msg =
                    typeof options.successMessage === "function"
                        ? options.successMessage(data)
                        : options.successMessage;
                success(msg);
            }

            // Call caller's onSuccess
            await options.onSuccess?.(data, variables);
        },
        onError: (err) => {
            // Handle 401 — redirect to login
            if (isApiError(err) && err.status === 401) {
                void navigate("/login", { replace: true });
                return;
            }

            // Show error toast with safe message
            const msg = options.errorMessage
                ? `${options.errorMessage}: ${getErrorMessage(err)}`
                : getErrorMessage(err);
            showError(msg);

            options.onError?.(err);
        },
    });

    return {
        ...result,
        fieldErrors: getFieldErrors(result.error),
    };
}
