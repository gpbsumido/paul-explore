import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";
import AdminSuiteDemo from "../admin-suite";
import { FEATURES, featureIndexBySlug } from "../../_data/catalog";

const feature = FEATURES[featureIndexBySlug("admin-suite")!];

// The console persists to localStorage, so isolate each test.
beforeEach(() => window.localStorage.clear());

describe("admin suite demo", () => {
  it("shows the members table with role chips", () => {
    render(<AdminSuiteDemo feature={feature} />);
    expect(screen.getByText("Ana P.")).toBeInTheDocument();
    expect(screen.getByText("Owner")).toBeInTheDocument();
  });

  it("reveals an API key on the Keys tab", () => {
    render(<AdminSuiteDemo feature={feature} />);
    fireEvent.click(screen.getByRole("tab", { name: "Keys" }));
    expect(screen.queryByText(/sk_live_9f2a/)).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Reveal" }));
    expect(screen.getByText(/sk_live_9f2a/)).toBeInTheDocument();
  });

  it("creates a user assigned to an org", () => {
    render(<AdminSuiteDemo feature={feature} />);
    fireEvent.click(screen.getByRole("button", { name: /New user/i }));

    const dialog = screen.getByRole("dialog", { name: "New Users" });
    fireEvent.change(within(dialog).getByLabelText("Name"), {
      target: { value: "Rio T." },
    });
    fireEvent.change(within(dialog).getByLabelText("Email"), {
      target: { value: "rio@studio.example" },
    });
    fireEvent.change(within(dialog).getByLabelText("Org"), {
      target: { value: "o2" },
    });
    fireEvent.click(within(dialog).getByRole("button", { name: "Create" }));

    const list = screen.getByRole("list", { name: "Users" });
    const rioRow = within(list).getByText("Rio T.").closest("li")!;
    // the new user shows its assigned org (Pixel Forge = o2)
    expect(within(rioRow).getByText(/Pixel Forge/)).toBeInTheDocument();
  });

  it("reassigns a user to a different org in place", () => {
    render(<AdminSuiteDemo feature={feature} />);
    // Ana P. starts in Nova Studio (o1)
    const orgSelect = screen.getByLabelText("Org for Ana P.") as HTMLSelectElement;
    expect(orgSelect.value).toBe("o1");
    fireEvent.change(orgSelect, { target: { value: "o2" } });
    expect(
      (screen.getByLabelText("Org for Ana P.") as HTMLSelectElement).value,
    ).toBe("o2");
  });

  it("creates a new org that becomes assignable", () => {
    render(<AdminSuiteDemo feature={feature} />);
    fireEvent.click(screen.getByRole("tab", { name: "Orgs" }));
    fireEvent.click(screen.getByRole("button", { name: /New org/i }));
    const dialog = screen.getByRole("dialog", { name: "New Orgs" });
    fireEvent.change(within(dialog).getByLabelText("Name"), {
      target: { value: "Aurora Games" },
    });
    fireEvent.click(within(dialog).getByRole("button", { name: "Create" }));

    expect(
      within(screen.getByRole("list", { name: "Orgs" })).getByText(
        "Aurora Games",
      ),
    ).toBeInTheDocument();
  });
});
