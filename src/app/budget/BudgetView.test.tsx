import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { server } from "@/test/server";
import { axe } from "@/test/a11y";
import BudgetView from "./BudgetView";

const renderView = (me: () => Response) => {
  server.use(
    http.get("/api/me", () => me()),
    // Signed-in path talks to the budget BFF; keep it from erroring the test.
    http.get("/api/budget", () => HttpResponse.json([])),
    http.get("/api/budget/*", () => HttpResponse.json([])),
  );
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <BudgetView />
    </QueryClientProvider>,
  );
};

const signedOut = () => HttpResponse.json({ sub: null, email: null });
const signedIn = () => HttpResponse.json({ sub: "auth0|me", email: "me@example.com" });

describe("BudgetView — auth gate", () => {
  it("shows a marketing gate with a sign-in link when signed out", async () => {
    renderView(signedOut);
    const signIn = await screen.findByRole("link", { name: /sign in/i });
    expect(signIn.getAttribute("href")).toContain("/auth/login");
    expect(signIn.getAttribute("href")).toContain("returnTo");
    // It explains what the feature does...
    expect(screen.getByText(/one-tap even split/i)).toBeInTheDocument();
    expect(screen.getByText(/syncs across your devices/i)).toBeInTheDocument();
    // ...but exposes no budget functionality or data.
    expect(screen.queryByRole("button", { name: /add expense/i })).toBeNull();
    expect(screen.queryByRole("button", { name: /add person/i })).toBeNull();
  });

  it("does not show the marketing gate when signed in", async () => {
    renderView(signedIn);
    // The server budget renders (or its empty state); the sign-in gate does not.
    await screen.findByText(/budget/i);
    expect(screen.queryByRole("link", { name: /^sign in$/i })).toBeNull();
  });

  it("the signed-out gate has no axe violations", async () => {
    const { container } = renderView(signedOut);
    await screen.findByRole("link", { name: /sign in/i });
    expect(await axe(container)).toHaveNoViolations();
  });
});
