import { Zap } from "lucide-react";
import { type ReactNode } from "react";
import { cn } from "@/lib/utils";

export function BrandMark({ size = "md", inverted = false }: { size?: "sm" | "md"; inverted?: boolean }) {
  const box = size === "sm" ? "w-8 h-8" : "w-9 h-9";
  const icon = size === "sm" ? 15 : 18;
  const text = size === "sm" ? "text-lg" : "text-xl";

  return (
    <div className="flex items-center gap-2.5">
      <div className={cn(box, "rounded-xl bg-primary flex items-center justify-center shrink-0")}>
        <Zap size={icon} className="text-primary-foreground" />
      </div>
      <span className={cn(text, "font-bold", inverted ? "text-primary-foreground" : "text-foreground")}>
        Sync<span className="text-primary">Sales</span>
      </span>
    </div>
  );
}

export function AuthShell({
  children,
  maxWidth = "md",
}: {
  children: ReactNode;
  maxWidth?: "sm" | "md" | "lg" | "xl";
}) {
  const width = { sm: "max-w-sm", md: "max-w-md", lg: "max-w-lg", xl: "max-w-2xl" }[maxWidth];

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-8">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
      </div>
      <div className={cn("relative w-full", width)}>{children}</div>
    </div>
  );
}

export function AuthCard({ children }: { children: ReactNode }) {
  return (
    <div className="bg-surface rounded-2xl border border-border shadow-card-lg overflow-hidden">
      {children}
    </div>
  );
}

export function AuthHeader({
  title,
  subtitle,
  children,
  centered = true,
}: {
  title?: string;
  subtitle?: ReactNode;
  children?: ReactNode;
  centered?: boolean;
}) {
  return (
    <div className={cn(
      "bg-surface-elevated px-8 py-7 border-b border-border",
      centered && "text-center"
    )}>
      <div className={cn("mb-3", centered ? "flex justify-center" : "")}>
        <BrandMark />
      </div>
      {title && <h1 className="text-foreground font-bold text-xl">{title}</h1>}
      {subtitle && <div className="text-foreground-muted text-sm mt-1">{subtitle}</div>}
      {children}
    </div>
  );
}

export function AuthAlert({
  children,
  variant = "error",
}: {
  children: ReactNode;
  variant?: "error" | "warning" | "info" | "success";
}) {
  return (
    <div className={cn(
      "flex items-start gap-2.5 rounded-lg px-3.5 py-3 text-xs",
      variant === "error" && "alert-error",
      variant === "warning" && "alert-warning",
      variant === "info" && "alert-info",
      variant === "success" && "alert-success",
    )}>
      {children}
    </div>
  );
}
