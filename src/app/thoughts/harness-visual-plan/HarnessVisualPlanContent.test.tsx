import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { queryKeys } from "@/lib/queryKeys";
import HarnessVisualPlanContent from "./HarnessVisualPlanContent";

vi.mock("@/components/PageHeader", () => ({ default: () => null }));

function makeClient() {
  return new QueryClient({ defaultOptions: { queries: { retry: false } } });
}

function renderWith(client: QueryClient) {
  const Wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  return render(<HarnessVisualPlanContent />, { wrapper: Wrapper });
}

describe("HarnessVisualPlanContent", () => {
  it("renders the write-up heading", () => {
    renderWith(makeClient());
    expect(
      screen.getByRole("heading", { level: 1, name: "Visual Plans" }),
    ).toBeInTheDocument();
  });

  it("shows the free intro section to everyone", () => {
    renderWith(makeClient());
    expect(screen.getByText(/what it is/i)).toBeInTheDocument();
  });

  it("locks the rest of the write-up for a non-owner", () => {
    const client = makeClient();
    client.setQueryData(queryKeys.me(), { email: "someone@example.com" });
    renderWith(client);
    expect(
      screen.getByRole("heading", { name: /interview me first/i }),
    ).toBeInTheDocument();
    expect(screen.queryByTestId("gated-content")).not.toBeInTheDocument();
  });

  it("fills the haze behind the lock with the pitch, not the write-up", () => {
    const client = makeClient();
    client.setQueryData(queryKeys.me(), { email: "someone@example.com" });
    renderWith(client);
    const haze = screen.getByTestId("paywall-teaser");
    expect(haze).toHaveAttribute("aria-hidden", "true");
    expect(haze).toHaveTextContent(/interview/i);
    expect(haze).not.toHaveTextContent(
      /I used to jump straight into the code/i,
    );
  });

  it("sends the locked-out reader to the resume rather than straight to mail", () => {
    const client = makeClient();
    client.setQueryData(queryKeys.me(), { email: "someone@example.com" });
    renderWith(client);
    expect(screen.getByRole("link", { name: /get in touch/i })).toHaveAttribute(
      "href",
      "/resume?from=interview",
    );
  });

  it("keeps the gated prose out of the page entirely for a non-owner", () => {
    const client = makeClient();
    client.setQueryData(queryKeys.me(), { email: "someone@example.com" });
    const { container } = renderWith(client);
    expect(container.textContent).not.toMatch(
      /I used to jump straight into the code/i,
    );
  });

  it("says how a plan folder points back at its PR", () => {
    // Untracked plans used to leave nothing tying a plan to the change it
    // became. The folder carries the PR number now, and the write-up says so.
    const client = makeClient();
    client.setQueryData(queryKeys.me(), { email: "psumido@gmail.com" });
    const { container } = renderWith(client);
    expect(container.textContent).toMatch(/pr-<n>-<slug>/);
  });

  it("drops the haze once the owner can read the real thing", () => {
    const client = makeClient();
    client.setQueryData(queryKeys.me(), { email: "psumido@gmail.com" });
    renderWith(client);
    expect(screen.queryByTestId("paywall-teaser")).not.toBeInTheDocument();
  });

  it("unlocks the full write-up for the owner", () => {
    const client = makeClient();
    client.setQueryData(queryKeys.me(), { email: "psumido@gmail.com" });
    renderWith(client);
    expect(screen.getByTestId("gated-content")).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: /interview me first/i }),
    ).not.toBeInTheDocument();
  });
});
