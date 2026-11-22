import { describe, it, expect } from "vitest";
import { render, screen, within, fireEvent } from "@testing-library/react";
import { axe } from "@/test/a11y";
import PlaygroundHero from "./PlaygroundHero";
import ProjectCollection from "./ProjectCollection";
import FieldNotes from "./FieldNotes";
import { ThemeProvider } from "@/components/ThemeProvider";
import { FEATURES } from "@/app/_shared/featureData.data";

describe("portfolio playground", () => {
  it("switches scenes without losing its heading or resume link", () => {
    const { container } = render(<ThemeProvider><PlaygroundHero /></ThemeProvider>);
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Paul Sumido");
    expect(screen.getByRole("link", { name: /Resume/ })).toHaveAttribute("href", "/resume");
    fireEvent.click(screen.getByRole("radio", { name: "Perspective" }));
    expect(container.querySelector(".portrait-hero--tunnel")).not.toBeNull();
    fireEvent.click(screen.getByRole("radio", { name: "Corridor" }));
    expect(container.querySelector(".portrait-hero--corridor")).not.toBeNull();
    fireEvent.click(screen.getByRole("radio", { name: "Spiral" }));
    expect(container.querySelector(".portrait-hero--spiral")).not.toBeNull();
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
  });
  it("lets visitors pause the ambient hero motion", () => {
    render(<ThemeProvider><PlaygroundHero /></ThemeProvider>);
    fireEvent.click(screen.getByRole("button", { name: "Pause motion" }));
    expect(screen.getByRole("button", { name: "Resume motion" })).toHaveAttribute("aria-pressed", "true");
  });
  it("tells the hero to stop moving while paused, and starts it again on resume", () => {
    const { container } = render(<ThemeProvider><PlaygroundHero /></ThemeProvider>);
    const wrap = container.firstElementChild;
    expect(wrap).toHaveAttribute("data-paused", "false");
    fireEvent.click(screen.getByRole("button", { name: "Pause motion" }));
    expect(wrap).toHaveAttribute("data-paused", "true");
    fireEvent.click(screen.getByRole("button", { name: "Resume motion" }));
    expect(wrap).toHaveAttribute("data-paused", "false");
  });
  it("filters projects and restores the collection", () => {
    render(<ProjectCollection />);
    const collection = screen.getByRole("list", { name: "Projects" });
    expect(within(collection).getAllByRole("listitem")).toHaveLength(15);
    expect(screen.getByText("15 projects / All")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("radio", { name: "Play" }));
    expect(within(collection).getAllByRole("listitem")).toHaveLength(5);
    expect(screen.getByText("05 projects / Play")).toBeInTheDocument();
    expect(within(collection).getByRole("link", { name: /Explore Toronto/ })).toHaveAttribute("href", "/world");
    fireEvent.click(screen.getByRole("radio", { name: "Systems" }));
    expect(within(collection).getAllByRole("listitem")).toHaveLength(5);
    fireEvent.click(screen.getByRole("radio", { name: "All" }));
    expect(within(collection).getAllByRole("listitem")).toHaveLength(15);
  });
  it("gives every project an Open link and a link to its write-up, each named for the project", () => {
    render(<ProjectCollection />);
    const collection = screen.getByRole("list", { name: "Projects" });
    for (const row of within(collection).getAllByRole("listitem")) {
      const title = within(row).getByRole("heading", { level: 3 }).textContent ?? "";
      const feature = FEATURES.find((f) => f.title === title);
      expect(feature).toBeDefined();
      expect(within(row).getByRole("link", { name: `Open ${title}` })).toHaveAttribute("href", feature!.href);
      const writeUp = within(row).queryByRole("link", { name: `Read the ${title} write-up` });
      if (feature!.thoughtsHref) expect(writeUp).toHaveAttribute("href", feature!.thoughtsHref);
      else expect(writeUp).toBeNull();
    }
  });
  it("scrolls with the page instead of pinning the section and sliding the list sideways", () => {
    render(<ProjectCollection />);
    const section = screen.getByRole("region", { name: /Pick a rabbit hole/ });
    const collection = screen.getByRole("list", { name: "Projects" });
    expect(section.style.getPropertyValue("--scroll-height")).toBe("");
    fireEvent.scroll(window);
    expect(collection.style.transform).toBe("");
  });
  it("reveals write-ups as a hover menu with a browse-all link", () => {
    render(<ThemeProvider><FieldNotes /></ThemeProvider>);
    expect(screen.getByRole("link", { name: /Every write-up on this site/ })).toHaveAttribute("href", "/thoughts");
    expect(screen.getAllByRole("link").length).toBeGreaterThan(1);
  });
  it("sends a tile to its app's write-up, not to a generic page", () => {
    render(<ThemeProvider><FieldNotes /></ThemeProvider>);
    const feature = FEATURES.find((f) => f.id === "design-system");
    expect(feature?.thoughtsHref).toBeDefined();
    const tile = screen.getAllByAltText(feature!.title)[0].closest("a");
    expect(tile).toHaveAttribute("href", feature!.thoughtsHref);
  });
  it("shows the dark captures in the dark theme", () => {
    window.localStorage.setItem("theme-preference", "dark");
    try {
      render(<ThemeProvider><FieldNotes /></ThemeProvider>);
      const sources = screen.getAllByRole("img").map((img) => decodeURIComponent(img.getAttribute("src") ?? ""));
      expect(sources.length).toBeGreaterThan(0);
      for (const source of sources) expect(source).toContain("-dark.jpg");
    } finally {
      window.localStorage.clear();
    }
  });
  it("names the tile the pointer is over", () => {
    render(<ThemeProvider><FieldNotes /></ThemeProvider>);
    const tile = screen.getAllByRole("link").find((a) => a.querySelector("img"));
    expect(tile).toBeTruthy();
    const title = tile!.querySelector("img")!.getAttribute("alt");
    expect(title).toBeTruthy();
    fireEvent.pointerOver(tile!);
    expect(screen.getByText(title!)).toBeInTheDocument();
  });

  it("has no axe violations in the hero and project collection", async () => {
    const { container } = render(<ThemeProvider><PlaygroundHero /><ProjectCollection /></ThemeProvider>);
    expect(await axe(container)).toHaveNoViolations();
  });
});

