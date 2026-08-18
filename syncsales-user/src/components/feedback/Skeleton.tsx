import { cn } from "@/lib/utils";

interface SkeletonProps {
  className?: string;
  width?: string | number;
  height?: string | number;
}

export function Skeleton({ className, width, height }: SkeletonProps) {
  return (
    <div
      className={cn("skeleton rounded", className)}
      style={{ width, height: height ?? 16 }}
    />
  );
}

export function SkeletonCard() {
  return (
    <div className="bg-white rounded-xl border border-slate-100 p-5 space-y-3">
      <Skeleton width={120} height={14} />
      <Skeleton width={80} height={28} />
      <Skeleton width={100} height={12} />
    </div>
  );
}

export function SkeletonRow() {
  return (
    <div className="flex items-center gap-4 py-3 px-4 border-b border-slate-50">
      <Skeleton className="rounded-full" width={36} height={36} />
      <div className="flex-1 space-y-2">
        <Skeleton width="40%" height={13} />
        <Skeleton width="60%" height={11} />
      </div>
      <Skeleton width={80} height={24} className="rounded-full" />
    </div>
  );
}

export function SkeletonTable({ rows = 5 }: { rows?: number }) {
  return (
    <div className="bg-white rounded-xl border border-slate-100 overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-100 flex gap-8">
        {[100, 160, 120, 90, 80].map((w, i) => (
          <Skeleton key={i} width={w} height={13} />
        ))}
      </div>
      {Array.from({ length: rows }, (_, i) => (
        <SkeletonRow key={i} />
      ))}
    </div>
  );
}
