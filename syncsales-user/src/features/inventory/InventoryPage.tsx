import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, Plus, Trash2, Package, AlertTriangle, Edit2,
  Grid3X3, List, ArrowUpDown, RefreshCcw
} from "lucide-react";
import { productsApi } from "@/api";
import { QUERY_KEYS, STOCK_STATUS_CONFIG } from "@/constants";
import { formatCurrency } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { useSearch, usePagination, useSelectedRows } from "@/hooks";
import { Card } from "@/components/ui/Card";
import { Input, Select } from "@/components/ui/Input";
import { StatusBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Pagination } from "@/components/ui/Pagination";
import { SkeletonTable } from "@/components/feedback/Skeleton";
import { EmptyState } from "@/components/feedback/EmptyState";
import { useToast } from "@/components/feedback/Toast";
import { useConfirmDialog } from "@/store";
import { ProductModal } from "./ProductModal";
import { BulkStockModal } from "./BulkStockModal";
import type { Product } from "@/types";

const CATEGORY_OPTIONS = [
  { label: "All Categories", value: "" },
  { label: "Kurti", value: "Kurti" },
  { label: "Set", value: "Set" },
  { label: "Jacket", value: "Jacket" },
  { label: "Suit", value: "Suit" },
  { label: "Dupatta", value: "Dupatta" },
  { label: "Saree", value: "Saree" },
  { label: "Gown", value: "Gown" },
  { label: "Shawl", value: "Shawl" },
  { label: "Lehenga", value: "Lehenga" },
];

const STATUS_OPTIONS = [
  { label: "All Status", value: "" },
  { label: "In Stock", value: "active" },
  { label: "Low Stock", value: "low" },
  { label: "Critical", value: "critical" },
  { label: "Out of Stock", value: "out" },
];


type ViewMode = "grid" | "table";
type SortKey = "name" | "price" | "stock" | "sold";

