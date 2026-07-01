"use client";

import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useCallback } from "react";
import {
  parseTab,
  TABS,
  countActiveAlerts,
  type TabId,
} from "@/lib/operator-detail";
import { useOperatorAlerts } from "@/hooks/useOperatorAlerts";
import InventoryTab from "./InventoryTab";
import AlertsTab from "./AlertsTab";

interface StoreTabsProps {
  storeId: string;
}

/**
 * Tab bar for the store detail page. Active tab is synced to the ?tab= search
 * param so it survives refresh and back/forward navigation.
 */
export default function StoreTabs({ storeId }: StoreTabsProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const activeTab = parseTab(searchParams.get("tab"));

  const { alerts } = useOperatorAlerts(storeId);
  const activeAlertCount = countActiveAlerts(alerts);

  const setTab = useCallback(
    (tab: TabId) => {
      const params = new URLSearchParams(searchParams.toString());
      if (tab === "inventory") {
        params.delete("tab");
      } else {
        params.set("tab", tab);
      }
      const qs = params.toString();
      router.replace(`${pathname}${qs ? `?${qs}` : ""}`, { scroll: false });
    },
    [searchParams, router, pathname],
  );

  return (
    <div>
      {/* Tab bar */}
      <div
        className="flex gap-1 border-b border-border"
        role="tablist"
        aria-label="Store sections"
      >
        {TABS.map((tab) => {
          const isActive = tab.id === activeTab;
          return (
            <button
              key={tab.id}
              role="tab"
              aria-selected={isActive}
              aria-controls={`panel-${tab.id}`}
              onClick={() => setTab(tab.id)}
              className={`relative px-4 py-2.5 text-sm font-medium transition-colors ${
                isActive
                  ? "text-foreground"
                  : "text-muted hover:text-foreground"
              }`}
            >
              {tab.label}
              {tab.id === "alerts" && activeAlertCount > 0 && (
                <span className="ml-1.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-error-500 px-1 text-[10px] font-bold text-white">
                  {activeAlertCount}
                </span>
              )}
              {isActive && (
                <span className="absolute inset-x-0 bottom-0 h-0.5 bg-primary-600 rounded-full" />
              )}
            </button>
          );
        })}
      </div>

      {/* Tab panel */}
      <div
        id={`panel-${activeTab}`}
        role="tabpanel"
        aria-labelledby={activeTab}
        className="py-6"
      >
        <TabContent tab={activeTab} storeId={storeId} />
      </div>
    </div>
  );
}

function TabContent({ tab, storeId }: { tab: TabId; storeId: string }) {
  if (tab === "inventory") {
    return <InventoryTab storeId={storeId} />;
  }
  if (tab === "alerts") {
    return <AlertsTab storeId={storeId} />;
  }

  return (
    <div className="flex items-center justify-center rounded-xl border border-dashed border-border bg-surface p-12">
      <p className="text-sm text-muted">
        {TABS.find((t) => t.id === tab)?.label} content coming soon
      </p>
    </div>
  );
}
