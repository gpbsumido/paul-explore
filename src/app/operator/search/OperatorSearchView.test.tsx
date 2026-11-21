import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { SearchItem } from "@/lib/operator-search";
import OperatorSearchView from "./OperatorSearchView";

const push = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: (href: string) => push(href) }),
}));

// The combobox is covered on its own. Here it is a button that picks a result,
// so the only thing under test is what the view does with the pick.
vi.mock("@/components/operator/OperatorSearch", () => ({
  default: ({ onSelect }: { onSelect: (item: SearchItem) => void }) => (
    <button
      type="button"
      onClick={() =>
        onSelect({
          id: "store-7",
          type: "store",
          label: "Queen St",
          href: "/operator/stores/store-7",
        } as unknown as SearchItem)
      }
    >
      pick a store
    </button>
  ),
}));

describe("OperatorSearchView", () => {
  it("goes to the picked result's own page", async () => {
    push.mockClear();
    render(<OperatorSearchView />);

    await userEvent.click(screen.getByRole("button", { name: "pick a store" }));

    expect(push).toHaveBeenCalledTimes(1);
    expect(push).toHaveBeenCalledWith("/operator/stores/store-7");
  });
});
