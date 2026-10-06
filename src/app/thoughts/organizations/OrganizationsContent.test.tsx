import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import OrganizationsContent from "./OrganizationsContent";
import { THOUGHTS } from "@/app/_shared/featureData";
import { groupThoughts } from "@/app/_shared/thoughtCategories";

vi.mock("@/components/PageHeader", () => ({
  default: () => null,
}));

describe("OrganizationsContent", () => {
  it("renders the write-up heading", () => {
    render(<OrganizationsContent />);
    expect(
      screen.getByRole("heading", {
        level: 1,
        name: /one customer must never see another/i,
      }),
    ).toBeInTheDocument();
  });

  it("explains why the tenant check runs before the role check", () => {
    render(<OrganizationsContent />);
    const body = document.body.textContent ?? "";
    expect(body).toMatch(/cross_tenant/);
    expect(body).toMatch(/Put the role check first/);
  });

  it("explains whole-domain matching", () => {
    render(<OrganizationsContent />);
    const body = document.body.textContent ?? "";
    expect(body).toMatch(/acme\.com\.evil\.io/);
  });
});

describe("organizations write-up registration", () => {
  it("is listed in the Features category", () => {
    const group = groupThoughts(THOUGHTS).find((g) => g.name === "Features");
    expect(group?.items.some((t) => t.href === "/thoughts/organizations")).toBe(
      true,
    );
  });
});
