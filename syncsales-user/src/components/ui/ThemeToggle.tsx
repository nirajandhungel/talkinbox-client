import { Moon, Sun } from "lucide-react";
import { useUIStore } from "@/store";
import { cn } from "@/lib/utils";

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, toggleTheme } = useUIStore();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={cn(
        "p-1.5 sm:p-2 rounded-lg text-foreground-muted hover:text-foreground hover:bg-surface-elevated transition-colors",
        className
      )}
      aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
      title={theme === "dark" ? "Light mode" : "Dark mode"}
    >
      {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
    </button>
  );
}

export function ThemePicker() {
  const { theme, setTheme } = useUIStore();

  return (
    <div className="grid grid-cols-2 gap-3">
      {([
        { id: "dark" as const, label: "Dark", desc: "True black + electric green" },
        { id: "light" as const, label: "Light", desc: "Off-white + darker green" },
      ]).map((opt) => {
        const selected = theme === opt.id;
        return (
          <button
            key={opt.id}
            type="button"
            onClick={() => setTheme(opt.id)}
            className={cn(
              "rounded-xl border p-3 text-left transition-colors",
              selected
                ? "border-primary bg-primary-soft"
                : "border-border bg-surface hover:border-primary/40"
            )}
          >
            <div
              className={cn(
                "h-16 rounded-lg mb-3 border overflow-hidden",
                opt.id === "dark" ? "bg-black border-[#1C2A21]" : "bg-[#F8FAF9] border-[#DDE5E0]"
              )}
            >
              <div className={cn("h-4 border-b", opt.id === "dark" ? "bg-[#080B09] border-[#1C2A21]" : "bg-white border-[#DDE5E0]")} />
              <div className="p-2 flex gap-1.5">
                <div className={cn("h-8 flex-1 rounded", opt.id === "dark" ? "bg-[#111512]" : "bg-white border border-[#DDE5E0]")} />
                <div className="w-8 h-8 rounded bg-primary" />
              </div>
            </div>
            <p className={cn("text-xs font-semibold", selected ? "text-primary" : "text-foreground")}>
              {opt.label}
            </p>
            <p className="text-[10px] text-foreground-muted mt-0.5">{opt.desc}</p>
          </button>
        );
      })}
    </div>
  );
}
