import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, Plus, AlertCircle } from "lucide-react";
import { productsApi } from "@/api";
import { apiClient } from "@/api/client";
import { useToast } from "@/components/feedback/Toast";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Input";
import { getErrorMessage, isApiError } from "@/api/client";
import type { Product, StockStatus } from "@/types";

const EMOJI_OPTIONS = ["🌺", "👗", "🧥", "👘", "🧣", "🩱", "👚", "🌸", "🧤", "🌿", "💛", "👔", "👕", "🎀", "🧶", "💎"];

const CATEGORY_OPTIONS = [
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

const VARIANT_PRESETS = ["XS", "S", "M", "L", "XL", "XXL", "One Size"];

interface ProductModalProps {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  product?: Product | null;
}

function getStockStatus(stock: number): StockStatus {
  if (stock === 0) return "out";
  if (stock <= 5) return "critical";
  if (stock <= 10) return "low";
  return "active";
}

export function ProductModal({ open, onClose, onSaved, product }: ProductModalProps) {
  const isEdit = Boolean(product);
  const { success, error: showError } = useToast();

  const [name, setName] = useState("");
  const [sku, setSku] = useState("");
  const [category, setCategory] = useState("Kurti");
  const [price, setPrice] = useState("");
  const [cost, setCost] = useState("");
  const [stock, setStock] = useState("");
  const [image, setImage] = useState("🌺");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [variants, setVariants] = useState<string[]>(["S", "M", "L"]);
  const [newVariant, setNewVariant] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  // Inline field errors from API validation
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  // Top-level error message
  const [formError, setFormError] = useState("");

  // Populate form when editing
  useEffect(() => {
    if (product) {
      setName(product.name);
      setSku(product.sku);
      setCategory(product.category);
      setPrice(String(product.price));
      setCost(String(product.cost));
      setStock(String(product.stock));
      setImage(product.image ?? "🌺");
      setImageFile(null);
      setImagePreview(product.imageUrl || null);
      setVariants([...product.variants]);
      setDescription(product.description || "");
    } else {
      setName("");
      setSku("");
      setCategory("Kurti");
      setPrice("");
      setCost("");
      setStock("");
      setImage("🌺");
      setImageFile(null);
      setImagePreview(null);
      setVariants(["S", "M", "L"]);
      setDescription("");
      setNewVariant("");
    }
    setFieldErrors({});
    setFormError("");
  }, [product, open]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const addVariant = (v: string) => {
    const trimmed = v.trim();
    if (trimmed && !variants.includes(trimmed)) {
      setVariants((prev) => [...prev, trimmed]);
    }
    setNewVariant("");
  };

  const removeVariant = (v: string) => {
    setVariants((prev) => prev.filter((x) => x !== v));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFieldErrors({});
    setFormError("");

    // Client-side validation
    if (!name.trim()) { setFieldErrors(p => ({ ...p, name: ["Product name is required"] })); return; }
    if (!sku.trim()) { setFieldErrors(p => ({ ...p, sku: ["SKU is required"] })); return; }
    if (!price) { setFieldErrors(p => ({ ...p, price: ["Price is required"] })); return; }
    if (!cost) { setFieldErrors(p => ({ ...p, cost: ["Cost is required"] })); return; }

    const priceNum = Number(price);
    const costNum = Number(cost);
    const stockNum = Number(stock) || 0;

    if (isNaN(priceNum) || priceNum <= 0) {
      setFieldErrors(p => ({ ...p, price: ["Price must be a positive number"] }));
      return;
    }
    if (isNaN(costNum) || costNum <= 0) {
      setFieldErrors(p => ({ ...p, cost: ["Cost must be a positive number"] }));
      return;
    }

    setLoading(true);
    try {
      let finalImageUrl = image;

      // 1. If there's a new file, upload it directly to Cloudflare R2
      if (imageFile) {
        // A. Get presigned URL from our API
        const { uploadUrl, finalUrl } = await apiClient.get<any>(
          `/media/upload-url?filename=\${encodeURIComponent(imageFile.name)}&contentType=\${encodeURIComponent(imageFile.type)}`
        );

        // B. Upload directly to Cloudflare
        await fetch(uploadUrl, {
          method: "PUT",
          body: imageFile,
          headers: { "Content-Type": imageFile.type },
        });

        finalImageUrl = finalUrl;
      }

      // 2. Save product with the final image URL (or emoji)
      const productData = {
        name: name.trim(),
        sku: sku.trim().toUpperCase(),
        category,
        price: priceNum,
        cost: costNum,
        stock: stockNum,
        variants,
        image: image, // Keep the emoji as fallback or reference
        imageUrl: finalImageUrl,
        sold: product?.sold ?? 0,
        status: getStockStatus(stockNum),
        description: description.trim(),
      };

      if (isEdit && product) {
        await productsApi.update(product.id, productData as any);
        success(`"${name}" updated successfully`);
      } else {
        await productsApi.create(productData as any);
        success(`"${name}" added to inventory`);
      }

      onSaved();
      onClose();
    } catch (err) {
      // Extract field-level validation errors for inline highlighting
      if (isApiError(err) && err.fieldErrors && Object.keys(err.fieldErrors).length > 0) {
        setFieldErrors(err.fieldErrors);
        setFormError("Please fix the errors below.");
      } else {
        const msg = getErrorMessage(err);
        setFormError(msg);
        // Also show as toast so user sees it even if they scrolled
        showError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const margin = price && cost ? ((Number(price) - Number(cost)) / Number(price) * 100).toFixed(1) : null;

  const fieldErr = (field: string) => fieldErrors[field]?.[0];

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
            className="bg-white rounded-2xl shadow-card-lg w-full max-w-lg max-h-[90vh] overflow-y-auto"
          >
            {/* Header */}
            <div className="sticky top-0 bg-white z-10 px-5 py-4 border-b border-slate-100 flex items-center justify-between rounded-t-2xl">
              <div>
                <h3 className="text-sm font-bold text-slate-800">
                  {isEdit ? "Edit Product" : "Add New Product"}
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  {isEdit ? "Update product details and inventory" : "Add a new product to your inventory"}
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X size={15} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              {/* Top-level error banner */}
              {formError && (
                <div className="flex items-start gap-2.5 bg-red-50 border border-red-200 rounded-lg px-3.5 py-3">
                  <AlertCircle size={14} className="text-red-500 shrink-0 mt-0.5" />
                  <p className="text-xs text-red-700">{formError}</p>
                </div>
              )}

              {/* Image/Emoji Picker */}
              <div className="flex items-center gap-4">
                <div className="relative group">
                  <label className="cursor-pointer block">
                    <div className="w-16 h-16 rounded-xl bg-slate-50 border-2 border-dashed border-slate-200 flex items-center justify-center text-3xl hover:border-primary-300 hover:bg-primary-50/30 transition-all overflow-hidden relative">
                      {imagePreview ? (
                        <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                      ) : (
                        image
                      )}
                      <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                        <Plus size={20} className="text-white" />
                      </div>
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleImageChange}
                    />
                  </label>
                  
                  <button
                    type="button"
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                    className="absolute -bottom-1 -right-1 w-5 h-5 bg-white rounded-full shadow-sm border border-slate-200 flex items-center justify-center hover:bg-slate-50 transition-colors z-10"
                    title="Choose emoji instead"
                  >
                    <Plus size={10} className="text-slate-400 rotate-45" />
                  </button>

                  {showEmojiPicker && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setShowEmojiPicker(false)} />
                      <div className="absolute top-full left-0 mt-1 z-20 bg-white rounded-xl border border-slate-200 shadow-lg p-2 grid grid-cols-8 gap-1 w-[240px]">
                        {EMOJI_OPTIONS.map((emoji) => (
                          <button
                            key={emoji}
                            type="button"
                            onClick={() => { 
                              setImage(emoji); 
                              setImageFile(null); 
                              setImagePreview(null);
                              setShowEmojiPicker(false); 
                            }}
                            className={`w-7 h-7 rounded-lg flex items-center justify-center text-lg hover:bg-primary-50 transition-colors ${image === emoji && !imagePreview ? "bg-primary-100 ring-1 ring-primary-400" : ""}`}
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
                <div className="flex-1 space-y-1">
                  <p className="text-xs font-medium text-slate-600">Product Image (Optional)</p>
                  <p className="text-[10px] text-slate-400">Click the box to upload a photo, or the small icon to pick an emoji.</p>
                </div>
              </div>

              {/* Name & SKU */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Input
                    label="Product Name *"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Red Floral Kurti"
                    required
                    className={fieldErr("name") ? "border-red-400 focus:border-red-500 focus:ring-red-200" : ""}
                  />
                  {fieldErr("name") && (
                    <p className="text-[10px] text-red-600 flex items-center gap-1">
                      <AlertCircle size={10} /> {fieldErr("name")}
                    </p>
                  )}
                </div>
                <div className="space-y-1">
                  <Input
                    label="SKU *"
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                    placeholder="e.g. KRT-001"
                    required
                    className={fieldErr("sku") ? "border-red-400 focus:border-red-500 focus:ring-red-200" : ""}
                  />
                  {fieldErr("sku") && (
                    <p className="text-[10px] text-red-600 flex items-center gap-1">
                      <AlertCircle size={10} /> {fieldErr("sku")}
                    </p>
                  )}
                </div>
              </div>

              {/* Category */}
              <Select
                label="Category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                options={CATEGORY_OPTIONS}
              />

              {/* Price & Cost */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Input
                    label="Selling Price (NPR) *"
                    type="number"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="0"
                    required
                    className={fieldErr("price") ? "border-red-400" : ""}
                  />
                  {fieldErr("price") && (
                    <p className="text-[10px] text-red-600 flex items-center gap-1">
                      <AlertCircle size={10} /> {fieldErr("price")}
                    </p>
                  )}
                </div>
                <div className="space-y-1">
                  <Input
                    label="Cost Price (NPR) *"
                    type="number"
                    value={cost}
                    onChange={(e) => setCost(e.target.value)}
                    placeholder="0"
                    required
                    className={fieldErr("cost") ? "border-red-400" : ""}
                  />
                  {fieldErr("cost") && (
                    <p className="text-[10px] text-red-600 flex items-center gap-1">
                      <AlertCircle size={10} /> {fieldErr("cost")}
                    </p>
                  )}
                </div>
              </div>
              {margin && Number(margin) > 0 && (
                <p className="text-[10px] text-green-600 font-medium -mt-2">
                  💰 Margin: {margin}% (NPR {(Number(price) - Number(cost)).toLocaleString()} per unit)
                </p>
              )}

              {/* Stock */}
              <Input
                label="Stock Quantity"
                type="number"
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                placeholder="0"
              />

              {/* Variants */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-slate-600">Variants / Sizes</label>
                <div className="flex flex-wrap gap-1.5">
                  {variants.map((v) => (
                    <span
                      key={v}
                      className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-primary-50 text-primary-700 text-xs font-medium"
                    >
                      {v}
                      <button
                        type="button"
                        onClick={() => removeVariant(v)}
                        className="text-primary-400 hover:text-red-500 transition-colors"
                      >
                        <X size={10} />
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <div className="flex-1 flex gap-1 flex-wrap">
                    {VARIANT_PRESETS.filter((v) => !variants.includes(v)).map((v) => (
                      <button
                        key={v}
                        type="button"
                        onClick={() => addVariant(v)}
                        className="px-2 py-0.5 rounded text-[10px] font-medium text-slate-500 bg-slate-100 hover:bg-slate-200 transition-colors"
                      >
                        + {v}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Input
                    value={newVariant}
                    onChange={(e) => setNewVariant(e.target.value)}
                    placeholder="Custom variant..."
                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addVariant(newVariant); } }}
                    containerClassName="flex-1"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    icon={<Plus size={12} />}
                    onClick={() => addVariant(newVariant)}
                    disabled={!newVariant.trim()}
                  >
                    Add
                  </Button>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-600">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  className="w-full rounded-lg border border-slate-200 text-sm text-slate-800 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 placeholder:text-slate-400"
                  placeholder="Product details, fabric, care instructions..."
                />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end pt-3 gap-2 border-t border-slate-100">
                <Button variant="outline" size="sm" type="button" onClick={onClose} disabled={loading}>
                  Cancel
                </Button>
                <Button type="submit" size="sm" loading={loading}>
                  {isEdit ? "Save Changes" : "Add Product"}
                </Button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
