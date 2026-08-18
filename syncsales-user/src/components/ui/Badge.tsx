import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

interface BadgeProps {
  children: ReactNode;
  color?: string;
  bg?: string;
  className?: string;
  size?: "sm" | "md";
}

export function Badge({ children, color, bg, className, size = "sm" }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center font-medium rounded-full",
        size === "sm" ? "px-2 py-0.5 text-xs" : "px-2.5 py-1 text-xs",
        className
      )}
      style={color && bg ? { color, backgroundColor: bg } : undefined}
    >
      {children}
    </span>
  );
}

interface StatusBadgeProps {
  config: { label: string; color: string; bg: string };
  className?: string;
}

export function StatusBadge({ config, className }: StatusBadgeProps) {
  return (
    <Badge color={config.color} bg={config.bg} className={className}>
      {config.label}
    </Badge>
  );
}