export default function InventoryPage() {
  const [categoryFilter, setCategoryFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [sortBy, setSortBy] = useState<SortKey>("name");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [viewMode, setViewMode] = useState<ViewMode>("table");
  const { search, setSearch, debouncedSearch } = useSearch();
  const { page, pageSize, setPage, setPageSize } = usePagination();
  const { selected, toggle, toggleAll, clear, count: selectedCount } = useSelectedRows<Product>();
  const { success, error: showError } = useToast();
  const { confirm } = useConfirmDialog();
  const queryClient = useQueryClient();

  // Modal states
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [bulkStockOpen, setBulkStockOpen] = useState(false);

  // Fetch all products (for client-side filtering/sorting like V2)
  const { data, isLoading } = useQuery({
    queryKey: [...QUERY_KEYS.products, { page: 1, pageSize: 100, search: debouncedSearch }],
    queryFn: () => productsApi.getAll({ page: 1, pageSize: 100, search: debouncedSearch }),
  });

  const deleteMutation = useMutation({
    mutationFn: productsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.products });
      success("Product deleted successfully");
    },
    onError: () => showError("Failed to delete product"),
  });

  const allProducts = data?.data ?? [];

  // Filter & sort client-side (matching V2 pattern)
  const filtered = useMemo(() => {
    let result = [...allProducts];

    // Category filter
    if (categoryFilter) {
      result = result.filter((p) => p.category === categoryFilter);
    }

    // Status filter
    if (statusFilter) {
      result = result.filter((p) => p.status === statusFilter);
    }

    // Sort
    result.sort((a, b) => {
      const aVal = a[sortBy];
      const bVal = b[sortBy];
      if (typeof aVal === "string" && typeof bVal === "string") {
        return sortDir === "asc" ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }
      return sortDir === "asc"
        ? (aVal as number) - (bVal as number)
        : (bVal as number) - (aVal as number);
    });

    return result;
  }, [allProducts, categoryFilter, statusFilter, sortBy, sortDir]);

  // Paginate
  const totalPages = Math.ceil(filtered.length / pageSize);
  const paged = filtered.slice((page - 1) * pageSize, page * pageSize);

  const handleSort = (col: SortKey) => {
    if (sortBy === col) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(col);
      setSortDir("asc");
    }
  };

  const handleDeleteSelected = () => {
    confirm({
      title: "Delete selected products?",
      description: `This will permanently delete ${selectedCount} product${selectedCount !== 1 ? "s" : ""}. This action cannot be undone.`,
      variant: "danger",
      onConfirm: () => {
        selected.forEach((id) => deleteMutation.mutate(String(id)));
        clear();
      },
    });
  };

  const handleDelete = (product: Product) => {
    confirm({
      title: `Delete "${product.name}"?`,
      description: "This will permanently remove this product from your inventory.",
      variant: "danger",
      onConfirm: () => deleteMutation.mutate(product.id),
    });
  };

  const handleEdit = (product: Product) => {
    setEditProduct(product);
    setProductModalOpen(true);
  };

  const handleAddNew = () => {
    setEditProduct(null);
    setProductModalOpen(true);
  };

  const handleProductSaved = () => {
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.products });
  };

  const allSelected = paged.length > 0 && paged.every((p) => selected.has(p.id));

  // Stock summary KPIs
  const stockSummary = useMemo(() => {
    const total = allProducts.length;
    const low = allProducts.filter((p) => p.status === "low").length;
    const critical = allProducts.filter((p) => p.status === "critical").length;
    const out = allProducts.filter((p) => p.status === "out").length;
    const totalValue = allProducts.reduce((s, p) => s + p.price * p.stock, 0);
    return { total, low, critical, out, totalValue };
  }, [allProducts]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="space-y-4 max-w-[1200px]"
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-foreground">Inventory</h2>
          <p className="text-[11px] sm:text-xs text-foreground-muted">
            {stockSummary.total} products · {formatCurrency(stockSummary.totalValue)} total value
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            icon={<RefreshCcw size={13} />}
            onClick={() => setBulkStockOpen(true)}
            className="hidden sm:inline-flex"
          >
            Bulk Restock
          </Button>
          <Button size="sm" icon={<Plus size={13} />} onClick={handleAddNew}>
            <span className="hidden sm:inline">Add Product</span>
            <span className="sm:hidden">Add</span>
          </Button>
        </div>
      </div>

      {/* Stock KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total Products", value: stockSummary.total, icon: "📦", tone: "success" as const },
          { label: "Low Stock", value: stockSummary.low, icon: "⚠️", tone: "warning" as const, filter: "low" },
          { label: "Critical", value: stockSummary.critical, icon: "🔴", tone: "error" as const, filter: "critical" },
          { label: "Out of Stock", value: stockSummary.out, icon: "⛔", tone: "muted" as const, filter: "out" },
        ].map((kpi) => (
          <motion.div key={kpi.label} whileHover={{ y: -1 }} whileTap={{ scale: 0.98 }}>
            <Card
              hoverable
              onClick={() => {
                if ("filter" in kpi && kpi.filter) {
                  setStatusFilter(statusFilter === kpi.filter ? "" : kpi.filter);
                  setPage(1);
                }
              }}
              className={`transition-all ${
                "filter" in kpi && statusFilter === kpi.filter
                  ? "ring-2 ring-primary ring-offset-1 border-primary/30"
                  : ""
              }`}
              padding="sm"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-medium text-foreground-muted uppercase tracking-wider">{kpi.label}</p>
                  <p className="text-2xl font-bold text-foreground font-mono mt-1">{kpi.value}</p>
                </div>
                <div className={cn(
                  "w-9 h-9 rounded-xl flex items-center justify-center text-base",
                  kpi.tone === "success" && "bg-success/10",
                  kpi.tone === "warning" && "bg-warning/10",
                  kpi.tone === "error" && "bg-error/10",
                  kpi.tone === "muted" && "bg-surface-elevated",
                )}>
                  {kpi.icon}
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Bulk actions */}
      <AnimatePresence>
        {selectedCount > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="flex items-center gap-3 bg-primary/10 border border-primary/20 rounded-xl px-4 py-2.5"
          >
            <span className="text-xs font-semibold text-primary-hover">{selectedCount} selected</span>
            <div className="flex-1" />
            <Button variant="ghost" size="xs" onClick={clear}>Deselect all</Button>
            <Button variant="danger" size="xs" icon={<Trash2 size={12} />} onClick={handleDeleteSelected}>
              Delete selected
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Filters & View Toggle */}
      <Card padding="sm">
        <div className="flex flex-wrap gap-2 sm:gap-3 items-center">
          <Input
            placeholder="Search products..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            prefix={<Search size={13} />}
            containerClassName="flex-1 min-w-[140px] sm:min-w-[200px]"
          />
          <Select
            options={CATEGORY_OPTIONS}
            value={categoryFilter}
            onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }}
            containerClassName="w-full sm:w-40"
          />
          <Select
            options={STATUS_OPTIONS}
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            containerClassName="w-full sm:w-36"
          />
          <div className="hidden sm:flex items-center gap-1 bg-surface-elevated rounded-lg p-0.5">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-1.5 rounded-md transition-colors ${viewMode === "grid" ? "bg-surface shadow-sm text-primary" : "text-foreground-muted hover:text-foreground-muted"}`}
            >
              <Grid3X3 size={14} />
            </button>
            <button
              onClick={() => setViewMode("table")}
              className={`p-1.5 rounded-md transition-colors ${viewMode === "table" ? "bg-surface shadow-sm text-primary" : "text-foreground-muted hover:text-foreground-muted"}`}
            >
              <List size={14} />
            </button>
          </div>
        </div>
      </Card>

      {/* Content */}
      {isLoading ? (
        <SkeletonTable rows={8} />
      ) : paged.length === 0 ? (
        <Card>
          <EmptyState
            icon={<Package size={28} />}
            title="No products found"
            description={search || categoryFilter || statusFilter
              ? "Try adjusting your filters."
              : "Add your first product to get started."}
            action={<Button size="sm" icon={<Plus size={13} />} onClick={handleAddNew}>Add Product</Button>}
          />
        </Card>
      ) : viewMode === "grid" ? (
        /* ─── Grid View ──────────────────────────────────── */
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {paged.map((product) => {
              const statusCfg = STOCK_STATUS_CONFIG[product.status];
              return (
                <motion.div
                  key={product.id}
                  whileHover={{ y: -2 }}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                >
                  <Card
                    hoverable
                    onClick={() => handleEdit(product)}
                    className="group overflow-hidden"
                    padding="none"
                  >
                    <div className="p-4 pb-2 text-center">
                      <div className="text-4xl mb-2">{product.image}</div>
                      <p className="text-xs font-semibold text-foreground truncate">{product.name}</p>
                      <p className="text-[10px] text-foreground-muted font-mono">{product.sku}</p>
                    </div>
                    <div className="px-4 pb-3 flex items-center justify-between">
                      <span className="text-sm font-bold text-primary font-mono">
                        {formatCurrency(product.price)}
                      </span>
                      <span className="text-[10px] text-foreground-muted">{product.stock} left</span>
                    </div>
                    <div className="px-4 pb-3">
                      <div className="h-1.5 bg-surface-elevated rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${Math.min((product.stock / 50) * 100, 100)}%`,
                            backgroundColor:
                              product.stock === 0 ? "#6B7280" :
                              product.stock < 5 ? "#EF4444" :
                              product.stock < 10 ? "#F59E0B" : "#006D5B",
                          }}
                        />
                      </div>
                    </div>
                    <div className="px-4 pb-4 flex items-center justify-between">
                      <StatusBadge config={statusCfg} />
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => { e.stopPropagation(); handleEdit(product); }}
                          className="p-1 rounded text-foreground-muted hover:text-primary hover:bg-primary/10 transition-colors"
                        >
                          <Edit2 size={11} />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDelete(product); }}
                          className="p-1 rounded text-foreground-muted hover:text-error hover:bg-error/10 transition-colors"
                        >
                          <Trash2 size={11} />
                        </button>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </div>
          <Pagination
            page={page}
            totalPages={totalPages}
            total={filtered.length}
            pageSize={pageSize}
            onPageChange={setPage}
            onPageSizeChange={(size) => { setPageSize(size); setPage(1); }}
          />
        </>
      ) : (
        /* ─── Table View ─────────────────────────────────── */
        <Card padding="none">
          <div className="overflow-x-auto">
            <table className="w-full mobile-card-table">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-4 py-3 w-10">
                    <input
                      type="checkbox"
                      checked={allSelected}
                      onChange={() => toggleAll(paged)}
                      className="rounded"
                    />
                  </th>
                  {([
                    ["Product", "name"],
                    ["SKU", null],
                    ["Category", null],
                    ["Price", "price"],
                    ["Cost", null],
                    ["Stock", "stock"],
                    ["Sold", "sold"],
                    ["Status", null],
                    ["", null],
                  ] as const).map(([label, sortKey]) => (
                    <th
                      key={label || "actions"}
                      className={`px-4 py-3 text-left text-[10px] font-semibold text-foreground-muted uppercase tracking-wider ${sortKey ? "cursor-pointer hover:text-foreground-muted select-none" : ""}`}
                      onClick={() => sortKey && handleSort(sortKey as SortKey)}
                    >
                      <span className="inline-flex items-center gap-1">
                        {label}
                        {sortKey && sortBy === sortKey && (
                          <ArrowUpDown size={10} className="text-primary-500" />
                        )}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                  {paged.map((product, i) => {
                    const statusCfg = STOCK_STATUS_CONFIG[product.status];
                    const isSelected = selected.has(product.id);
                    return (
                      <tr
                        key={product.id}
                        onClick={() => handleEdit(product)}
                        className={`${i < paged.length - 1 ? "md:border-b md:border-border" : ""} hover:bg-surface-elevated/80 transition-colors cursor-pointer group ${isSelected ? "bg-primary/10" : ""}`}
                      >
                        <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggle(product.id)}
                            className="rounded"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            <span className="text-xl">{product.image}</span>
                            <div>
                              <p className="text-xs font-semibold text-foreground">{product.name}</p>
                              <p className="text-[10px] text-foreground-muted">{product.variants.join(", ")}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-xs text-foreground-muted font-mono hidden md:table-cell">{product.sku}</td>
                        <td className="px-4 py-3 text-xs text-foreground-muted hidden lg:table-cell">{product.category}</td>
                        <td className="px-4 py-3 text-xs font-semibold text-primary font-mono">
                          {formatCurrency(product.price)}
                        </td>
                        <td className="px-4 py-3 text-xs text-foreground-muted hidden lg:table-cell">{formatCurrency(product.cost)}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1">
                            {product.stock <= 5 && product.stock > 0 && (
                              <AlertTriangle size={10} className="text-warning" />
                            )}
                            <span className={`text-xs font-bold font-mono ${
                              product.stock === 0 ? "text-foreground-muted" :
                              product.stock <= 5 ? "text-warning" : "text-foreground"
                            }`}>
                              {product.stock}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-xs text-foreground-muted font-mono hidden md:table-cell">{product.sold}</td>
                        <td className="px-4 py-3">
                          <StatusBadge config={statusCfg} />
                        </td>
                        <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => handleEdit(product)}
                              className="p-1.5 rounded-lg text-foreground-muted hover:text-primary hover:bg-primary/10 transition-colors"
                            >
                              <Edit2 size={13} />
                            </button>
                            <button
                              onClick={() => handleDelete(product)}
                              className="p-1.5 rounded-lg text-foreground-muted hover:text-error hover:bg-error/10 transition-colors"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-3 border-t border-border">
            <Pagination
              page={page}
              totalPages={totalPages}
              total={filtered.length}
              pageSize={pageSize}
              onPageChange={setPage}
              onPageSizeChange={(size) => { setPageSize(size); setPage(1); }}
            />
          </div>
        </Card>
      )}

      {/* Modals */}
      <ProductModal
        open={productModalOpen}
        onClose={() => { setProductModalOpen(false); setEditProduct(null); }}
        onSaved={handleProductSaved}
        product={editProduct}
      />

      <BulkStockModal
        open={bulkStockOpen}
        onClose={() => setBulkStockOpen(false)}
        onUpdated={handleProductSaved}
        products={allProducts}
      />
    </motion.div>
  );
}
