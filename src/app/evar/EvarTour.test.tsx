import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import EvarContent from "./EvarContent";

vi.mock("@/components/PageHeader", () => ({ default: () => null }));

const TOUR_KEY = "evar-tour-seen";

const renderPage = () =>
  render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <EvarContent />
    </QueryClientProvider>,
  );

const tour = () => screen.getByRole("dialog", { name: /tour/i });
const next = () => fireEvent.click(within(tour()).getByRole("button", { name: /^next$/i }));

describe("EVAR guided tour", () => {
  // The study is asked about first; these tests are about what comes after it.
  beforeEach(() => {
    window.localStorage.clear();
    window.localStorage.setItem("evar-study-asked", "true");
  });

  it("asks before touring on a first visit", async () => {
    renderPage();
    await screen.findByRole("dialog", { name: /tour/i });
    expect(within(tour()).getByText(/take a quick tour/i)).toBeInTheDocument();
    expect(within(tour()).getByRole("button", { name: /^next$/i })).toBeInTheDocument();
    expect(within(tour()).getByRole("button", { name: /^skip$/i })).toBeInTheDocument();
  });

  it("stays closed once it's been seen, and the button opens it again", () => {
    window.localStorage.setItem(TOUR_KEY, "true");
    renderPage();
    expect(screen.queryByRole("dialog", { name: /tour/i })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: /tour$/i }));
    expect(tour()).toBeInTheDocument();
  });

  it("walks the page from the levels to checking answers, then finishes", () => {
    window.localStorage.setItem(TOUR_KEY, "true");
    renderPage();
    fireEvent.click(screen.getByRole("button", { name: /tour$/i }));
    const expected = [/plan a repair/i, /levels/i, /cases/i, /the scan/i, /measurements/i, /devices/i, /check answers/i];
    expected.forEach((title) => {
      next();
      expect(within(tour()).getByRole("heading", { name: title })).toBeInTheDocument();
    });
    fireEvent.click(within(tour()).getByRole("button", { name: /finish/i }));
    expect(screen.queryByRole("dialog", { name: /tour/i })).toBeNull();
  });

  it("opens the Size the graft tab when it gets to the devices", () => {
    window.localStorage.setItem(TOUR_KEY, "true");
    renderPage();
    fireEvent.click(screen.getByRole("button", { name: /tour$/i }));
    for (let i = 0; i < 6; i += 1) next();
    expect(within(tour()).getByRole("heading", { name: /devices/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /size the graft/i })).toHaveAttribute("aria-selected", "true");
  });

  it("closes straight away when skipped", async () => {
    renderPage();
    fireEvent.click(await screen.findByRole("button", { name: /^skip$/i }));
    expect(screen.queryByRole("dialog", { name: /tour/i })).toBeNull();
  });
});
