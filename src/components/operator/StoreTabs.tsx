"use client";

import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useCallback } from "react";
import { parseTab, TABS, type TabId } from "@/lib/operator-detail";

/**
 * Tab bar for the store detail page. Active tab is synced to the ?tab= search
 * param so it survives refresh and back/forward navigation. Each tab renders
 * a placeholder panel until the content is wired up in later steps.
 */
export default function StoreTabs() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const activeTab = parseTab(searchParams.get("tab"));

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
        <div className="flex items-center justify-center rounded-xl border border-dashed border-border bg-surface p-12">
          <p className="text-sm text-muted">
            {TABS.find((t) => t.id === activeTab)?.label} content coming soon
          </p>
        </div>
      </div>
    </div>
  );
}
