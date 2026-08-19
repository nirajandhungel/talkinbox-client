import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

export type BadgeTone = "success" | "warning" | "error" | "info" | "muted" | "primary";

const TONE_CLASSES: Record<BadgeTone, string> = {
  success: "tone-success",
  warning: "tone-warning",
  error: "tone-error",
  info: "tone-info",
  muted: "tone-muted",
  primary: "tone-primary",
};

interface BadgeProps {
  children: ReactNode;
  tone?: BadgeTone;
  color?: string;
  bg?: string;
  className?: string;
  size?: "sm" | "md";
}

export function Badge({ children, tone, color, bg, className, size = "sm" }: BadgeProps) {
  const mixedBg = color && !bg
    ? `color-mix(in srgb, ${color} 14%, transparent)`
    : bg;

  return (
    <span
      className={cn(
        "inline-flex items-center font-medium rounded-full",
        size === "sm" ? "px-2 py-0.5 text-xs" : "px-2.5 py-1 text-xs",
        tone && TONE_CLASSES[tone],
        className
      )}
      style={!tone && color ? { color, backgroundColor: mixedBg } : undefined}
    >
      {children}
    </span>
  );
}

interface StatusBadgeProps {
  config: { label: string; tone?: BadgeTone; color?: string; bg?: string };
  className?: string;
}

export function StatusBadge({ config, className }: StatusBadgeProps) {
  return (
    <Badge tone={config.tone} color={config.color} bg={config.bg} className={className}>
      {config.label}
    </Badge>
  );
}
