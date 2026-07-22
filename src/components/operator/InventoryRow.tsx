"use client";

import { formatDistanceToNow } from "date-fns";
import type { InventoryItem } from "@/types/operator";
import { categorizeStock, type StockStatus } from "@/lib/operator-detail";
import { CheckmarkIcon } from "./icons";
import StockBar from "./StockBar";
import StockSparkline from "./StockSparkline";

interface InventoryRowProps {
  item: InventoryItem;
  onRestock: (itemId: string) => void;
  isRestocking: boolean;
  isRestocked?: boolean;
}

const STATUS_BADGE: Record<StockStatus, { label: string; className: string }> =
  {
    healthy: {
      label: "Healthy",
      className: "bg-success-500/10 text-success-700 dark:text-success-500",
    },
    low: {
      label: "Low",
      className: "bg-warning-500/10 text-warning-700 dark:text-warning-500",
    },
    critical: {
      label: "Critical",
      className: "bg-error-500/10 text-error-600 dark:text-error-500",
    },
    "out-of-stock": {
      label: "Out of Stock",
      className: "bg-error-500/10 text-error-600 dark:text-error-500",
    },
  };

const BORDER_LEFT: Record<StockStatus, string> = {
  healthy: "",
  low: "",
  critical: "border-l-2 border-l-error-500",
  "out-of-stock": "border-l-2 border-l-error-500",
};

/**
 * Single inventory item row showing product info, stock bar, sparkline,
 * status badge, and a restock button. Critical and out-of-stock items
 * get a red left border accent.
 */
export default function InventoryRow({
  item,
  onRestock,
  isRestocking,
  isRestocked = false,
}: InventoryRowProps) {
  const status = categorizeStock(item.currentStock, item.capacity);
  const badge = STATUS_BADGE[status];
  const borderClass = BORDER_LEFT[status];

  return (
    <div
      className={`flex flex-wrap items-center gap-x-4 gap-y-2 rounded-lg border border-border bg-surface px-4 py-3 ${borderClass}`}
    >
      {/* Product info */}
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-foreground truncate">
          {item.productName}
        </p>
        <p className="text-[11px] text-muted">{item.category}</p>
      </div>

      {/* Sparkline */}
      <StockSparkline
        currentStock={item.currentStock}
        capacity={item.capacity}
        itemId={item.id}
      />

      {/* Stock bar */}
      <StockBar currentStock={item.currentStock} capacity={item.capacity} />

      {/* Status badge */}
      <span
        className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium ${badge.className}`}
      >
        {badge.label}
      </span>

      {/* Last restocked */}
      <span className="shrink-0 text-xs text-muted w-20 text-right">
        {formatDistanceToNow(new Date(item.lastRestocked), {
          addSuffix: true,
        })}
      </span>

      {/* Restock button */}
      {isRestocked ? (
        <span className="shrink-0 flex items-center gap-1 rounded-md bg-success-500/10 px-3 py-1.5 text-xs font-medium text-success-700 dark:text-success-500">
          <CheckmarkIcon size={12} />
          Restocked
        </span>
      ) : (
        <button type="button"
          onClick={() => onRestock(item.id)}
          disabled={isRestocking || status === "healthy"}
          className="shrink-0 rounded-md bg-primary-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-primary-700 disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500"
        >
          {isRestocking ? "Restocking..." : "Restock"}
        </button>
      )}
    </div>
  );
}
