import { describe, it, expect } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { server } from "@/test/server";
import { axe } from "@/test/a11y";
import AdminAboutSection from "./AdminAboutSection";

const renderSection = (version = "9.9.9") => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <AdminAboutSection version={version} />
    </QueryClientProvider>,
  );
};

const asAdmin = () =>
  server.use(
    http.get("/api/me", () =>
      HttpResponse.json({ sub: "auth0|me", isFlagAdmin: true }),
    ),
  );

describe("AdminAboutSection", () => {
  it("shows the version for an admin", async () => {
    asAdmin();
    renderSection("9.9.9");
    expect(await screen.findByText("9.9.9")).toBeInTheDocument();
    expect(screen.getByText(/version/i)).toBeInTheDocument();
  });

  it("renders nothing for a non-admin", async () => {
    server.use(
      http.get("/api/me", () =>
        HttpResponse.json({ sub: "auth0|me", isFlagAdmin: false }),
      ),
    );
    const { container } = renderSection();
    await waitFor(() => expect(container.querySelector("section")).toBeNull());
  });

  it("renders nothing for a signed-out visitor", async () => {
    const { container } = renderSection();
    await waitFor(() => expect(container.querySelector("section")).toBeNull());
  });

  it("has no a11y violations for an admin", async () => {
    asAdmin();
    const { container } = renderSection();
    await screen.findByText("9.9.9");
    expect(await axe(container)).toHaveNoViolations();
  });
});
