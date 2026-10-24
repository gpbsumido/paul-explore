import { describe, it, expect, vi } from "vitest";
import { render as rtlRender, screen, within } from "@testing-library/react";
import type { ReactElement } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { axe } from "vitest-axe";
import WelcomeContent from "./WelcomeContent";
import { INTRO_SCENES } from "@/lib/evar/introScenes";
import { HOW_TO_SCENES } from "@/lib/evar/howToScenes";

vi.mock("@/components/PageHeader", () => ({ default: () => null }));

const render = (ui: ReactElement) =>
  rtlRender(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>{ui}</QueryClientProvider>);

describe("WelcomeContent", () => {
  it("opens with what EVAR Sizing is and a way to start practising", () => {
    render(<WelcomeContent />);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(/aneurysm repair/i);
    expect(screen.getAllByRole("link", { name: /start practising/i })[0]).toHaveAttribute("href", "/evar");
  });

  it("plays both videos only when asked, each with a poster and controls", () => {
    const { container } = render(<WelcomeContent />);
    const videos = [
      { src: "/evar/welcome/intro.mp4", poster: "/evar/welcome/intro-poster.png" },
      { src: "/evar/welcome/how-to-measure.mp4", poster: "/evar/welcome/how-to-measure-poster.png" },
    ];
    for (const { src, poster } of videos) {
      const video = container.querySelector(`source[src="${src}"]`)?.parentElement ?? null;
      expect(video?.tagName, src).toBe("VIDEO");
      expect(video).toHaveAttribute("controls");
      expect(video).not.toHaveAttribute("autoplay");
      expect(video).toHaveAttribute("poster", poster);
      expect(video?.querySelector("source")).toHaveAttribute("type", "video/mp4");
    }
  });

  it("puts what each video shows into words beside it", () => {
    render(<WelcomeContent />);
    const intro = screen.getByRole("group", { name: /what the intro shows/i });
    for (const scene of INTRO_SCENES) expect(intro).toHaveTextContent(scene.caption);
    const howTo = screen.getByRole("group", { name: /what the how-to shows/i });
    for (const scene of HOW_TO_SCENES) expect(howTo).toHaveTextContent(scene.caption);
  });

  it("sends learners to the full guide, from the top and from the how-to video", () => {
    render(<WelcomeContent />);
    expect(screen.getByRole("link", { name: /^how to measure$/i })).toHaveAttribute("href", "/evar/guide");
    expect(screen.getByRole("link", { name: /read the full guide/i })).toHaveAttribute("href", "/evar/guide");
  });

  it("marks this browser as welcomed, so the practice won't send it back here", () => {
    render(<WelcomeContent />);
    expect(window.localStorage.getItem("evar-welcomed")).toBe("true");
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
