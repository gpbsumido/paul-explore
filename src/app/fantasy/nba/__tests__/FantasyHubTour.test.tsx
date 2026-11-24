import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "@/components/ThemeProvider";
import FantasyHubContent from "../FantasyHubContent";

vi.mock("next/navigation", () => ({
  usePathname: () => "/fantasy/nba",
}));

function renderHub() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <ThemeProvider>
        <FantasyHubContent />
      </ThemeProvider>
    </QueryClientProvider>,
  );
}

describe("Fantasy hub guided tour", () => {
  beforeEach(() => window.localStorage.clear());

  it("exposes a Take the tour button and the anchors it points at", () => {
    window.localStorage.setItem("fantasy-tour-seen", "true");
    renderHub();
    expect(
      screen.getByRole("button", { name: /take the tour/i }),
    ).toBeInTheDocument();
    expect(document.getElementById("fx-hub-title")).not.toBeNull();
    expect(document.getElementById("fx-nav")).not.toBeNull();
    expect(document.getElementById("fx-page-grid")).not.toBeNull();
  });

  it("opens the tour on the consent step and walks into it", () => {
    window.localStorage.setItem("fantasy-tour-seen", "true");
    renderHub();
    fireEvent.click(screen.getByRole("button", { name: /take the tour/i }));
    const tour = () => screen.getByRole("dialog", { name: /tour/i });
    expect(
      within(tour()).getByRole("button", { name: /^next$/i }),
    ).toBeInTheDocument();
    fireEvent.click(
      within(tour()).getByRole("button", { name: /^next$/i }),
    );
    // The consent step's own body also says "Fantasy NBA hub", so match the
    // second step's exact title and check the first one has gone.
    expect(within(tour()).getByText("The Fantasy NBA hub")).toBeInTheDocument();
    expect(within(tour()).queryByText("Take a quick tour?")).not.toBeInTheDocument();
  });

  it("opens by itself on a first visit and remembers it was seen", () => {
    renderHub();
    expect(screen.getByRole("dialog", { name: /tour/i })).toBeInTheDocument();
    fireEvent.keyDown(document.activeElement ?? document.body, { key: "Escape" });
    expect(window.localStorage.getItem("fantasy-tour-seen")).toBe("true");
  });

  it("points every tour step at an element that is on the page", () => {
    window.localStorage.setItem("fantasy-tour-seen", "true");
    renderHub();
    fireEvent.click(screen.getByRole("button", { name: /take the tour/i }));
    const tour = () => screen.getByRole("dialog", { name: /tour/i });
    for (const title of ["The Fantasy NBA hub", "Jump anywhere", "Pick a tool"]) {
      fireEvent.click(within(tour()).getByRole("button", { name: /^next$/i }));
      expect(within(tour()).getByText(title)).toBeInTheDocument();
    }
  });
});
