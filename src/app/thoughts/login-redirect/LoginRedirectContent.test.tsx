import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import LoginRedirectContent from "./LoginRedirectContent";
import { THOUGHTS } from "@/app/_shared/featureData";
import { groupThoughts } from "@/app/_shared/thoughtCategories";

vi.mock("@/components/PageHeader", () => ({
  default: () => null,
}));

describe("LoginRedirectContent", () => {
  it("renders the write-up heading", () => {
    render(<LoginRedirectContent />);
    expect(
      screen.getByRole("heading", {
        level: 1,
        name: /landing back where i logged in from/i,
      }),
    ).toBeInTheDocument();
  });

  it("explains the returnTo fix at the proxy choke point", () => {
    render(<LoginRedirectContent />);
    const body = document.body.textContent ?? "";
    expect(body).toMatch(/returnTo/);
    expect(body).toMatch(/Referer/);
    expect(body).toMatch(/same-origin/i);
  });

  it("explains the denied-consent toast", () => {
    render(<LoginRedirectContent />);
    const body = document.body.textContent ?? "";
    expect(body).toMatch(/access_denied/);
    expect(body).toMatch(/authError=permissions/);
    expect(body).toMatch(/without granting permissions/i);
  });
});

describe("login-redirect write-up registration", () => {
  it("is listed in the Architecture & Backend category", () => {
    const group = groupThoughts(THOUGHTS).find(
      (g) => g.name === "Architecture & Backend",
    );
    expect(
      group?.items.some((t) => t.href === "/thoughts/login-redirect"),
    ).toBe(true);
  });
});
