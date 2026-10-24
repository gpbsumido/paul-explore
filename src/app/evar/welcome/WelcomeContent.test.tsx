import { describe, it, expect, vi } from "vitest";
import { render as rtlRender, screen, within } from "@testing-library/react";
import type { ReactElement } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { axe } from "vitest-axe";
import WelcomeContent from "./WelcomeContent";
import { INTRO_SCENES } from "@/lib/evar/introScenes";

vi.mock("@/components/PageHeader", () => ({ default: () => null }));

const render = (ui: ReactElement) =>
  rtlRender(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>{ui}</QueryClientProvider>);

describe("WelcomeContent", () => {
  it("opens with what EVAR Sizing is and a way to start practising", () => {
    render(<WelcomeContent />);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(/aneurysm repair/i);
    expect(screen.getAllByRole("link", { name: /start practising/i })[0]).toHaveAttribute("href", "/evar");
  });

  it("plays the intro video only when asked, with a poster and controls", () => {
    const { container } = render(<WelcomeContent />);
    const video = container.querySelector("video");
    expect(video).not.toBeNull();
    expect(video).toHaveAttribute("controls");
    expect(video).not.toHaveAttribute("autoplay");
    expect(video).toHaveAttribute("poster", "/evar/welcome/intro-poster.png");
    expect(video?.querySelector("source")).toHaveAttribute("src", "/evar/welcome/intro.mp4");
    expect(video?.querySelector("source")).toHaveAttribute("type", "video/mp4");
  });

  it("puts what the video shows into words beside it", () => {
    render(<WelcomeContent />);
    const transcript = screen.getByRole("group", { name: /what the video shows/i });
    for (const scene of INTRO_SCENES) expect(transcript).toHaveTextContent(scene.caption);
  });

  it("says what we're doing and links to the plan", () => {
    render(<WelcomeContent />);
    expect(screen.getByRole("heading", { level: 2, name: /what we.re doing/i })).toBeInTheDocument();
    expect(screen.getAllByRole("link").some((a) => a.getAttribute("href") === "/evar/plan")).toBe(true);
  });

  it("asks about the study on the page", async () => {
    render(<WelcomeContent />);
    const study = screen.getByRole("region", { name: /join the study/i });
    expect(await within(study).findByRole("link", { name: /practise without joining/i })).toHaveAttribute("href", "/evar");
  });

  it("uses no em or en dashes anywhere in its text", () => {
    const { container } = render(<WelcomeContent />);
    expect(container.textContent).not.toMatch(/[–—]/);
  });

  it("has no detectable accessibility problems", async () => {
    const { container } = render(<WelcomeContent />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
