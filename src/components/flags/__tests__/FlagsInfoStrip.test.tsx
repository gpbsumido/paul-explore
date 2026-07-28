import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import FlagsInfoStrip from "@/components/flags/FlagsInfoStrip";

describe("FlagsInfoStrip", () => {
  it("states that the flags are backed by a live API", () => {
    render(<FlagsInfoStrip isLoggedIn resetLabel="2h 14m" />);

    expect(screen.getByText(/backed by a live api/i)).toBeInTheDocument();
    expect(screen.getByText(/portfolio_api/i)).toBeInTheDocument();
  });

  it("shows when the demo next resets", () => {
    render(<FlagsInfoStrip isLoggedIn resetLabel="2h 14m" />);

    expect(screen.getByText(/resets in 2h 14m/i)).toBeInTheDocument();
  });

  it("invites a signed-out visitor to sign in to change flags", () => {
    render(<FlagsInfoStrip isLoggedIn={false} resetLabel="43m" />);

    const link = screen.getByRole("link", { name: /sign in to change/i });
    expect(link).toHaveAttribute("href", "/auth/login");
  });

  it("drops the sign-in prompt once the visitor is signed in", () => {
    render(<FlagsInfoStrip isLoggedIn resetLabel="43m" />);

    expect(
      screen.queryByRole("link", { name: /sign in to change/i }),
    ).not.toBeInTheDocument();
  });
});
