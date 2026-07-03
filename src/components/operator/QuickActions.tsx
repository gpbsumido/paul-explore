"use client";

import { useState, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useOperatorInventory } from "@/hooks/useOperatorInventory";
import { useOperatorAlerts } from "@/hooks/useOperatorAlerts";
import { useRestockStore } from "@/hooks/useOperatorMutations";
import { useDismissAlert } from "@/hooks/useOperatorMutations";
import {
  getLowStockItemIds,
  getDismissableAlerts,
} from "@/lib/operator-detail";
import { queryKeys } from "@/lib/queryKeys";
import { useToast } from "@/contexts/ToastContext";
import ConfirmModal from "./ConfirmModal";
import { RestockIcon, CheckmarkIcon, RefreshIcon } from "./icons";

interface QuickActionsProps {
  storeId: string;
}

type ConfirmTarget = "restock" | "dismiss" | null;

/**
 * Row of quick action buttons shown below the store header. Lets operators
 * perform common bulk operations without navigating into individual tabs.
 */
export default function QuickActions({ storeId }: QuickActionsProps) {
  const { items } = useOperatorInventory(storeId);
  const { alerts } = useOperatorAlerts(storeId);
  const { restockStore, isRestocking } = useRestockStore();
  const { dismissAlert, isDismissing } = useDismissAlert();
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  const [confirmTarget, setConfirmTarget] = useState<ConfirmTarget>(null);
  const [isSensorRefreshing, setIsSensorRefreshing] = useState(false);

  const lowStockIds = getLowStockItemIds(items);
  const dismissableAlerts = getDismissableAlerts(alerts);

  const handleRestockAll = useCallback(async () => {
    setConfirmTarget(null);
    if (lowStockIds.length === 0) return;
    await restockStore({ storeId, itemIds: [...lowStockIds] });
    addToast({
      message: `Restocked ${lowStockIds.length} item${lowStockIds.length !== 1 ? "s" : ""}`,
    });
  }, [storeId, lowStockIds, restockStore, addToast]);

  const handleDismissAll = useCallback(async () => {
    setConfirmTarget(null);
    if (dismissableAlerts.length === 0) return;
    const count = dismissableAlerts.length;
    await Promise.all(
      dismissableAlerts.map((a) => dismissAlert({ alertId: a.id, storeId })),
    );
    addToast({ message: `Dismissed ${count} alert${count !== 1 ? "s" : ""}` });
  }, [storeId, dismissableAlerts, dismissAlert, addToast]);

  const handleSensorRefresh = useCallback(() => {
    setIsSensorRefreshing(true);
    setTimeout(() => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.operator.store(storeId),
      });
      setIsSensorRefreshing(false);
      addToast({ message: "Sensor refresh complete", variant: "info" });
    }, 2000);
  }, [storeId, queryClient, addToast]);

  const confirmConfig =
    confirmTarget === "restock"
      ? {
          title: "Restock all low items?",
          message: `This will restock ${lowStockIds.length} item${lowStockIds.length !== 1 ? "s" : ""} to full capacity.`,
          confirmLabel: "Restock All",
          onConfirm: handleRestockAll,
          loading: isRestocking,
        }
      : confirmTarget === "dismiss"
        ? {
            title: "Dismiss all non-critical alerts?",
            message: `This will acknowledge ${dismissableAlerts.length} warning and info alert${dismissableAlerts.length !== 1 ? "s" : ""}. Critical alerts will remain active.`,
            confirmLabel: "Dismiss All",
            onConfirm: handleDismissAll,
            loading: isDismissing,
          }
        : null;

  return (
    <>
      <div className="flex flex-wrap gap-2">
        <ActionButton
          onClick={() => setConfirmTarget("restock")}
          disabled={lowStockIds.length === 0 || isRestocking}
          icon={<RestockIcon />}
          label={
            lowStockIds.length > 0
              ? `Restock All (${lowStockIds.length})`
              : "All Stocked"
          }
        />
        <ActionButton
          onClick={() => setConfirmTarget("dismiss")}
          disabled={dismissableAlerts.length === 0 || isDismissing}
          icon={<CheckmarkIcon />}
          label={
            dismissableAlerts.length > 0
              ? `Acknowledge All (${dismissableAlerts.length})`
              : "No Alerts"
          }
        />
        <ActionButton
          onClick={handleSensorRefresh}
          disabled={isSensorRefreshing}
          icon={
            <RefreshIcon className={isSensorRefreshing ? "animate-spin" : ""} />
          }
          label={isSensorRefreshing ? "Refreshing..." : "Force Sensor Refresh"}
        />
      </div>

      {confirmConfig && (
        <ConfirmModal
          open={confirmTarget !== null}
          onClose={() => setConfirmTarget(null)}
          title={confirmConfig.title}
          message={confirmConfig.message}
          confirmLabel={confirmConfig.confirmLabel}
          onConfirm={confirmConfig.onConfirm}
          loading={confirmConfig.loading}
        />
      )}
    </>
  );
}

// ---------------------------------------------------------------------------
// Shared button shell
// ---------------------------------------------------------------------------

function ActionButton({
  onClick,
  disabled,
  icon,
  label,
}: {
  onClick: () => void;
  disabled: boolean;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-2 text-xs font-medium text-foreground transition-colors hover:bg-surface-raised disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500"
    >
      {icon}
      {label}
    </button>
  );
}
