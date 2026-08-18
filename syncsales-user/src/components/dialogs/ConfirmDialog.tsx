import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, Trash2, X } from "lucide-react";
import { useConfirmDialog } from "@/store";
import { Button } from "@/components/ui/Button";

export function ConfirmDialog() {
  const { open, title, description, onConfirm, variant, close } = useConfirmDialog();

  const handleConfirm = () => {
    onConfirm?.();
    close();
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm px-4"
          onClick={(e) => e.target === e.currentTarget && close()}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 10 }}
            transition={{ type: "spring", duration: 0.3 }}
            className="bg-white rounded-2xl shadow-card-lg p-6 w-full max-w-md"
          >
            <div className="flex items-start gap-4">
              <div className={`p-2.5 rounded-xl ${variant === "danger" ? "bg-red-50" : "bg-amber-50"}`}>
                {variant === "danger"
                  ? <Trash2 size={20} className="text-red-500" />
                  : <AlertTriangle size={20} className="text-amber-500" />
                }
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-semibold text-slate-800">{title}</h3>
                <p className="text-sm text-slate-500 mt-1">{description}</p>
              </div>
              <button onClick={close} className="text-slate-400 hover:text-slate-600 transition-colors">
                <X size={18} />
              </button>
            </div>

            <div className="flex gap-3 mt-6 justify-end">
              <Button variant="outline" size="sm" onClick={close}>Cancel</Button>
              <Button
                variant={variant === "danger" ? "danger" : "primary"}
                size="sm"
                onClick={handleConfirm}
              >
                Confirm
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
