import { describe, it, expect } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "@/components/ThemeProvider";
import EventDelegationContent from "./EventDelegationContent";

function renderPage() {
  render(
    <QueryClientProvider client={new QueryClient()}>
      <ThemeProvider>
        <EventDelegationContent />
      </ThemeProvider>
    </QueryClientProvider>,
  );
}

describe("EventDelegationContent", () => {
  it("builds the delegated demo as a list of buttons, still served by one handler", async () => {
    const user = userEvent.setup();
    renderPage();
    const list = screen.getByRole("list", { name: "Delegated click demo list" });
    const items = within(list).getAllByRole("button");
    expect(items).toHaveLength(50);

    // A keyboard press fires a click on the focused button, which bubbles to
    // the list's single handler: delegation works for keyboard users too.
    items[6].focus();
    await user.keyboard("{Enter}");
    expect(items[6]).toHaveClass("bg-foreground/10");
  });

  it("delegates clicks on items added after load, including from their inner text", async () => {
    const user = userEvent.setup();
    renderPage();
    await user.click(screen.getByRole("button", { name: "Add item" }));
    const list = screen.getByRole("list", { name: "Dynamic items list" });
    const added = within(list).getByRole("button", { name: /Item 4/ });

    await user.click(within(added).getByText("added dynamically"));
    expect(added).toHaveClass("bg-foreground/10");
  });
});
