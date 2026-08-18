import { cn } from "@/lib/utils";

interface AvatarProps {
  name?: string;
  initials?: string;
  src?: string;
  size?: "xs" | "sm" | "md" | "lg";
  color?: string;
  className?: string;
}

const sizeClasses = {
  xs: "w-6 h-6 text-[10px]",
  sm: "w-8 h-8 text-xs",
  md: "w-10 h-10 text-sm",
  lg: "w-12 h-12 text-base",
};

const colors = [
  "bg-primary-600", "bg-blue-500", "bg-purple-500",
  "bg-rose-500", "bg-amber-500", "bg-teal-500",
];

function getColorFromName(name: string): string {
  const index = name.charCodeAt(0) % colors.length;
  return colors[index];
}

export function Avatar({ name, initials, src, size = "sm", color, className }: AvatarProps) {
  const displayInitials = initials ?? (name ? name.split(" ").slice(0, 2).map(n => n[0]).join("").toUpperCase() : "?");
  const bgColor = color ?? (name ? getColorFromName(name) : "bg-slate-400");

  if (src) {
    return (
      <img
        src={src}
        alt={name ?? "Avatar"}
        className={cn("rounded-full object-cover", sizeClasses[size], className)}
      />
    );
  }

  return (
    <div
      className={cn(
        "rounded-full flex items-center justify-center text-white font-semibold shrink-0",
        sizeClasses[size],
        bgColor,
        className
      )}
    >
      {displayInitials}
    </div>
  );
}