describe("mobile hero scenes", () => {
  it("uses touch-first scenes and keeps one heading as the viewport changes", async () => {
    const { vi } = await import("vitest");
    const { act } = await import("@testing-library/react");
    let mobile = true;
    const listeners = new Set<() => void>();
    const original = window.matchMedia;
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: query.includes("700px") ? mobile : false, media: query,
      addEventListener: (_: string, listener: () => void) => { if (query.includes("700px")) listeners.add(listener); },
      removeEventListener: (_: string, listener: () => void) => listeners.delete(listener),
    }));
    try {
      const { container, unmount } = render(<ThemeProvider><PlaygroundHero /></ThemeProvider>);
      expect(screen.getByRole("slider", { name: "Scrub projects" })).toBeInTheDocument();
      expect(screen.queryByRole("button", { name: "Pause motion" })).not.toBeInTheDocument();
      fireEvent.click(screen.getByRole("radio", { name: "Orbit" }));
      expect(screen.getByRole("slider", { name: "Rotate project dial" })).toBeInTheDocument();
      fireEvent.click(screen.getByRole("radio", { name: "Lens" }));
      expect(screen.getByRole("button", { name: "Move magnifying lens" })).toBeInTheDocument();
      expect(container.querySelector(".portrait-hero")).toBeNull();
      expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
      expect(screen.getByRole("link", { name: /Resume/ })).toHaveAttribute("href", "/resume");
      act(() => { mobile = false; listeners.forEach(listener => listener()); });
      expect(screen.getByRole("radio", { name: "Spiral" })).toBeInTheDocument();
      expect(container.querySelector(".portrait-hero--spiral")).not.toBeNull();
      expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
      act(() => { mobile = true; listeners.forEach(listener => listener()); });
      expect(screen.getByRole("button", { name: "Move magnifying lens" })).toBeInTheDocument();
      unmount();
      expect(listeners.size).toBe(0);
    } finally { window.matchMedia = original; }
  });
});
