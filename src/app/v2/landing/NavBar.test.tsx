import { describe, it, expect, vi } from "vitest";
import { render } from "@testing-library/react";

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
  }: {
    children: React.ReactNode;
    href: string;
  }) => <a href={href}>{children}</a>,
}));

vi.mock("@/components/HeaderMenu", () => ({
  default: () => <div data-testid="header-menu" />,
}));

import NavBar from "./NavBar";

describe("NavBar", () => {
  it("always has a bottom border (transparent when not scrolled) to prevent CLS", () => {
    const { container } = render(<NavBar authenticated={false} />);
    const nav = container.querySelector("nav")!;
    const className = nav.className;

    // should always have border-b to reserve the 1px space
    expect(className).toContain("border-b");
    // should NOT conditionally add/remove border-b
    // the border color changes, not the border itself
    expect(className).not.toContain("border-b border-border");
  });
});
