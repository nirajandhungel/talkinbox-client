import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle, XCircle, AlertTriangle, Info, X, type LucideIcon } from "lucide-react";
import { useToastStore } from "@/store";
import { cn } from "@/lib/utils";
import type { ToastVariant } from "@/types";

const VARIANT_CONFIG: Record<ToastVariant, {
  icon: LucideIcon;
  className: string;
}> = {
  success: { icon: CheckCircle, className: "border-success/20 bg-surface text-success" },
  error: { icon: XCircle, className: "border-error/20 bg-surface text-error" },
  warning: { icon: AlertTriangle, className: "border-warning/20 bg-surface text-warning" },
  info: { icon: Info, className: "border-border bg-surface text-foreground" },
};

export function ToastStack() {
  const { toasts, removeToast } = useToastStore();

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => {
          const config = VARIANT_CONFIG[toast.variant];
          const Icon = config.icon;
          return (
            <motion.div
              key={toast.id}
              layout
              initial={{ opacity: 0, x: 40, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 40, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className={cn(
                "pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl border shadow-card-md",
                "min-w-[280px] max-w-[360px]",
                config.className
              )}
            >
              <Icon size={16} className="shrink-0" />
              <p className="flex-1 text-sm font-medium">{toast.message}</p>
              <button
                onClick={() => removeToast(toast.id)}
                className="shrink-0 opacity-60 hover:opacity-100 transition-opacity"
              >
                <X size={14} />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}

// Convenience hook
export function useToast() {
  const { addToast } = useToastStore();
  return {
    toast: (message: string, variant?: ToastVariant) => addToast(message, variant),
    success: (message: string) => addToast(message, "success"),
    error: (message: string) => addToast(message, "error"),
    warning: (message: string) => addToast(message, "warning"),
    info: (message: string) => addToast(message, "info"),
  };
}
