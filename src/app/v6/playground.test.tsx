import { describe, it, expect } from "vitest";
import { render, screen, within, fireEvent } from "@testing-library/react";
import { axe } from "@/test/a11y";
import PlaygroundHero from "./PlaygroundHero";
import ProjectCollection from "./ProjectCollection";
import FieldNotes from "./FieldNotes";
import { ThemeProvider } from "@/components/ThemeProvider";

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
  it("filters projects and restores the collection", () => {
    render(<ProjectCollection />);
    const collection = screen.getByRole("list", { name: "Projects" });
    expect(within(collection).getAllByRole("listitem")).toHaveLength(14);
    fireEvent.click(screen.getByRole("radio", { name: "Play" }));
    expect(within(collection).getAllByRole("listitem")).toHaveLength(5);
    expect(within(collection).getByRole("link", { name: /Explore Toronto/ })).toHaveAttribute("href", "/world");
    fireEvent.click(screen.getByRole("radio", { name: "Systems" }));
    expect(within(collection).getAllByRole("listitem")).toHaveLength(5);
    fireEvent.click(screen.getByRole("radio", { name: "All" }));
    expect(within(collection).getAllByRole("listitem")).toHaveLength(14);
  });
  it("reveals write-ups as a hover menu with a browse-all link", () => {
    render(<ThemeProvider><FieldNotes /></ThemeProvider>);
    expect(screen.getByRole("link", { name: /Every write-up on this site/ })).toHaveAttribute("href", "/thoughts");
    expect(screen.getAllByRole("link").length).toBeGreaterThan(1);
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
