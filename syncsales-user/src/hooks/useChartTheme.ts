import { useMemo } from "react";
import { useUIStore } from "@/store";

function token(name: string, fallback: string): string {
  if (typeof document === "undefined") return fallback;
  const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  if (!value) return fallback;
  if (/^\d+(\s+\d+){2}/.test(value)) return `rgb(${value})`;
  return value;
}

export function useChartTheme() {
  const theme = useUIStore((s) => s.theme);

  return useMemo(() => {
    const primary = token("--primary", theme === "dark" ? "#00FF59" : "#00C94A");
    const border = token("--border", theme === "dark" ? "#1C2A21" : "#DDE5E0");
    const muted = token("--foreground-muted", theme === "dark" ? "#A7B0AA" : "#66716A");
    const surface = token("--surface", theme === "dark" ? "#080B09" : "#FFFFFF");
    const foreground = token("--foreground", theme === "dark" ? "#FFFFFF" : "#0B0F0C");
    const warning = token("--warning", "#FFB020");

    return {
      primary,
      border,
      muted,
      surface,
      foreground,
      warning,
      grid: border,
      tick: { fontSize: 11, fill: muted },
      tickSmall: { fontSize: 10, fill: muted },
      tooltip: {
        fontSize: 12,
        borderRadius: 8,
        border: `1px solid ${border}`,
        background: surface,
        color: foreground,
      },
    };
  }, [theme]);
}
