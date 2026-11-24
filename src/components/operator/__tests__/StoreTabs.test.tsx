import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import StoreTabs from "../StoreTabs";
import { buildAlert } from "@/test/factories/operator";
import type { Alert } from "@/types/operator";

const nav = vi.hoisted(() => ({
  search: "",
  pathname: "/operator/stores/store-1",
  replace: vi.fn(),
  alerts: [] as Alert[],
}));

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(nav.search),
  useRouter: () => ({ replace: nav.replace }),
  usePathname: () => nav.pathname,
}));
vi.mock("@/hooks/useOperatorAlerts", () => ({
  useOperatorAlerts: () => ({ alerts: nav.alerts }),
}));

// The tabs' own content is tested on its own; here each one is a marker.
vi.mock("../InventoryTab", () => ({ default: () => <p>inventory content</p> }));
vi.mock("../AlertsTab", () => ({ default: () => <p>alerts content</p> }));
vi.mock("../ActivityTab", () => ({ default: () => <p>activity content</p> }));
vi.mock("../PlanogramTab", () => ({ default: () => <p>planogram content</p> }));
vi.mock("../SalesTab", () => ({ default: () => <p>sales content</p> }));
vi.mock("../PricingTab", () => ({ default: () => <p>pricing content</p> }));
vi.mock("../TaxTab", () => ({ default: () => <p>tax content</p> }));
vi.mock("../RestockHistoryTab", () => ({
  default: ({ storeId }: { storeId: string }) => <p>history content for {storeId}</p>,
}));

beforeEach(() => {
  nav.search = "";
  nav.alerts = [];
  nav.replace.mockClear();
});

describe("StoreTabs", () => {
  it("opens on inventory when the URL names no tab", () => {
    render(<StoreTabs storeId="store-1" />);
    expect(screen.getByRole("tab", { name: "Inventory" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("tabpanel")).toHaveTextContent("inventory content");
  });

  it("opens on the tab the URL names, and passes the store id on", () => {
    nav.search = "tab=restock-history";
    render(<StoreTabs storeId="store-1" />);
    expect(screen.getByRole("tab", { name: /restock history/i })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("tabpanel")).toHaveTextContent("history content for store-1");
  });

  it("falls back to inventory for a tab name it does not know", () => {
    nav.search = "tab=nonsense";
    render(<StoreTabs storeId="store-1" />);
    expect(screen.getByRole("tabpanel")).toHaveTextContent("inventory content");
  });

  it.each([
    ["Alerts", "alerts"],
    ["Activity", "activity"],
    ["Planogram", "planogram"],
    ["Sales", "sales"],
    ["Pricing", "pricing"],
    ["Tax", "tax"],
  ])("shows the %s tab's content for ?tab=%s", (_label, id) => {
    nav.search = `tab=${id}`;
    render(<StoreTabs storeId="store-1" />);
    expect(screen.getByRole("tabpanel")).toHaveTextContent(`${id} content`);
  });

  it("writes the chosen tab into the URL without scrolling, replacing rather than pushing", async () => {
    const user = userEvent.setup();
    render(<StoreTabs storeId="store-1" />);
    await user.click(screen.getByRole("tab", { name: "Sales" }));
    expect(nav.replace).toHaveBeenCalledWith("/operator/stores/store-1?tab=sales", { scroll: false });
  });

  it("keeps other query params when it changes tab", async () => {
    nav.search = "range=7d&tab=sales";
    const user = userEvent.setup();
    render(<StoreTabs storeId="store-1" />);
    await user.click(screen.getByRole("tab", { name: "Tax" }));
    expect(nav.replace).toHaveBeenCalledWith("/operator/stores/store-1?range=7d&tab=tax", { scroll: false });
  });

  it("drops the tab param entirely when going back to inventory", async () => {
    nav.search = "tab=sales";
    const user = userEvent.setup();
    render(<StoreTabs storeId="store-1" />);
    await user.click(screen.getByRole("tab", { name: "Inventory" }));
    expect(nav.replace).toHaveBeenCalledWith("/operator/stores/store-1", { scroll: false });
  });

  it("badges the alerts tab with the number of active alerts, and nothing when there are none", () => {
    nav.alerts = [
      buildAlert({ id: "a", acknowledged: false }),
      buildAlert({ id: "b", acknowledged: false }),
      buildAlert({ id: "c", acknowledged: true }),
    ];
    const { rerender } = render(<StoreTabs storeId="store-1" />);
    expect(screen.getByRole("tab", { name: /alerts/i })).toHaveTextContent("2");

    nav.alerts = [buildAlert({ id: "c", acknowledged: true })];
    rerender(<StoreTabs storeId="store-1" />);
    expect(screen.getByRole("tab", { name: /alerts/i })).toHaveTextContent(/^Alerts$/);
  });

  it("links the selected tab to its panel for assistive tech", () => {
    nav.search = "tab=tax";
    render(<StoreTabs storeId="store-1" />);
    const tab = screen.getByRole("tab", { name: "Tax" });
    expect(screen.getByRole("tabpanel")).toHaveAttribute("id", tab.getAttribute("aria-controls"));
    expect(screen.getByRole("tabpanel")).toHaveAttribute("aria-labelledby", tab.id);
  });
});
