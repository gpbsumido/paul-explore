import { describe, it, expect } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { server } from "@/test/server";
import { axe } from "@/test/a11y";
import AdminBetsLink from "./AdminBetsLink";

const renderLink = () => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <AdminBetsLink />
    </QueryClientProvider>,
  );
};

const asAdmin = () =>
  server.use(
    http.get("/api/me", () =>
      HttpResponse.json({ sub: "auth0|me", isFlagAdmin: true }),
    ),
  );

describe("AdminBetsLink", () => {
  it("shows the god's-view link for an admin, pointing at the admin bets route", async () => {
    asAdmin();
    renderLink();
    const link = await screen.findByRole("link", { name: /god's view/i });
    expect(link).toHaveAttribute("href", "/zeroproof/admin/bets");
  });

  it("renders nothing for a non-admin", async () => {
    server.use(
      http.get("/api/me", () =>
        HttpResponse.json({ sub: "auth0|me", isFlagAdmin: false }),
      ),
    );
    const { container } = renderLink();
    await waitFor(() => expect(container.querySelector("a")).toBeNull());
  });

  it("renders nothing for a signed-out visitor (the /api/me default)", async () => {
    const { container } = renderLink();
    await waitFor(() => expect(container.querySelector("a")).toBeNull());
  });

  it("has no a11y violations for an admin", async () => {
    asAdmin();
    const { container } = renderLink();
    await screen.findByRole("link", { name: /god's view/i });
    expect(await axe(container)).toHaveNoViolations();
  });
});
