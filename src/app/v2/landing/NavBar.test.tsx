import { describe, it, expect, vi, afterEach } from "vitest";
import { act, render, screen } from "@testing-library/react";

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

/** Scrolls the window to `y` and fires the scroll event the bar listens for. */
const scrollTo = (y: number) => {
  act(() => {
    Object.defineProperty(window, "scrollY", { value: y, configurable: true });
    window.dispatchEvent(new Event("scroll"));
  });
};

afterEach(() => {
  vi.restoreAllMocks();
  Object.defineProperty(window, "scrollY", { value: 0, configurable: true });
});

describe("NavBar", () => {
  it("keeps its 1px bottom border at rest and once scrolled, so the bar never changes height", () => {
    const { container } = render(<NavBar authenticated={false} />);
    const nav = container.querySelector("nav")!;

    // Only the border's colour changes between the two states, never the border.
    expect(nav.className).toContain("border-b");
    expect(nav.className).toContain("border-transparent");

    scrollTo(200);

    expect(nav.className).toContain("border-b");
    expect(nav.className).toContain("border-border");
    expect(nav.className).not.toContain("border-transparent");
  });

  it("turns opaque only once the page has scrolled past 50px", () => {
    const { container } = render(<NavBar authenticated={false} />);
    const nav = container.querySelector("nav")!;

    scrollTo(50);
    expect(nav.className).not.toContain("backdrop-blur-xl");

    scrollTo(51);
    expect(nav.className).toContain("backdrop-blur-xl");

    scrollTo(0);
    expect(nav.className).not.toContain("backdrop-blur-xl");
  });

  it("is already opaque on arrival when the page loads part way down", () => {
    Object.defineProperty(window, "scrollY", { value: 400, configurable: true });
    const { container } = render(<NavBar authenticated={false} />);

    expect(container.querySelector("nav")!.className).toContain("backdrop-blur-xl");
  });

  it("stops listening for scroll once it is removed from the page", () => {
    const added = vi.spyOn(window, "addEventListener");
    const removed = vi.spyOn(window, "removeEventListener");
    const { unmount } = render(<NavBar authenticated={false} />);
    const scrollHandler = added.mock.calls.find(([type]) => type === "scroll")?.[1];
    expect(scrollHandler).toBeDefined();

    unmount();

    expect(removed).toHaveBeenCalledWith("scroll", scrollHandler);
  });

  it("offers a way to log in when signed out, and no account menu", () => {
    render(<NavBar authenticated={false} />);

    expect(screen.getByRole("link", { name: "Log in" })).toHaveAttribute("href", "/auth/login");
    expect(screen.queryByTestId("header-menu")).not.toBeInTheDocument();
  });

  it("shows the account menu instead of the login link when signed in", () => {
    render(<NavBar authenticated />);

    expect(screen.getByTestId("header-menu")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Log in" })).not.toBeInTheDocument();
  });

  it("links the wordmark back to the landing page", () => {
    render(<NavBar authenticated={false} />);

    expect(screen.getByRole("link", { name: "paul-explore" })).toHaveAttribute("href", "/");
  });
});
