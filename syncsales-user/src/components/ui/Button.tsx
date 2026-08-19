import { cn } from "@/lib/utils";
import { type ReactNode, type ButtonHTMLAttributes } from "react";
import { Loader2 } from "lucide-react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger" | "outline";
  size?: "xs" | "sm" | "md" | "lg";
  loading?: boolean;
  icon?: ReactNode;
  iconPosition?: "left" | "right";
  children?: ReactNode;
}

const variantClasses = {
  primary: "bg-primary text-primary-foreground hover:bg-primary-hover shadow-sm",
  secondary: "bg-surface-elevated text-foreground hover:bg-border",
  ghost: "text-foreground-muted hover:bg-surface-elevated hover:text-foreground",
  danger: "bg-error text-white hover:bg-error/90 shadow-sm",
  outline: "border border-border text-foreground hover:bg-surface-elevated",
};

const sizeClasses = {
  xs: "px-2 py-1 text-xs gap-1",
  sm: "px-3 py-1.5 text-xs gap-1.5",
  md: "px-4 py-2 text-sm gap-2",
  lg: "px-5 py-2.5 text-sm gap-2",
};

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  icon,
  iconPosition = "left",
  children,
  className,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center font-medium rounded-lg transition-colors duration-150",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <Loader2 size={14} className="animate-spin" />
      ) : (
        iconPosition === "left" && icon
      )}
      {children}
      {!loading && iconPosition === "right" && icon}
    </button>
  );
}
