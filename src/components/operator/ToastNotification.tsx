"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useToast } from "@/contexts/ToastContext";
import type { ToastVariant } from "@/lib/operator-toast";

const VARIANT_STYLES: Record<ToastVariant, string> = {
  success: "bg-success-600 text-white",
  error: "bg-error-600 text-white",
  info: "bg-primary-600 text-white",
};

/**
 * Fixed toast container at the bottom of the screen. Renders active toasts
 * from the ToastContext with enter/exit animations. Each toast auto-dismisses
 * after 3 seconds (handled by the store), or can be clicked to dismiss early.
 */
export default function ToastNotification() {
  const { toasts, removeToast } = useToast();

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.button
            key={toast.id}
            type="button"
            onClick={() => removeToast(toast.id)}
            className={`pointer-events-auto rounded-lg px-4 py-2.5 text-sm font-medium shadow-lg transition-colors ${VARIANT_STYLES[toast.variant]}`}
            initial={{ opacity: 0, y: 16, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            transition={{ duration: 0.2 }}
          >
            {toast.message}
          </motion.button>
        ))}
      </AnimatePresence>
    </div>
  );
}
