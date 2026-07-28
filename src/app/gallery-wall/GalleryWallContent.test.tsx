import { describe, it, expect, vi } from "vitest";
import { render, screen, within, fireEvent } from "@testing-library/react";
import { axe } from "vitest-axe";
import GalleryWallContent from "./GalleryWallContent";
import type { GalleryState, FramedImage } from "./_lib/state";

vi.mock("@/components/PageHeader", () => ({ default: () => null }));

const framed = (id: string, aspect: number, frame: FramedImage["frame"]): FramedImage => ({
  id,
  src: `blob:${id}`,
  aspect,
  frame,
});

const seededState = (overrides: Partial<GalleryState> = {}): GalleryState => ({
  images: [
    framed("a", 0.8, { sizeId: "8x10", orientation: "portrait" }),
    framed("b", 1.5, { sizeId: "11x14", orientation: "landscape" }),
  ],
  wall: { width: 96, height: 60 },
  gap: 3,
  ...overrides,
});

describe("GalleryWallContent", () => {
  it("renders the heading and a labelled upload control", () => {
    render(<GalleryWallContent initialState={seededState()} />);
    expect(
      screen.getByRole("heading", { level: 1, name: /gallery wall/i }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/add photos/i)).toBeInTheDocument();
  });

  it("shows the wall size inputs seeded from state", () => {
    render(<GalleryWallContent initialState={seededState()} />);
    expect(screen.getByLabelText(/wall width/i)).toHaveValue(96);
    expect(screen.getByLabelText(/wall height/i)).toHaveValue(60);
  });

  it("renders the to-scale preview with one frame per photo", () => {
    const { container } = render(<GalleryWallContent initialState={seededState()} />);
    expect(screen.getByRole("img", { name: /gallery wall preview/i })).toBeInTheDocument();
    expect(container.querySelectorAll("svg image")).toHaveLength(2);
  });

  it("lets me change a single photo's frame size", () => {
    render(<GalleryWallContent initialState={seededState()} />);
    const group = screen.getByRole("group", { name: "Photo 1" });
    const select = within(group).getByLabelText(/frame size/i);
    fireEvent.change(select, { target: { value: "16x20" } });
    expect(select).toHaveValue("16x20");
  });

  it("lets me flip a single photo's orientation", () => {
    render(<GalleryWallContent initialState={seededState()} />);
    const group = screen.getByRole("group", { name: "Photo 1" });
    const landscape = within(group).getByRole("button", { name: /landscape/i });
    expect(landscape).toHaveAttribute("aria-pressed", "false");
    fireEvent.click(landscape);
    expect(landscape).toHaveAttribute("aria-pressed", "true");
  });

  it("removes a photo", () => {
    const { container } = render(<GalleryWallContent initialState={seededState()} />);
    const group = screen.getByRole("group", { name: "Photo 1" });
    fireEvent.click(within(group).getByRole("button", { name: /remove/i }));
    expect(container.querySelectorAll("svg image")).toHaveLength(1);
  });

  it("warns when the frames overflow the wall", () => {
    render(
      <GalleryWallContent initialState={seededState({ wall: { width: 12, height: 12 } })} />,
    );
    expect(screen.getByText(/fit the wall/i)).toBeInTheDocument();
  });

  it("does not warn when everything fits", () => {
    render(<GalleryWallContent initialState={seededState()} />);
    expect(screen.queryByText(/fit the wall/i)).not.toBeInTheDocument();
  });

  it("converts the wall size when switching to centimetres", () => {
    render(<GalleryWallContent initialState={seededState()} />);
    fireEvent.change(screen.getByLabelText(/units/i), { target: { value: "cm" } });
    // 96 inches is about 244 cm.
    expect(screen.getByLabelText(/wall width/i)).toHaveValue(244);
  });

  it("has no accessibility violations", async () => {
    const { container } = render(<GalleryWallContent initialState={seededState()} />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
