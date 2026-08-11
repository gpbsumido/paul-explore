import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import FlagsInfoStrip from "@/components/flags/FlagsInfoStrip";

describe("FlagsInfoStrip", () => {
  it("states that the flags are backed by a live API", () => {
    render(<FlagsInfoStrip isLoggedIn isFlagAdmin={false} resetLabel="2h 14m" />);

    expect(screen.getByText(/backed by a live api/i)).toBeInTheDocument();
    expect(screen.getByText(/portfolio_api/i)).toBeInTheDocument();
  });

  it("shows when the demo next resets", () => {
    render(<FlagsInfoStrip isLoggedIn isFlagAdmin={false} resetLabel="2h 14m" />);

    expect(screen.getByText(/resets in 2h 14m/i)).toBeInTheDocument();
  });

  it("names the three groups so the rules are stated before anything is clicked", () => {
    render(<FlagsInfoStrip isLoggedIn isFlagAdmin={false} resetLabel="43m" />);

    expect(screen.getByText(/three groups/i)).toBeInTheDocument();
  });

  it("invites a signed-out visitor to sign in, while saying what they can already do", () => {
    render(
      <FlagsInfoStrip isLoggedIn={false} isFlagAdmin={false} resetLabel="43m" />,
    );

    expect(screen.getByText(/change the open ones right now/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /sign in/i })).toHaveAttribute(
      "href",
      "/auth/login",
    );
  });

  it("tells a signed-in non-admin which groups are theirs", () => {
    render(<FlagsInfoStrip isLoggedIn isFlagAdmin={false} resetLabel="43m" />);

    expect(screen.getByText(/first two groups/i)).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /sign in/i })).not.toBeInTheDocument();
  });

  it("tells an admin every group is theirs", () => {
    render(<FlagsInfoStrip isLoggedIn isFlagAdmin resetLabel="43m" />);

    expect(screen.getByText(/every group is yours/i)).toBeInTheDocument();
  });
});
