import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "@/components/ThemeProvider";
import OrganizationsContent from "./OrganizationsContent";

const renderLab = () =>
  render(
    <QueryClientProvider client={new QueryClient()}>
      <ThemeProvider>
        <OrganizationsContent />
      </ThemeProvider>
    </QueryClientProvider>,
  );

describe("OrganizationsContent", () => {
  it("routes an email to its organization's connection", async () => {
    const user = userEvent.setup();
    renderLab();
    await user.type(screen.getByLabelText(/email/i), "priya@acme.com");
    await user.click(screen.getByRole("button", { name: /find my organization/i }));
    expect(screen.getByRole("status")).toHaveTextContent(/acme/i);
  });

  it("announces a denial in text, not just colour", async () => {
    const user = userEvent.setup();
    renderLab();
    await user.type(screen.getByLabelText(/email/i), "sam@acme.com");
    await user.click(screen.getByRole("button", { name: /find my organization/i }));
    await user.click(screen.getByRole("button", { name: /sign in to acme/i }));
    await user.click(screen.getByRole("button", { name: /manage_connection/i }));
    expect(screen.getByRole("status")).toHaveTextContent(/denied.*missing_permission/i);
  });

  it("denies a cross-tenant read and logs it", async () => {
    const user = userEvent.setup();
    renderLab();
    await user.type(screen.getByLabelText(/email/i), "priya@acme.com");
    await user.click(screen.getByRole("button", { name: /find my organization/i }));
    await user.click(screen.getByRole("button", { name: /sign in to acme/i }));
    await user.click(screen.getByLabelText(/globex/i));
    await user.click(screen.getByRole("button", { name: /read_members/i }));
    expect(screen.getByRole("status")).toHaveTextContent(/cross_tenant/);
    expect(screen.getByRole("table", { name: /audit log/i })).toHaveTextContent(/cross_tenant/);
  });
});
