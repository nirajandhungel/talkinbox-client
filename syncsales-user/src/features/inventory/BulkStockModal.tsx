import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, Minus, Plus, AlertTriangle, Check, Package } from "lucide-react";
import { productsApi } from "@/api";
import { useToast } from "@/components/feedback/Toast";
import { Button } from "@/components/ui/Button";
import { formatCurrency } from "@/lib/utils";
import type { Product } from "@/types";

interface BulkStockModalProps {
  open: boolean;
  onClose: () => void;
  onUpdated: () => void;
  products: Product[];
}

interface StockUpdate {
  productId: string;
  productName: string;
  productImage: string;
  currentStock: number;
  newStock: number;
  cost: number;
}

export function BulkStockModal({ open, onClose, onUpdated, products }: BulkStockModalProps) {
  const { success, error: showError } = useToast();
  const [step, setStep] = useState<1 | 2>(1);
  const [loading, setLoading] = useState(false);

  // Pre-populate with low/critical stock products
  const lowStockProducts = products.filter((p) => p.status === "low" || p.status === "critical" || p.status === "out");

  const [updates, setUpdates] = useState<StockUpdate[]>(
    lowStockProducts.map((p) => ({
      productId: p.id,
      productName: p.name,
      productImage: p.image ?? "",
      currentStock: p.stock,
      newStock: p.stock + 20,
      cost: p.cost,
    }))
  );

  const updateStock = (productId: string, newStock: number) => {
    setUpdates((prev) =>
      prev.map((u) => (u.productId === productId ? { ...u, newStock: Math.max(0, newStock) } : u))
    );
  };

  const removeUpdate = (productId: string) => {
    setUpdates((prev) => prev.filter((u) => u.productId !== productId));
  };

  const totalUnits = updates.reduce((sum, u) => sum + Math.max(0, u.newStock - u.currentStock), 0);
  const estimatedCost = updates.reduce(
    (sum, u) => sum + Math.max(0, u.newStock - u.currentStock) * u.cost,
    0
  );

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await Promise.all(
        updates
          .filter((u) => u.newStock !== u.currentStock)
          .map((u) => productsApi.update(String(u.productId), { stock: u.newStock }))
      );
      success(`Stock updated for ${updates.filter((u) => u.newStock !== u.currentStock).length} products`);
      onUpdated();
      onClose();
    } catch (err) {
      console.error(err);
      showError("Failed to update stock");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-40 flex items-center justify-center bg-black/30 backdrop-blur-sm px-4"
          onClick={(e) => e.target === e.currentTarget && onClose()}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 8 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 8 }}
            transition={{ duration: 0.2 }}
            className="bg-surface rounded-2xl shadow-card-lg w-full max-w-xl max-h-[80vh] flex flex-col"
          >
            {/* Header */}
            <div className="px-5 py-4 border-b border-border flex items-center justify-between shrink-0">
              <div>
                <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                  <Package size={15} className="text-primary" />
                  Bulk Stock Update
                </h3>
                <p className="text-[11px] text-foreground-muted mt-0.5">
                  {step === 1 ? "Adjust stock quantities for multiple products" : "Review and confirm changes"}
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-foreground-muted hover:text-foreground-muted hover:bg-surface-elevated transition-colors"
              >
                <X size={15} />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-5">
              {step === 1 ? (
                <div className="space-y-3">
                  {updates.length === 0 ? (
                    <div className="text-center py-8 text-foreground-muted">
                      <Package size={28} className="mx-auto mb-2" />
                      <p className="text-sm font-medium">All products are well-stocked</p>
                      <p className="text-xs mt-1">No items need restocking right now</p>
                    </div>
                  ) : (
                    updates.map((u) => {
                      const change = u.newStock - u.currentStock;
                      return (
                        <div
                          key={u.productId}
                          className="flex items-center gap-3 p-3 rounded-xl bg-surface-elevated border border-border"
                        >
                          <span className="text-xl">{u.productImage}</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-foreground truncate">{u.productName}</p>
                            <p className="text-[10px] text-foreground-muted">
                              Current: {u.currentStock} · Cost: {formatCurrency(u.cost)}/unit
                            </p>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => updateStock(u.productId, u.newStock - 5)}
                              className="w-7 h-7 rounded-lg bg-surface border border-border flex items-center justify-center text-foreground-muted hover:bg-surface-elevated transition-colors"
                            >
                              <Minus size={12} />
                            </button>
                            <input
                              type="number"
                              value={u.newStock}
                              onChange={(e) => updateStock(u.productId, Number(e.target.value))}
                              className="w-14 h-7 rounded-lg border border-border text-center text-xs font-mono font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                            />
                            <button
                              type="button"
                              onClick={() => updateStock(u.productId, u.newStock + 5)}
                              className="w-7 h-7 rounded-lg bg-surface border border-border flex items-center justify-center text-foreground-muted hover:bg-surface-elevated transition-colors"
                            >
                              <Plus size={12} />
                            </button>
                          </div>
                          {change > 0 && (
                            <span className="text-[10px] font-bold text-success min-w-[40px] text-right">
                              +{change}
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={() => removeUpdate(u.productId)}
                            className="p-1 text-foreground-muted hover:text-error transition-colors"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      );
                    })
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="bg-primary/10 border border-primary/20 rounded-xl p-4">
                    <p className="text-xs font-semibold text-primary-800 mb-3">Update Summary</p>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <p className="text-[10px] text-primary uppercase tracking-wider font-medium">Total Units</p>
                        <p className="text-lg font-bold text-primary-800 font-mono">{totalUnits}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-primary uppercase tracking-wider font-medium">Est. Cost</p>
                        <p className="text-lg font-bold text-primary-800 font-mono">{formatCurrency(estimatedCost)}</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {updates
                      .filter((u) => u.newStock !== u.currentStock)
                      .map((u) => (
                        <div key={u.productId} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                          <div className="flex items-center gap-2">
                            <span className="text-base">{u.productImage}</span>
                            <span className="text-xs font-medium text-foreground">{u.productName}</span>
                          </div>
                          <div className="text-xs font-mono">
                            <span className="text-foreground-muted">{u.currentStock}</span>
                            <span className="text-foreground-muted mx-1">→</span>
                            <span className="font-bold text-primary">{u.newStock}</span>
                          </div>
                        </div>
                      ))}
                  </div>

                  <div className="flex items-start gap-2 p-3 bg-warning/10 border border-warning/20 rounded-xl">
                    <AlertTriangle size={14} className="text-warning mt-0.5 shrink-0" />
                    <p className="text-[11px] text-warning">
                      This will update stock quantities for{" "}
                      {updates.filter((u) => u.newStock !== u.currentStock).length} products.
                      This action will be logged in your activity feed.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-5 py-4 border-t border-border flex items-center justify-between shrink-0">
              <div className="text-xs text-foreground-muted">
                {totalUnits > 0 && (
                  <span>
                    +{totalUnits} units · {formatCurrency(estimatedCost)} estimated
                  </span>
                )}
              </div>
              <div className="flex gap-2">
                {step === 2 && (
                  <Button variant="outline" size="sm" onClick={() => setStep(1)}>
                    Back
                  </Button>
                )}
                <Button variant="outline" size="sm" onClick={onClose}>
                  Cancel
                </Button>
                {step === 1 ? (
                  <Button
                    size="sm"
                    onClick={() => setStep(2)}
                    disabled={updates.filter((u) => u.newStock !== u.currentStock).length === 0}
                  >
                    Review Changes
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    icon={<Check size={13} />}
                    onClick={handleConfirm}
                    loading={loading}
                  >
                    Confirm Update
                  </Button>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
