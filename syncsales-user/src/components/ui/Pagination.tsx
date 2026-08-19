import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { PAGE_SIZE_OPTIONS } from "@/constants";

interface PaginationProps {
  page: number;
  totalPages: number;
  total: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  showPageSizeSelector?: boolean;
  className?: string;
}

export function Pagination({
  page,
  totalPages,
  total,
  pageSize,
  onPageChange,
  onPageSizeChange,
  showPageSizeSelector = true,
  className,
}: PaginationProps) {
  const from = Math.min((page - 1) * pageSize + 1, total);
  const to = Math.min(page * pageSize, total);

  const getPageNumbers = () => {
    const delta = 1;
    const range: (number | "...")[] = [];
    for (let i = Math.max(2, page - delta); i <= Math.min(totalPages - 1, page + delta); i++) {
      range.push(i);
    }
    if (page - delta > 2) range.unshift("...");
    if (page + delta < totalPages - 1) range.push("...");
    if (totalPages > 1) range.unshift(1);
    if (totalPages > 1) range.push(totalPages);
    return range;
  };

  if (totalPages <= 1 && total <= pageSize) return null;

  return (
    <div className={cn("flex flex-col sm:flex-row items-center justify-between gap-2 sm:gap-4 px-1", className)}>
      <div className="flex items-center gap-3">
        <p className="text-xs text-foreground-muted">
          {from}–{to} of {total} results
        </p>
        {showPageSizeSelector && onPageSizeChange && (
          <select
            value={pageSize}
            onChange={(e) => {
              onPageSizeChange(Number(e.target.value));
              onPageChange(1);
            }}
            className="text-xs border border-border rounded-lg px-2 py-1 text-foreground-muted bg-surface focus:outline-none focus:ring-2 focus:ring-primary/20 hidden sm:block"
          >
            {PAGE_SIZE_OPTIONS.map((size) => (
              <option key={size} value={size}>{size} / page</option>
            ))}
          </select>
        )}
      </div>

      <div className="flex items-center gap-1">
        <NavButton onClick={() => onPageChange(1)} disabled={page === 1} aria-label="First page" className="hidden sm:flex">
          <ChevronsLeft size={14} />
        </NavButton>
        <NavButton onClick={() => onPageChange(page - 1)} disabled={page === 1} aria-label="Previous page">
          <ChevronLeft size={14} />
        </NavButton>

        {getPageNumbers().map((p, i) =>
          p === "..." ? (
            <span key={`ellipsis-${i}`} className="px-2 text-foreground-muted text-xs hidden sm:inline">…</span>
          ) : (
            <NavButton
              key={p}
              onClick={() => onPageChange(p as number)}
              active={page === p}
              aria-label={`Page ${p}`}
              aria-current={page === p ? "page" : undefined}
              className="hidden sm:flex"
            >
              {p}
            </NavButton>
          )
        )}
        {/* Mobile: show current page */}
        <span className="text-xs font-medium text-foreground-muted sm:hidden">{page} / {totalPages}</span>

        <NavButton onClick={() => onPageChange(page + 1)} disabled={page === totalPages} aria-label="Next page">
          <ChevronRight size={14} />
        </NavButton>
        <NavButton onClick={() => onPageChange(totalPages)} disabled={page === totalPages} aria-label="Last page" className="hidden sm:flex">
          <ChevronsRight size={14} />
        </NavButton>
      </div>
    </div>
  );
}

interface NavButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean;
  children: React.ReactNode;
}

function NavButton({ active, children, disabled, className, ...props }: NavButtonProps) {
  return (
    <button
      className={cn(
        "min-w-[28px] h-7 flex items-center justify-center rounded-lg text-xs font-medium transition-colors",
        active
          ? "bg-primary text-primary-foreground"
          : "text-foreground-muted hover:bg-surface-elevated disabled:opacity-40 disabled:cursor-not-allowed",
        className
      )}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}
