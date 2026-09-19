import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import IntervieweePage from "./page";
import { auth0 } from "@/lib/auth0";

vi.mock("@/lib/auth0", () => ({ auth0: { getSession: vi.fn() } }));
vi.mock("./IntervieweeContent", () => ({
  default: () => <div>the deck</div>,
}));

// notFound() throws in real Next; a throwing stub lets us assert the gate fires.
vi.mock("next/navigation", () => ({
  notFound: () => {
    throw new Error("NEXT_NOT_FOUND");
  },
}));

const getSession = vi.mocked(auth0.getSession);

const ADMIN = "psumido@gmail.com";

beforeEach(() => {
  getSession.mockReset();
  process.env.FLAG_ADMIN_ALLOWED_EMAILS = ADMIN;
});

describe("Interviewee page gate", () => {
  it("404s a signed-out visitor", async () => {
    getSession.mockResolvedValue(null as never);
    await expect(IntervieweePage()).rejects.toThrow("NEXT_NOT_FOUND");
  });

  it("404s a signed-in visitor who is not the admin", async () => {
    getSession.mockResolvedValue({
      user: { email: "someone@else.com", email_verified: true },
    } as never);
    await expect(IntervieweePage()).rejects.toThrow("NEXT_NOT_FOUND");
  });

  it("renders the deck for the verified admin", async () => {
    getSession.mockResolvedValue({
      user: { email: ADMIN, email_verified: true },
    } as never);
    render(await IntervieweePage());
    expect(screen.getByText("the deck")).toBeInTheDocument();
  });
});
