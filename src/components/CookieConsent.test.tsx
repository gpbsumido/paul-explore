import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import CookieConsent from "./CookieConsent";
import { CONSENT_COOKIE } from "@/lib/consent";

const refresh = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh }),
}));

/** Clears every cookie so each test starts with no prior choice. */
function clearCookies() {
  for (const c of document.cookie.split(";")) {
    const name = c.split("=")[0].trim();
    if (name) document.cookie = `${name}=; max-age=0; path=/`;
  }
}

beforeEach(() => {
  clearCookies();
  refresh.mockClear();
});

afterEach(() => clearCookies());

describe("CookieConsent", () => {
  it("renders the banner when no choice has been stored", () => {
    render(<CookieConsent />);

    expect(screen.getByRole("region", { name: /cookie/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /accept/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /decline/i })).toBeInTheDocument();
  });

  it("links to the privacy notice", () => {
    render(<CookieConsent />);

    const link = screen.getByRole("link", { name: /privacy/i });
    expect(link).toHaveAttribute("href", "/privacy");
  });

  it("stores accepted and hides the banner on Accept", async () => {
    render(<CookieConsent />);

    await userEvent.click(screen.getByRole("button", { name: /accept/i }));

    expect(document.cookie).toContain(`${CONSENT_COOKIE}=accepted`);
    expect(screen.queryByRole("region", { name: /cookie/i })).not.toBeInTheDocument();
    expect(refresh).toHaveBeenCalled();
  });

  it("stores declined and hides the banner on Decline", async () => {
    render(<CookieConsent />);

    await userEvent.click(screen.getByRole("button", { name: /decline/i }));

    expect(document.cookie).toContain(`${CONSENT_COOKIE}=declined`);
    expect(screen.queryByRole("region", { name: /cookie/i })).not.toBeInTheDocument();
  });

  it("does not render once a choice is already stored", () => {
    document.cookie = `${CONSENT_COOKIE}=declined; path=/`;

    render(<CookieConsent />);

    expect(screen.queryByRole("region", { name: /cookie/i })).not.toBeInTheDocument();
  });
});
